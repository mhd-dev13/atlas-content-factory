import test from "node:test";
import assert from "node:assert/strict";
import { GAME_CONNECT_HTML } from "../src/game-connect-ui.js";

test("network dashboard keeps source chart collapsed and presents concise status cards", () => {
  assert.match(GAME_CONNECT_HTML, /<details class="more-details">/);
  assert.match(GAME_CONNECT_HTML, /id="personal-title"/);
  assert.match(GAME_CONNECT_HTML, /id="operator-title"/);
  assert.match(GAME_CONNECT_HTML, /id="iran-title"/);
  assert.match(GAME_CONNECT_HTML, /id="recommendation-title"/);
  assert.match(GAME_CONNECT_HTML, /id="symptom-select"/);
});

test("embedded browser JavaScript parses without syntax errors", () => {
  const match = GAME_CONNECT_HTML.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(match, "inline script exists");
  assert.doesNotThrow(() => new Function(match[1]));
});
