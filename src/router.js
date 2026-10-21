// ============================================================
// 🔌 ATLAS SMART CONNECT — TELEGRAM ROUTER
// ============================================================

import {
  sendMessage,
  telegram
} from "./telegram/api.js";

import {
  createGameDiagnostic,
  getGameCatalog
} from "./game-connect.js";

import {
  formatNetworkStatusFa,
  getNetworkStatus
} from "./network-status.js";


// ============================================================
// 🎛️ MAIN MENU
// ============================================================

async function sendMainMenu(
  env,
  chatId
) {

  return telegram(
    env,
    "sendMessage",
    {

      chat_id:
        chatId,

      text:
        [
          "🔌 ATLAS SMART CONNECT",
          "",
          "🟢 سیستم آنلاین است.",
          "",
          "از منوی زیر برای بررسی اتصال بازی و وضعیت شبکه استفاده کن."
        ].join("\n"),

      reply_markup: {

        inline_keyboard: [

          [
            {
              text:
                "📊 وضعیت",

              callback_data:
                "atlas_status"
            }
          ],

          [
            {
              text:
                "🎮 بررسی اتصال بازی",

              callback_data:
                "atlas_connect"
            }
          ],

          [
            {
              text:
                "🌐 وضعیت اینترنت",

              callback_data:
                "atlas_network_status"
            }
          ]

        ]

      }

    }
  );

}


// ============================================================
// 🚦 MAIN ROUTER
// ============================================================

export async function routeUpdate(
  update,
  env
) {

  // ==========================================================
  // 🔘 CALLBACK QUERY
  // ==========================================================

  if (
    update?.callback_query
  ) {

    const callback =
      update.callback_query;

    const callbackId =
      callback.id;

    const chatId =
      callback?.message?.chat?.id;

    const data =
      callback?.data;


    if (!chatId) {
      return;
    }


    // --------------------------------------------------------
    // Answer Telegram callback
    // --------------------------------------------------------

    try {

      await telegram(
        env,
        "answerCallbackQuery",
        {
          callback_query_id:
            callbackId
        }
      );

    } catch (error) {

      console.error(
        "ATLAS_CALLBACK_ERROR:",
        error?.message || error
      );

    }


    if (data === "atlas_connect") {
      await sendGameMenu(env, chatId);
      return;
    }

    if (data === "atlas_network_status") {
      await sendNetworkStatus(env, chatId);
      return;
    }

    if (typeof data === "string" && data.startsWith("atlas_game_")) {
      await checkGameForChat(env, chatId, data.slice("atlas_game_".length));
      return;
    }

    // --------------------------------------------------------
    // 📊 STATUS
    // --------------------------------------------------------

    if (
      data ===
      "atlas_status"
    ) {

      await sendStatus(
        env,
        chatId
      );

      return;
    }


    return;
  }


  // ==========================================================
  // 💬 MESSAGE
  // ==========================================================

  const message =
    update?.message;


  if (!message?.chat?.id) {
    return;
  }


  const chatId =
    message.chat.id;


  const text =
    (message.text || "").trim();


  if (!text) {
    return;
  }


  // ==========================================================
  // 🚀 START
  // ==========================================================

  if (
    text ===
    "/start"
  ) {

    await sendMainMenu(
      env,
      chatId
    );

    return;
  }


  if (text === "/connect" || text === "/games") {
    await sendGameMenu(env, chatId);
    return;
  }

  if (text === "/network" || text === "/internet") {
    await sendNetworkStatus(env, chatId);
    return;
  }

  // ==========================================================
  // 📊 STATUS
  // ==========================================================

  if (
    text ===
    "/status"
  ) {

    await sendStatus(
      env,
      chatId
    );

    return;
  }


  // ==========================================================
  // ❓ UNKNOWN
  // ==========================================================

  await sendMainMenu(
    env,
    chatId
  );

}


