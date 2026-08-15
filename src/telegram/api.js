// ============================================================
// 📡 ATLAS TELEGRAM API
// Stable Telegram Layer
// ============================================================

const TELEGRAM_MAX_CAPTION =
  1024;


// ============================================================
// 🚀 TELEGRAM REQUEST
// ============================================================

export async function telegram(
  env,
  method,
  body = {}
) {

  if (
    !env?.TELEGRAM_BOT_TOKEN
  ) {

    throw new Error(
      "TELEGRAM_BOT_TOKEN_MISSING"
    );

  }


  const url =
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`;


  const response =
    await fetch(

      url,

      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json"

        },

        body:
          JSON.stringify(
            body
          )

      }

    );


  const data =
    await response.json();


  if (!data.ok) {

    throw new Error(

      `Telegram API error: ${JSON.stringify(
        data
      )}`

    );

  }


  return data.result;

}


// ============================================================
// 💬 SEND MESSAGE
// ============================================================

export async function sendMessage(
  env,
  chatId,
  text
) {

  const safeText =
    String(
      text || ""
    ).trim();


  if (!safeText) {

    throw new Error(
      "TELEGRAM_MESSAGE_EMPTY"
    );

  }


  return telegram(

    env,

    "sendMessage",

    {

      chat_id:
        chatId,

      text:
        safeText

    }

  );

}


// ============================================================
// ✂️ SAFE CAPTION
// ============================================================

function safeCaption(
  caption
) {

  const value =
    String(
      caption || ""
    ).trim();


  if (!value) {
    return "";
  }


  if (
    value.length <=
    TELEGRAM_MAX_CAPTION
  ) {

    return value;

  }


  return (

    value.slice(
      0,
      TELEGRAM_MAX_CAPTION - 3
    ) +

    "..."

  );

}


// ============================================================
// 🎬 SEND VIDEO
// ============================================================

export async function sendVideo(
  env,
  chatId,
  videoUrl,
  caption = ""
) {

  if (!videoUrl) {

    throw new Error(
      "VIDEO_URL_MISSING"
    );

  }


  const finalCaption =
    safeCaption(
      caption
    );


  return telegram(

    env,

    "sendVideo",

    {

      chat_id:
        chatId,

      video:
        videoUrl,

      caption:
        finalCaption,

      supports_streaming:
        true

    }

  );

}
