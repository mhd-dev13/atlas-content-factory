import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

function request(path = "/", method = "GET", headers = {}, body) {
  return new Request("https://atlas.example" + path, {
    method,
    headers,
    body
  });
}

test("homepage sets baseline browser security headers", async () => {
  const response = await worker.fetch(request());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.match(response.headers.get("content-security-policy") || "", /frame-ancestors 'none'/);
});

test("configured Telegram webhook secret rejects missing header before parsing body", async () => {
  const response = await worker.fetch(
    request("/", "POST", { "content-type": "application/json" }, "{invalid"),
    { TELEGRAM_WEBHOOK_SECRET: "test-secret" }
  );
  assert.equal(response.status, 403);
  assert.equal(await response.text(), "Forbidden");
});

test("configured Telegram webhook secret rejects an incorrect header", async () => {
  const response = await worker.fetch(
    request("/", "POST", {
      "content-type": "application/json",
      "x-telegram-bot-api-secret-token": "wrong"
    }, "{}"),
    { TELEGRAM_WEBHOOK_SECRET: "test-secret" }
  );
  assert.equal(response.status, 403);
});

test("correct Telegram webhook secret allows a valid update", async () => {
  const response = await worker.fetch(
    request("/", "POST", {
      "content-type": "application/json",
      "x-telegram-bot-api-secret-token": "test-secret"
    }, "{}"),
    { TELEGRAM_WEBHOOK_SECRET: "test-secret" }
  );
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "OK");
});

test("webhook remains compatible when no secret has been configured", async () => {
  const response = await worker.fetch(request("/", "POST", { "content-type": "application/json" }, "{}"), {});
  assert.equal(response.status, 200);
});
