import test from "node:test";
import assert from "node:assert/strict";
import { calculateQuality, classifyAccess, createGameDiagnostic, getGameCatalog, handleGameConnect } from "../src/game-connect.js";

function request(path, method = "GET", body) {
  return new Request("https://atlas.example" + path, {
    method,
    headers: body === undefined ? {} : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

const allowRateLimit = { async limit() { return { success: true }; } };

function memoryKV() {
  const values = new Map();
  return {
    async put(key, value) { values.set(key, JSON.parse(value)); },
    async get(key) { return values.get(key) ?? null; }
  };
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
  assert.ok(data.games.every((game) => game.source_url.startsWith("https://")));
  assert.ok(data.games.every((game) => game.measurement_scope_fa.includes("سرور اطلس")));
});

test("shared diagnostic helper returns a source-aware result for bot and website", async () => {
  const diagnostic = await createGameDiagnostic("steam", {
    ATLAS_KV: memoryKV()
  }, {
    fetchImpl: async () => new Response('{"response":{}}', { status: 200 })
  });
  assert.equal(diagnostic.status, 201);
  assert.equal(diagnostic.body.game.id, "steam");
  assert.ok(diagnostic.body.source.url.startsWith("https://"));
  assert.equal(diagnostic.body.access.source_url, diagnostic.body.source.url);
  assert.equal(diagnostic.body.quality.state, "not_measured");
  assert.ok(getGameCatalog().some((game) => game.id === "steam" && game.source_url));
});

test("malformed JSON is rejected", async () => {
  const response = await handleGameConnect(new Request("https://atlas.example/api/v1/diagnostics", {
    method: "POST", headers: { "content-type": "application/json" }, body: "{"
  }), { DIAGNOSTIC_LIMITER: allowRateLimit });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "invalid_json");
});

test("oversized diagnostic payload is rejected", async () => {
  const response = await handleGameConnect(new Request("https://atlas.example/api/v1/diagnostics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ game: "steam", extra: "x".repeat(3000) })
  }), { DIAGNOSTIC_LIMITER: allowRateLimit });
  assert.equal(response.status, 413);
});

test("oversized streamed body is cancelled as soon as the limit is crossed", async () => {
  let cancelled = false;
  const body = new ReadableStream({
    pull(controller) { controller.enqueue(new Uint8Array(2049)); },
    cancel() { cancelled = true; }
  });
  const response = await handleGameConnect(new Request("https://atlas.example/api/v1/diagnostics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    duplex: "half"
  }), { DIAGNOSTIC_LIMITER: allowRateLimit });
  assert.equal(response.status, 413);
  assert.equal(cancelled, true);
});

test("diagnostic creation fails closed when rate limiting is not configured", async () => {
  let called = false;
  const response = await handleGameConnect(request("/api/v1/diagnostics", "POST", { game: "steam" }), {}, {
    fetchImpl: async () => { called = true; return new Response("ok"); }
  });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, "rate_limit_unavailable");
  assert.equal(called, false);
});

test("rate-limited diagnostic creation does not run the outbound probe", async () => {
  let called = false;
  const response = await handleGameConnect(request("/api/v1/diagnostics", "POST", { game: "steam" }), {
    DIAGNOSTIC_LIMITER: { async limit() { return { success: false }; } }
  }, { fetchImpl: async () => { called = true; return new Response("ok"); } });
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "60");
  assert.equal(called, false);
});

test("unsupported game is rejected without a network request", async () => {
  let called = false;
  const response = await handleGameConnect(request("/api/v1/diagnostics", "POST", { game: "https://example.com" }), {
    DIAGNOSTIC_LIMITER: allowRateLimit
  }, {
    fetchImpl: async () => { called = true; throw new Error("must not run"); }
  });
  assert.equal(response.status, 422);
  assert.equal(called, false);
});

