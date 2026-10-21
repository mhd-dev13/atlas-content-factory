// Telegram Bot API transport. Never include tokens or raw response bodies in errors.

const TELEGRAM_MAX_CAPTION = 1024;

export async function telegram(env, method, body = {}) {
  if (!env?.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN_MISSING");
  }
  if (typeof method !== "string" || !/^[A-Za-z][A-Za-z0-9]{0,63}$/.test(method)) {
    throw new Error("TELEGRAM_METHOD_INVALID");
  }

  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`;
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch (error) {
    throw new Error("TELEGRAM_NETWORK_ERROR", { cause: error });
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("TELEGRAM_INVALID_RESPONSE");
  }

  if (!response.ok || data?.ok !== true) {
    const code = Number.isInteger(data?.error_code) ? data.error_code : response.status;
    // Telegram's description is deliberately omitted: keep logs/errors bounded and non-sensitive.
    throw new Error(`TELEGRAM_API_ERROR_${code}`);
  }
  return data.result;
}

export async function sendMessage(env, chatId, text) {
  const safeText = String(text || "").trim();
  if (!safeText) throw new Error("TELEGRAM_MESSAGE_EMPTY");
  return telegram(env, "sendMessage", { chat_id: chatId, text: safeText });
}

function safeCaption(caption) {
  const value = String(caption || "").trim();
  if (!value) return "";
  if (value.length <= TELEGRAM_MAX_CAPTION) return value;
  return value.slice(0, TELEGRAM_MAX_CAPTION - 3) + "...";
}

export async function sendVideo(env, chatId, videoUrl, caption = "") {
  if (!videoUrl) throw new Error("VIDEO_URL_MISSING");
  return telegram(env, "sendVideo", {
    chat_id: chatId,
    video: videoUrl,
    caption: safeCaption(caption),
    supports_streaming: true
  });
}
