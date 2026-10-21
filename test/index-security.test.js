import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

function request(path = "/", method = "GET", headers = {}, body) {
  return new Request("https://atlas.example" + path, { method, headers, body });
}

test("homepage sets baseline browser security headers", async () => {
  const response = await worker.fetch(request());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.match(response.headers.get("content-security-policy") || "", /frame-ancestors 'none'/);
});

test("webhook fails closed when secret is not configured", async () => {
  const response = await worker.fetch(request("/", "POST", { "content-type": "application/json" }, "{}"), {});
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, "webhook_not_configured");
});

test("webhook rejects missing or incorrect secret before parsing body", async () => {
  for (const headers of [
    { "content-type": "application/json" },
    { "content-type": "application/json", "x-telegram-bot-api-secret-token": "wrong" }
  ]) {
    const response = await worker.fetch(request("/", "POST", headers, "{invalid"), { TELEGRAM_WEBHOOK_SECRET: "test-secret" });
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error, "unauthorized");
  }
});

test("correct webhook secret allows a valid update", async () => {
  const response = await worker.fetch(request("/", "POST", {
    "content-type": "application/json",
    "x-telegram-bot-api-secret-token": "test-secret"
  }, "{}"), { TELEGRAM_WEBHOOK_SECRET: "test-secret" });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "OK");
});

test("unknown POST routes return 404 instead of being treated as webhooks", async () => {
  const response = await worker.fetch(request("/unexpected", "POST", {}, "{}"), { TELEGRAM_WEBHOOK_SECRET: "test-secret" });
  assert.equal(response.status, 404);
});