test("diagnostic separates access from unmeasured game quality", async () => {
  const response = await handleGameConnect(request("/api/v1/diagnostics", "POST", { game: "steam" }), {
    DIAGNOSTIC_LIMITER: allowRateLimit,
    ATLAS_KV: memoryKV()
  }, {
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
  const response = await handleGameConnect(request("/api/v1/diagnostics", "POST", { game: "steam" }), {
    DIAGNOSTIC_LIMITER: allowRateLimit,
    ATLAS_KV: memoryKV()
  }, {
    fetchImpl: async () => { const error = new Error("timeout"); error.name = "TimeoutError"; throw error; }
  });
  const result = await response.json();
  assert.equal(result.access.state, "inconclusive");
  assert.equal(result.quality.state, "not_measured");
});

test("HTTP 403 is classified as destination rejection, not successful access", async () => {
  const response = await handleGameConnect(request("/api/v1/diagnostics", "POST", { game: "epic-games" }), {
    DIAGNOSTIC_LIMITER: allowRateLimit,
    ATLAS_KV: memoryKV()
  }, {
    fetchImpl: async () => new Response("denied", { status: 403 })
  });
  const result = await response.json();
  assert.equal(result.access.state, "restricted");
  assert.equal(result.access.http_status, 403);
  assert.match(result.access.note_fa, /به‌تنهایی فیلترینگ/);
});

test("Steam probe uses the official public server-info endpoint", async () => {
  let requestedUrl = "";
  const response = await handleGameConnect(request("/api/v1/diagnostics", "POST", { game: "steam" }), {
    DIAGNOSTIC_LIMITER: allowRateLimit,
    ATLAS_KV: memoryKV()
  }, {
    fetchImpl: async (url) => {
      requestedUrl = String(url);
      return new Response('{"response":{}}', { status: 200 });
    }
  });
  const result = await response.json();
  assert.equal(response.status, 201);
  assert.equal(result.access.state, "reachable");
  assert.match(requestedUrl, /^https:\/\/api\.steampowered\.com\/ISteamWebAPIUtil\/GetServerInfo\/v1\/$/);
});

test("HTTP 429 and 5xx are classified separately from access success", async () => {
  for (const [status, expectedState] of [[429, "rate_limited"], [503, "server_error"]]) {
    const response = await handleGameConnect(request("/api/v1/diagnostics", "POST", { game: "epic-games" }), {
      DIAGNOSTIC_LIMITER: allowRateLimit,
      ATLAS_KV: memoryKV()
    }, {
      fetchImpl: async () => new Response("error", { status })
    });
    const result = await response.json();
    assert.equal(result.access.state, expectedState);
    assert.equal(result.access.http_status, status);
  }
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
  const kv = memoryKV();
  const created = await handleGameConnect(request("/api/v1/diagnostics", "POST", { game: "steam" }), {
    ATLAS_KV: kv,
    DIAGNOSTIC_LIMITER: allowRateLimit
  }, {
    fetchImpl: async () => new Response("ok", { status: 200 })
  });
  const diagnostic = await created.json();
  const fetched = await handleGameConnect(request("/api/v1/diagnostics/" + diagnostic.id), {
    ATLAS_KV: kv,
    DIAGNOSTIC_LIMITER: allowRateLimit
  });
  assert.equal(fetched.status, 200);
  assert.equal((await fetched.json()).id, diagnostic.id);
});


test("diagnostic creation fails explicitly when storage is missing", async () => {
  let called = false;
  const response = await handleGameConnect(request("/api/v1/diagnostics", "POST", { game: "steam" }), {
    DIAGNOSTIC_LIMITER: allowRateLimit
  }, { fetchImpl: async () => { called = true; return new Response("ok"); } });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, "storage_unavailable");
  assert.equal(called, false);
});

test("diagnostic creation reports KV write failure instead of returning an unsaved result", async () => {
  const response = await handleGameConnect(request("/api/v1/diagnostics", "POST", { game: "steam" }), {
    DIAGNOSTIC_LIMITER: allowRateLimit,
    ATLAS_KV: { async put() { throw new Error("KV unavailable"); } }
  }, { fetchImpl: async () => new Response("ok", { status: 200 }) });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, "storage_unavailable");
});

test("diagnostic retrieval reports unavailable storage explicitly", async () => {
  const response = await handleGameConnect(
    request("/api/v1/diagnostics/12345678-1234-1234-1234-123456789abc"),
    { DIAGNOSTIC_LIMITER: allowRateLimit }
  );
  assert.equal(response.status, 503);
});

test("unknown paths and unsupported methods return API errors", async () => {
  assert.equal((await handleGameConnect(request("/missing"))).status, 404);
  assert.equal((await handleGameConnect(request("/api/v1/diagnostics", "GET"))).status, 405);
});
