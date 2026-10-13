import test from "node:test";
import assert from "node:assert/strict";
import { routeUpdate } from "../src/router.js";

function telegramMock() {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    const urlText = String(url);
    if (urlText.includes("iranblock.com")) {
      return new Response(JSON.stringify({
        data: [
          { operator: "Hamrah Aval", service: "Google", score: 0 },
          { operator: "Irancell", service: "GitHub", score: 2 }
        ]
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (urlText.includes("api.telegram.org")) {
      calls.push(JSON.parse(options.body || "{}"));
      return new Response(JSON.stringify({ ok: true, result: { message_id: calls.length } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }
    return new Response('{"response":{}}', { status: 200 });
  };
  return {
    calls,
    restore() { globalThis.fetch = originalFetch; }
  };
}

function memoryKV() {
  const values = new Map();
  return {
    async put(key, value) { values.set(key, JSON.parse(value)); },
    async get(key) { return values.get(key) ?? null; }
  };
}

test("Telegram /connect exposes the canonical shared game catalog", async () => {
  const mock = telegramMock();
  try {
    await routeUpdate({ message: { chat: { id: 77 }, text: "/connect" } }, {
      TELEGRAM_BOT_TOKEN: "test-token",
      ATLAS_KV: memoryKV()
    });
    const menu = mock.calls.find((call) => Array.isArray(call.reply_markup?.inline_keyboard));
    assert.ok(menu, "expected a Telegram inline game menu");
    const callbacks = menu.reply_markup.inline_keyboard.flat().map((button) => button.callback_data);
    assert.deepEqual(callbacks, ["atlas_game_steam", "atlas_game_epic-games", "atlas_game_riot-games"]);
  } finally {
    mock.restore();
  }
});

test("Telegram game callback uses the shared diagnostic and includes its official source", async () => {
  const mock = telegramMock();
  try {
    await routeUpdate({
      callback_query: {
        id: "callback-1",
        data: "atlas_game_steam",
        message: { chat: { id: 77 } }
      }
    }, {
      TELEGRAM_BOT_TOKEN: "test-token",
      ATLAS_KV: memoryKV()
    });
    const messages = mock.calls.map((call) => call.text || "").join("\n");
    assert.match(messages, /نتیجه بررسی اطلس/);
    assert.match(messages, /منبع رسمی: https:\/\/partner\.steamgames\.com/);
    assert.match(messages, /پینگ داخل بازی/);
    assert.match(messages, /شناسه نتیجه/);
  } finally {
    mock.restore();
  }
});

test("Telegram network-status callback displays operator status without showing provider URL", async () => {
  const mock = telegramMock();
  try {
    await routeUpdate({
      callback_query: {
        id: "callback-network-1",
        data: "atlas_network_status",
        message: { chat: { id: 77 } }
      }
    }, {
      TELEGRAM_BOT_TOKEN: "test-token",
      ATLAS_KV: memoryKV()
    });
    const messages = mock.calls.map((call) => call.text || "").join("\\n");
    assert.match(messages, /🌐 وضعیت اینترنت/);
    assert.match(messages, /همراه اول/);
    assert.match(messages, /ایرانسل/);
    assert.doesNotMatch(messages, /iranblock\\.com/);
  } finally {
    mock.restore();
  }
});

test("Telegram /network command shows an internet status message", async () => {
  const mock = telegramMock();
  try {
    await routeUpdate({ message: { chat: { id: 77 }, text: "/network" } }, {
      TELEGRAM_BOT_TOKEN: "test-token",
      ATLAS_KV: memoryKV()
    });
    const messages = mock.calls.map((call) => call.text || "").join("\\n");
    assert.match(messages, /وضعیت اینترنت/);
  } finally {
    mock.restore();
  }
});
