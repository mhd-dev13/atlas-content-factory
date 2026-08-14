// ============================================================
// 📡 ATLAS TELEGRAM API
// ============================================================

export async function telegram(
  env,
  method,
  body = {}
) {

  if (!env.TELEGRAM_BOT_TOKEN) {

    throw new Error(
      "TELEGRAM_BOT_TOKEN is missing"
    );

  }


  const url =
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`;


  const response =
    await fetch(
      url,
      {

        method: "POST",

        headers: {

          "Content-Type":
            "application/json"

        },

        body:
          JSON.stringify(body)

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

  let safeText =
    String(
      text || ""
    );


  // Telegram message limit
  if (
    safeText.length > 3900
  ) {

    safeText =
      safeText.slice(
        0,
        3890
      ) +
      "\n...";

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


  let safeCaption =
    String(
      caption || ""
    );


  // Telegram video caption safety
  if (
    safeCaption.length > 900
  ) {

    safeCaption =
      safeCaption.slice(
        0,
        890
      ) +
      "...";

  }


  return telegram(
    env,
    "sendVideo",
    {

      chat_id:
        chatId,

      video:
        videoUrl,

      caption:
        safeCaption,

      supports_streaming:
        true

    }
  );

}
