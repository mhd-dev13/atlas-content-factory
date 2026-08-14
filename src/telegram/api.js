// ============================================================
// 📡 ATLAS TELEGRAM API
// Message Guard + Safe Telegram Delivery
// ============================================================


// ============================================================
// ⚙️ TELEGRAM LIMITS
// ============================================================

// Telegram sendMessage text limit is 4096 characters.
// We use a smaller safe limit to leave room for future
// formatting or API changes.

const MESSAGE_LIMIT =
  3900;


// Telegram video captions have a much smaller limit.

const VIDEO_CAPTION_LIMIT =
  950;


// ============================================================
// 🧹 NORMALIZE TEXT
// ============================================================

function normalizeText(
  text
) {

  if (
    text === undefined ||
    text === null
  ) {

    return "";

  }


  return String(
    text
  )

    .replace(
      /\r\n/g,
      "\n"
    )

    .replace(
      /\r/g,
      "\n"
    )

    .trim();

}


// ============================================================
// ✂️ SPLIT LONG MESSAGE
// ============================================================

function splitMessage(
  text,
  limit = MESSAGE_LIMIT
) {

  const normalized =
    normalizeText(
      text
    );


  if (
    normalized.length <= limit
  ) {

    return [
      normalized
    ];

  }


  const chunks = [];

  let remaining =
    normalized;


  while (
    remaining.length > limit
  ) {

    let cut =
      remaining.lastIndexOf(
        "\n",
        limit
      );


    // --------------------------------------------------------
    // If no newline exists, try whitespace.
    // --------------------------------------------------------

    if (
      cut < Math.floor(
        limit * 0.55
      )
    ) {

      cut =
        remaining.lastIndexOf(
          " ",
          limit
        );

    }


    // --------------------------------------------------------
    // Absolute fallback.
    // --------------------------------------------------------

    if (
      cut <= 0
    ) {

      cut =
        limit;

    }


    const chunk =
      remaining
        .slice(
          0,
          cut
        )
        .trim();


    if (chunk) {

      chunks.push(
        chunk
      );

    }


    remaining =
      remaining
        .slice(
          cut
        )
        .trim();

  }


  if (
    remaining
  ) {

    chunks.push(
      remaining
    );

  }


  return chunks;

}


// ============================================================
// 📤 RAW TELEGRAM REQUEST
// ============================================================

export async function telegram(
  env,
  method,
  body = {}
) {

  if (
    !env.TELEGRAM_BOT_TOKEN
  ) {

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


  let data;


  try {

    data =
      await response.json();

  } catch {

    throw new Error(
      `Telegram API invalid response: ${response.status}`
    );

  }


  if (
    !data.ok
  ) {

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

  const normalized =
    normalizeText(
      text
    );


  if (!normalized) {

    return null;

  }


  const chunks =
    splitMessage(
      normalized
    );


  const results = [];


  for (
    let i = 0;
    i < chunks.length;
    i++
  ) {

    const chunk =
      chunks[i];


    try {

      const result =
        await telegram(

          env,

          "sendMessage",

          {

            chat_id:
              chatId,

            text:
              chunk

          }

        );


      results.push(
        result
      );


    } catch (error) {

      console.error(
        "ATLAS_SEND_MESSAGE_ERROR:",
        error?.message ||
        error
      );


      // ------------------------------------------------------
      // If a chunk fails, try one smaller fallback.
      // ------------------------------------------------------

      if (
        chunk.length > 1000
      ) {

        try {

          const fallback =
            chunk.slice(
              0,
              1000
            );


          const result =
            await telegram(

              env,

              "sendMessage",

              {

                chat_id:
                  chatId,

                text:
                  fallback

              }

            );


          results.push(
            result
          );


          continue;

        } catch (
          fallbackError
        ) {

          console.error(
            "ATLAS_SEND_MESSAGE_FALLBACK_ERROR:",
            fallbackError?.message ||
            fallbackError
          );

        }

      }


      // ------------------------------------------------------
      // Do not silently swallow the error.
      // ------------------------------------------------------

      throw error;

    }

  }


  return results.length === 1
    ? results[0]
    : results;

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
    normalizeText(
      caption
    );


  // ----------------------------------------------------------
  // Telegram video caption protection
  // ----------------------------------------------------------

  if (
    safeCaption.length >
    VIDEO_CAPTION_LIMIT
  ) {

    console.warn(
      "ATLAS_VIDEO_CAPTION_TRUNCATED:",
      safeCaption.length
    );


    safeCaption =
      safeCaption.slice(
        0,
        VIDEO_CAPTION_LIMIT - 3
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
