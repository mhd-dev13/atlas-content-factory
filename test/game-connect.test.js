import test from "node:test";
import assert from "node:assert/strict";
import { calculateQuality, classifyAccess, handleGameConnect } from "../src/game-connect.js";

function request(path, method = "GET", body) {
  return new Request("https://atlas.example" + path, {
    method,
    headers: body === undefined ? {} : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

test("health endpoint reports the service version", async () => {
  const response = await handleGameConnect(request("/health"));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).service, "atlas-game-connect");
});

test("game catalog does not expose arbitrary probe URLs", async () => {
  const response = await handleGameConnect(request("/api/v1/games"));
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.ok(data.games.some((game) => game.id === "steam"));
  assert.equal("endpoint" in data.games[0], false);
});

test("malformed JSON is rejected", async () => {
  const response = await handleGameConnect(new Request("https://atlas.example/api/v1/diagnostics", {
    method: "POST", headers: { "content-type": "application/json" }, body: "{"
  }));
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "invalid_json");
});

test("unsupported game is rejected without a network request", async () => {
  let called = false;
  const response = await handleGameConnect(request("/api/v1/diagnostics", "POST", { game: "https://example.com" }), {}, {
    fetchImpl: async () => { called = true; throw new Error("must not run"); }
  });
  assert.equal(response.status, 422);
  assert.equal(called, false);
});

test("diagnostic separates access from unmeasured game quality", async () => {
  const response = await handleGameConnect(request("/api/v1/diagnostics", "POST", { game: "steam" }), {}, {
    fetchImpl: async () => new Response("ok", { status: 200 })
  });
  const result = await response.json();
  assert.equal(response.status, 201);
  assert.equal(result.access.state, "reachable");
  assert.equal(result.access.observer, "cloudflare_worker");
  assert.equal(result.quality.state, "not_measured");
  assert.equal(result.quality.latency_ms, null);
  assert.match(result.conclusion_fa, /از دستگاه شما نیست/);
});

test("timeouts are inconclusive, not confirmed blocking", async () => {
  const response = await handleGameConnect(request("/api/v1/diagnostics", "POST", { game: "steam" }), {}, {
    fetchImpl: async () => { const error = new Error("timeout"); error.name = "TimeoutError"; throw error; }
  });
  const result = await response.json();
  assert.equal(result.access.state, "inconclusive");
  assert.equal(result.quality.state, "not_measured");
});

test("an HTTP error response still proves the endpoint responded", async () => {
  const response = await handleGameConnect(request("/api/v1/diagnostics", "POST", { game: "epic-games" }), {}, {
    fetchImpl: async () => new Response("denied", { status: 403 })
  });
  const result = await response.json();
  assert.equal(result.access.state, "reachable");
  assert.equal(result.access.http_status, 403);
});

test("quality calculation uses median latency and mean successive difference", () => {
  assert.deepEqual(calculateQuality([10, 20, 30]), {
    state: "measured", sample_count: 3, latency_ms: 20, jitter_ms: 10, packet_loss_pct: null
  });
});

test("quality metrics are unavailable with fewer than two samples", () => {
  assert.equal(calculateQuality([12]).state, "insufficient_data");
  assert.equal(calculateQuality([]).latency_ms, null);
});

test("access classifier distinguishes timeout from definite failure", () => {
  assert.equal(classifyAccess({ ok: true }), "reachable");
  assert.equal(classifyAccess({ ok: false, timedOut: true }), "inconclusive");
  assert.equal(classifyAccess({ ok: false }), "unreachable");
  assert.equal(classifyAccess({}), "inconclusive");
});

test("stored diagnostic can be retrieved by ID", async () => {
  const values = new Map();
  const kv = {
    async put(key, value) { values.set(key, JSON.parse(value)); },
    async get(key) { return values.get(key) ?? null; }
  };
  const created = await handleGameConnect(request("/api/v1/diagnostics", "POST", { game: "steam" }), { ATLAS_KV: kv }, {
    fetchImpl: async () => new Response("ok", { status: 200 })
  });
  const diagnostic = await created.json();
  const fetched = await handleGameConnect(request("/api/v1/diagnostics/" + diagnostic.id), { ATLAS_KV: kv });
  assert.equal(fetched.status, 200);
  assert.equal((await fetched.json()).id, diagnostic.id);
});

test("diagnostic retrieval reports unavailable storage explicitly", async () => {
  const response = await handleGameConnect(request("/api/v1/diagnostics/12345678-1234-1234-1234-123456789abc"));
  assert.equal(response.status, 503);
});

test("unknown paths and unsupported methods return API errors", async () => {
  assert.equal((await handleGameConnect(request("/missing"))).status, 404);
  assert.equal((await handleGameConnect(request("/api/v1/diagnostics", "GET"))).status, 405);
});