// ============================================================
// 🎮 GAME CONNECT — shared with the website API
// ============================================================

async function sendGameMenu(env, chatId) {
  const games = getGameCatalog();
  await telegram(env, "sendMessage", {
    chat_id: chatId,
    text: [
      "🎮 اطلس گیم کانکت",
      "",
      "یک سرویس را انتخاب کن. بررسی از سرور اطلس انجام می‌شود و پینگ واقعی داخل بازی را نشان نمی‌دهد."
    ].join("\n"),
    reply_markup: {
      inline_keyboard: games.map((game) => [{
        text: game.name_fa,
        callback_data: "atlas_game_" + game.id
      }])
    }
  });
}

async function checkGameForChat(env, chatId, gameId) {
  await sendMessage(env, chatId, "🔎 در حال بررسی مقصد رسمی از سمت سرور اطلس...");
  try {
    const diagnostic = await createGameDiagnostic(gameId, env);
    if (diagnostic.status !== 201) {
      await sendMessage(env, chatId, diagnostic.body?.message_fa || "بررسی فعلاً انجام نشد؛ کمی بعد دوباره تلاش کن.");
      return;
    }
    const result = diagnostic.body;
    const labels = {
      reachable: "پاسخ موفق دریافت شد",
      restricted: "دسترسی رد شد (403)",
      rate_limited: "محدودیت درخواست (429)",
      http_error: "خطای HTTP مقصد",
      server_error: "خطای سرور مقصد",
      inconclusive: "نتیجه نامشخص",
      unreachable: "پاسخی دریافت نشد"
    };
    await sendMessage(env, chatId, [
      "🎮 نتیجه بررسی اطلس",
      "",
      "سرویس: " + result.game.name_fa,
      "وضعیت: " + (labels[result.access.state] || "نتیجه نامشخص"),
      "پاسخ HTTP: " + (result.access.http_status ?? "بدون پاسخ HTTP"),
      "زمان پاسخ از سرور اطلس: " + result.access.duration_ms + " میلی‌ثانیه",
      "",
      result.access.note_fa,
      "",
      "منبع رسمی: " + result.source.url,
      "",
      result.quality.note_fa,
      result.conclusion_fa,
      "",
      "شناسه نتیجه: " + result.id
    ].join("\n"));
  } catch (error) {
    console.error("ATLAS_GAME_CONNECT_TELEGRAM_FAILED", error?.name || "Error");
    await sendMessage(env, chatId, "⚠️ بررسی بازی ناموفق بود. لطفاً کمی بعد دوباره تلاش کن.");
  }
}


// ============================================================
// 🌐 NETWORK STATUS — ArvanCloud Radar data via IranBlock API
// ============================================================

async function sendNetworkStatus(env, chatId) {
  await sendMessage(env, chatId, "🌐 در حال دریافت وضعیت شبکه‌های پایش‌شده...");
  try {
    const result = await getNetworkStatus(env);
    await sendMessage(env, chatId, formatNetworkStatusFa(result));
  } catch (error) {
    console.error("ATLAS_NETWORK_STATUS_TELEGRAM_FAILED", error?.name || "Error");
    await sendMessage(env, chatId, "⚠️ وضعیت اینترنت فعلاً قابل دریافت نیست. این به معنی سالم یا قطع بودن اینترنت نیست؛ کمی بعد دوباره تلاش کن.");
  }
}


// ============================================================
// 📊 STATUS
// ============================================================

async function sendStatus(
  env,
  chatId
) {

  await sendMessage(
    env,
    chatId,

    [
      "🔌 ATLAS SMART CONNECT",
      "",
      "📡 Telegram bot: ACTIVE",
      "🎮 Game access checks: AVAILABLE",
      "🌐 Network status: CHECKABLE",
      "",
      "نکته: زمان پاسخ سرور اطلس، پینگ واقعی داخل بازی نیست."
    ].join("\n")
  );

}
