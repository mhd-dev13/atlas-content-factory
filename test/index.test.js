import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

function request(path, method = "GET", body) {
  return new Request("https://atlas.example" + path, {
    method,
    headers: body === undefined ? {} : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

test("worker serves the Persian RTL UI at the root", async () => {
  const response = await worker.fetch(request("/"), {});
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.match(html, /dir="rtl"/);
  assert.match(html, /Atlas Game Connect/);
  assert.match(html, /api\/v1\/diagnostics/);
});

test("worker integration routes health to Game Connect", async () => {
  const response = await worker.fetch(request("/health"), {});
  assert.equal(response.status, 200);
  assert.equal((await response.json()).service, "atlas-game-connect");
});

test("worker integration routes the games catalog to Game Connect", async () => {
  const response = await worker.fetch(request("/api/v1/games"), {});
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.ok(data.games.some((game) => game.id === "steam"));
});

test("worker rejects Telegram webhook requests until a secret is configured", async () => {
  const response = await worker.fetch(request("/", "POST", {}), {});
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, "webhook_not_configured");
});

test("worker accepts Telegram webhook only with the configured secret", async () => {
  const response = await worker.fetch(new Request("https://atlas.example/", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-bot-api-secret-token": "test-secret"
    },
    body: "{}"
  }), { TELEGRAM_WEBHOOK_SECRET: "test-secret" });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "OK");
});

test("worker integration routes diagnostic POSTs to Game Connect, not Telegram", async () => {
  const response = await worker.fetch(request("/api/v1/diagnostics", "POST", { game: "steam" }), {});
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, "rate_limit_unavailable");
});

test("worker integration answers API preflight requests", async () => {
  const response = await worker.fetch(request("/api/v1/games", "OPTIONS"), {});
  assert.equal(response.status, 204);
});

test("worker does not route unrelated OPTIONS requests into Game Connect", async () => {
  const response = await worker.fetch(request("/unrelated", "OPTIONS"), {});
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/plain/);
});
