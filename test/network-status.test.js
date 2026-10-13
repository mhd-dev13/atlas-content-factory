import test from "node:test";
import assert from "node:assert/strict";
import { formatNetworkStatusFa, getNetworkStatus, handleNetworkStatus, normalizeArvanRadar } from "../src/network-status.js";

function memoryKV() {
  const values = new Map();
  return {
    async get(key) { return values.get(key) ?? null; },
    async put(key, value) { values.set(key, JSON.parse(value)); }
  };
}

const fixture = {
  data: [
    { operator: "Hamrah Aval", service: "Google", score: 0, timestamp: "2026-10-13T18:00:00Z" },
    { operator: "Hamrah Aval", service: "GitHub", score: 2, timestamp: "2026-10-13T18:00:00Z" },
    { operator: "Irancell", service: "Google", score: 0, timestamp: "2026-10-13T18:00:00Z" }
  ]
};

test("normalizes Arvan radar records into operator-level status without claiming user-device measurements", () => {
  const result = normalizeArvanRadar(fixture, "2026-10-13T18:01:00Z");
  assert.equal(result.status, "available");
  assert.equal(result.operator_count, 2);
  const mci = result.operators.find((item) => item.operator === "همراه اول");
  assert.equal(mci.checked_services, 2);
  assert.equal(mci.disrupted_services, 1);
  assert.match(result.limitations_fa, /نه از سیم‌کارت یا مودم شخص شما/);
});

test("unrecognized or empty source schema does not become a false healthy status", () => {
  const result = normalizeArvanRadar({ unexpected: { payload: true } });
  assert.equal(result.status, "unavailable");
  assert.equal(result.operator_count, 0);
  assert.match(result.overall_fa, /دادهٔ کافی/);
});

test("network status uses short cache and falls back to stale data when source fails", async () => {
  const kv = memoryKV();
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return new Response(JSON.stringify(fixture), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };
  const first = await getNetworkStatus({ ATLAS_KV: kv }, { fetchImpl });
  const second = await getNetworkStatus({ ATLAS_KV: kv }, { fetchImpl: async () => { throw new Error("should use cache"); } });
  assert.equal(first.status, "available");
  assert.equal(second.cache, "hit");
  assert.equal(calls, 1);
});

test("falls back to the ISP endpoint when the first documented source fails", async () => {
  const calls = [];
  const result = await getNetworkStatus({}, {
    fetchImpl: async (url) => {
      calls.push(url);
      if (url.includes("/isp/current")) throw new Error("temporary upstream failure");
      return new Response(JSON.stringify(fixture), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }
  });
  assert.equal(result.status, "available");
  assert.equal(calls.length, 2);
  assert.match(calls[0], /\/isp\/current$/);
  assert.match(calls[1], /\/connectivity\/isp-site-matrix$/);
});

test("source failure returns unavailable rather than inferring the internet is healthy or down", async () => {
  const result = await getNetworkStatus({}, { fetchImpl: async () => { throw new Error("offline"); } });
  assert.equal(result.status, "unavailable");
  assert.match(result.overall_fa, /قابل دریافت نیست/);
});

test("Telegram summary hides provider URLs but reports the measurement limitation", () => {
  const result = normalizeArvanRadar(fixture);
  const message = formatNetworkStatusFa(result);
  assert.match(message, /همراه اول/);
  assert.match(message, /ایرانسل/);
  assert.doesNotMatch(message, /https:\/\//);
  assert.match(message, /داده‌ها از نقاط پایش/);
});

test("network status endpoint allows GET and rejects other methods", async () => {
  const get = await handleNetworkStatus(new Request("https://atlas.example/api/v1/network-status"), {}, {
    fetchImpl: async () => new Response(JSON.stringify(fixture), {
      status: 200,
      headers: { "content-type": "application/json" }
    })
  });
  assert.equal(get.status, 200);
  assert.equal((await get.json()).status, "available");
  const post = await handleNetworkStatus(new Request("https://atlas.example/api/v1/network-status", { method: "POST" }), {});
  assert.equal(post.status, 405);
});


test("limited single-destination samples are not presented as healthy", () => {
  const sparse = {
    data: [
      { operator: "Asiatech", score: 0 },
      { operator: "Irancell", score: 0 }
    ]
  };
  const result = normalizeArvanRadar(sparse);
  assert.match(result.overall_fa, /برای تأیید سلامت اینترنت کافی نیستند/);
  assert.ok(result.operators.every((item) => item.status === "دادهٔ محدود"));
  const message = formatNetworkStatusFa(result);
  assert.match(message, /⚪️/);
  assert.match(message, /دادهٔ محدود/);
  assert.doesNotMatch(message, /🟢 آسیاتک: عادی/);
});
