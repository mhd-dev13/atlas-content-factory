// ============================================================
// 🤖 ATLAS TELEGRAM API
// ============================================================


// ============================================================
// 📡 TELEGRAM REQUEST
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
      `Telegram API error: ${JSON.stringify(data)}`
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

  return telegram(
    env,
    "sendMessage",
    {
      chat_id: chatId,
      text: String(text || "")
    }
  );

}


// ============================================================
// 🖼️ SEND PHOTO
// ============================================================

export async function sendPhoto(
  env,
  chatId,
  imageData,
  caption = ""
) {

  if (!imageData) {

    throw new Error(
      "TELEGRAM_IMAGE_MISSING"
    );

  }


  let imageBuffer;


  // ----------------------------------------------------------
  // ArrayBuffer
  // ----------------------------------------------------------

  if (
    imageData instanceof ArrayBuffer
  ) {

    imageBuffer =
      imageData;

  }


  // ----------------------------------------------------------
  // Uint8Array
  // ----------------------------------------------------------

  else if (
    imageData instanceof Uint8Array
  ) {

    imageBuffer =
      imageData.buffer.slice(
        imageData.byteOffset,
        imageData.byteOffset +
        imageData.byteLength
      );

  }


  // ----------------------------------------------------------
  // ReadableStream
  // ----------------------------------------------------------

  else if (
    imageData instanceof ReadableStream
  ) {

    imageBuffer =
      await new Response(
        imageData
      ).arrayBuffer();

  }


  else {

    throw new Error(
      "TELEGRAM_IMAGE_INVALID_TYPE"
    );

  }


  const blob =
    new Blob(
      [imageBuffer],
      {
        type: "image/png"
      }
    );


  const form =
    new FormData();


  form.append(
    "chat_id",
    String(chatId)
  );


  form.append(
    "photo",
    blob,
    "atlas-image.png"
  );


  if (
    caption &&
    String(caption).trim()
  ) {

    form.append(
      "caption",
      String(caption)
    );

  }


  const url =
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`;


  const response =
    await fetch(
      url,
      {
        method: "POST",
        body: form
      }
    );


  const data =
    await response.json();


  if (!data.ok) {

    throw new Error(
      `Telegram sendPhoto error: ${JSON.stringify(data)}`
    );

  }


  return data.result;
}
