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

test("worker integration keeps the legacy Telegram POST root route", async () => {
  const response = await worker.fetch(request("/", "POST", {}), {});
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
