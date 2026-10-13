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
  assert.equal(calls, 8);
});

test("checks all independent source families and marks unavailable sources separately", async () => {
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
  assert.equal(result.source_count, 8);
  assert.equal(result.source_available_count, 7);
  assert.equal(calls.length, 8);
  assert.ok(result.sources.some((source) => source.id === "isp" && source.state === "unavailable"));
  assert.ok(result.sources.some((source) => source.id === "ooni" && source.state === "available"));
  assert.equal(result.operator_count, 2);
  assert.match(result.overall_fa, /اختلال/);
});

test("source failure returns unavailable rather than inferring the internet is healthy or down", async () => {
  const result = await getNetworkStatus({}, { fetchImpl: async () => { throw new Error("offline"); } });
  assert.equal(result.status, "unavailable");
  assert.equal(result.source_available_count, 0);
  assert.equal(result.sources.length, 8);
  assert.match(result.overall_fa, /قابل دریافت ندادند/);
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


test("successful upstream JSON with sparse operator samples is not proof of healthy connectivity", async () => {
  const sparse = { data: [{ operator: "Asiatech", score: 0 }] };
  const result = await getNetworkStatus({}, {
    fetchImpl: async () => new Response(JSON.stringify(sparse), {
      status: 200,
      headers: { "content-type": "application/json" }
    })
  });
  assert.equal(result.status, "available");
  assert.equal(result.operator_count, 1);
  assert.match(result.overall_fa, /برای تأیید سلامت اینترنت کافی نیستند/);
  assert.equal(result.sources.find((source) => source.id === "arvancloud")?.interpreted, true);
  assert.ok(result.sources.filter((source) => source.id !== "arvancloud").every((source) => source.interpreted === false));
  assert.match(formatNetworkStatusFa(result), /منابع \(8\/8\)/);
});

test("network evidence is summarized by the configured Workers AI model when available", async () => {
  let aiCalls = 0;
  const result = await getNetworkStatus({ AI: { run: async (model, options) => {
    aiCalls += 1;
    assert.equal(model, "@cf/qwen/qwen3-30b-a3b-fp8");
    assert.match(options.prompt, /شواهد/);
    return {
      response: JSON.stringify({
        summary: "داده‌های چند منبع دریافت شد؛ شواهد فعلی برای تعیین مسیر برتر بازی کافی نیست.",
        findings: ["زمان پاسخ منبع با پینگ بازی یکسان نیست."],
        recommendations: ["از همان دستگاه بازی و اتصال جایگزین را مقایسه کن."],
        confidence: "کم"
      })
    };
  } } }, {
    fetchImpl: async () => new Response(JSON.stringify(fixture), {
      status: 200,
      headers: { "content-type": "application/json" }
    })
  });
  assert.equal(aiCalls, 1);
  assert.equal(result.analysis_provider, "cloudflare_workers_ai");
  assert.equal(result.overall_fa, "داده‌های چند منبع دریافت شد؛ شواهد فعلی برای تعیین مسیر برتر بازی کافی نیست.");
  assert.equal(result.findings_fa[0], "زمان پاسخ منبع با پینگ بازی یکسان نیست.");
  assert.equal(result.confidence, "کم");
});

test("rule-based analysis remains available when no AI binding is configured", async () => {
  const result = await getNetworkStatus({}, {
    fetchImpl: async () => new Response(JSON.stringify(fixture), {
      status: 200,
      headers: { "content-type": "application/json" }
    })
  });
  assert.equal(result.analysis_provider, "rule_based_fallback");
  assert.ok(result.findings_fa.length > 0);
  assert.ok(result.recommendations_fa.length > 0);
  assert.match(formatNetworkStatusFa(result), /جمع‌بندی شواهد/);
  assert.match(formatNetworkStatusFa(result), /پیشنهادهای بعدی/);
});
