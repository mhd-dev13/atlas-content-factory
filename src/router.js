// ============================================================
// 🤖 ATLAS CONTENT FACTORY — ROUTER
// ============================================================

import {
  sendMessage,
  sendVideo,
  telegram
} from "./telegram/api.js";

import {
  generateIdea,
  generatePost
} from "./content/engine.js";

import {
  checkContent
} from "./content/quality.js";

import {
  generateImage
} from "./video/image.js";

import {
  renderImageToVideo
} from "./video/renderer.js";

import {
  createReel
} from "./reel/pipeline.js";


// ============================================================
// ⚙️ MEMORY KEYS
// ============================================================

function getIdeaKey(chatId) {

  return `atlas:content:idea:${chatId}`;

}


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
          "🤖 ATLAS CONTENT FACTORY",
          "",
          "🟢 سیستم آنلاین است.",
          "",
          "با یک دکمه یک Reel کامل بساز:",
          "",
          "🎬 ایده → تصویر → Motion → ویدیو"
        ].join("\n"),

      reply_markup: {

        inline_keyboard: [

          [
            {
              text:
                "🎬 ساخت Reel",

              callback_data:
                "atlas_create_reel"
            }
          ],

          [
            {
              text:
                "💡 ساخت ایده",

              callback_data:
                "atlas_idea"
            },

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
                "🎥 ساخت ویدیو",

              callback_data:
                "atlas_video"
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


    // --------------------------------------------------------
    // 🎬 CREATE REEL
    // --------------------------------------------------------

    if (
      data ===
      "atlas_create_reel"
    ) {

      await createReel(
        env,
        chatId
      );

      return;
    }


    // --------------------------------------------------------
    // 💡 IDEA
    // --------------------------------------------------------

    if (
      data ===
      "atlas_idea"
    ) {

      await createIdea(
        env,
        chatId
      );

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


    // --------------------------------------------------------
    // 🎥 VIDEO
    // --------------------------------------------------------

    if (
      data ===
      "atlas_video"
    ) {

      await createVideo(
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


  // ==========================================================
  // 🎬 REEL
  // ==========================================================

  if (
    text ===
    "/reel"
  ) {

    await createReel(
      env,
      chatId
    );

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
  // 💡 IDEA
  // ==========================================================

  if (
    text ===
    "/idea"
  ) {

    await createIdea(
      env,
      chatId
    );

    return;
  }


  // ==========================================================
  // 📝 POST
  // ==========================================================

  if (
    text ===
    "/post"
  ) {

    await createPost(
      env,
      chatId
    );

    return;
  }


  // ==========================================================
  // 🎥 VIDEO
  // ==========================================================

  if (
    text ===
    "/video"
  ) {

    await createVideo(
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
      "🤖 ATLAS CONTENT FACTORY",
      "",
      "🟢 Status: ONLINE",
      "🧠 AI Engine: ACTIVE",
      "🏭 Content Engine: ACTIVE",
      "🛡️ Quality Engine: ACTIVE",
      "🖼️ Image Engine: ACTIVE",
      "🎬 Video Engine: ACTIVE",
      "🔍 Motion Engine: ACTIVE",
      "🎧 Audio Engine: READY",
      "📡 Telegram: CONNECTED"
    ].join("\n")
  );

}


// ============================================================
// 💡 IDEA
// ============================================================

async function createIdea(
  env,
  chatId
) {

  await sendMessage(
    env,
    chatId,
    "💡 در حال ساخت ایده..."
  );


  try {

    const idea =
      await generateIdea(
        env
      );


    if (env.ATLAS_KV) {

      await env.ATLAS_KV.put(

        getIdeaKey(
          chatId
        ),

        JSON.stringify({

          idea,

          createdAt:
            Date.now()

        }),

        {
          expirationTtl:
            86400
        }

      );

    }


    await sendMessage(
      env,
      chatId,

      [
        "💡 ATLAS IDEA",
        "",
        `🇬🇧 Hook: ${idea.hook_en || ""}`,
        "",
        `🇮🇷 هوک: ${idea.hook_fa || ""}`,
        "",
        `🎬 Concept: ${idea.concept || ""}`,
        "",
        `🎨 Visual: ${idea.visual || ""}`,
        "",
        `📝 CTA: ${idea.cta || ""}`,
        "",
        "━━━━━━━━━━━━━━",
        "",
        "🎬 برای ساخت کامل Reel:",
        "روی دکمه 🎬 ساخت Reel بزن."
      ].join("\n")
    );


  } catch (error) {

    console.error(
      "IDEA_ERROR:",
      error?.stack || error
    );


    await sendMessage(
      env,
      chatId,

      [
        "⚠️ ساخت ایده با مشکل مواجه شد.",
        "",
        `🔧 ${error?.message || error}`
      ].join("\n")
    );

  }

}


// ============================================================
// 📝 POST
// ============================================================

async function createPost(
  env,
  chatId
) {

  await sendMessage(
    env,
    chatId,
    "📝 در حال ساخت پست..."
  );


  try {

    let sourceIdea =
      "";


    if (env.ATLAS_KV) {

      const stored =
        await env.ATLAS_KV.get(
          getIdeaKey(chatId),
          "json"
        );


      if (stored?.idea) {

        sourceIdea =
          JSON.stringify(
            stored.idea
          );

      }

    }


    if (!sourceIdea) {

      await sendMessage(
        env,
        chatId,

        [
          "💡 هنوز ایده‌ای وجود ندارد.",
          "",
          "ابتدا /idea را بزن."
        ].join("\n")
      );

      return;
    }


    let post =
      await generatePost(
        env,
        sourceIdea
      );


    let quality =
      await checkContent(
        env,
        post
      );


    if (!quality.approved) {

      const retryInput = [

        sourceIdea,

        "",

        "QUALITY ISSUES:",

        JSON.stringify(
          quality.issues || []
        ),

        "",

        "SUGGESTED FIXES:",

        JSON.stringify(
          quality.fixes || []
        )

      ].join("\n");


      post =
        await generatePost(
          env,
          retryInput
        );


      quality =
        await checkContent(
          env,
          post
        );

    }


    if (!quality.approved) {

      await sendMessage(
        env,
        chatId,

        [
          "⚠️ کیفیت خروجی کافی نبود.",
          "",
          "دوباره /post را امتحان کن."
        ].join("\n")
      );

      return;
    }


    await sendMessage(
      env,
      chatId,
      post
    );


  } catch (error) {

    console.error(
      "POST_ERROR:",
      error?.stack || error
    );


    await sendMessage(
      env,
      chatId,

      [
        "⚠️ ساخت پست با مشکل مواجه شد.",
        "",
        `🔧 ${error?.message || error}`
      ].join("\n")
    );

  }

}


// ============================================================
// 🎥 VIDEO
// ============================================================

async function createVideo(
  env,
  chatId
) {

  await sendMessage(
    env,
    chatId,

    [
      "🎬 ATLAS VIDEO ENGINE",
      "",
      "🖼️ مرحله 1/2 — ساخت تصویر..."
    ].join("\n")
  );


  try {

    const imagePrompt = `

A peaceful cinematic nature scene for a
10-second vertical Instagram Reel.

Soft green leaves moving gently in a light breeze,
warm natural sunlight filtering through the trees,
subtle depth of field,
calm atmospheric feeling,
realistic photography.

No people.
No text.
No logo.
No watermark.

`.trim();


    const imageBuffer =
      await generateImage(
        env,
        imagePrompt
      );


    await sendMessage(
      env,
      chatId,

      [
        "🎬 مرحله 2/2",
        "",
        "⚙️ در حال اعمال Motion و ساخت ویدیو...",
        "",
        "🔍 Slow Zoom",
        "⏳ لطفاً کمی صبر کن."
      ].join("\n")
    );


    const rendered =
      await renderImageToVideo(
        env,
        imageBuffer,

        {
          duration:
            10,

          motion:
            "zoom_in"
        }
      );


    await sendVideo(
      env,
      chatId,
      rendered.videoUrl,

      [
        "🎬 ATLAS REEL",
        "",
        "🌿 Calm Nature",
        "⏱️ 10 seconds",
        "🔍 Slow Zoom"
      ].join("\n")
    );


  } catch (error) {

    console.error(
      "VIDEO_ERROR:",
      error?.stack || error
    );


    await sendMessage(
      env,
      chatId,

      [
        "⚠️ ساخت ویدیو با مشکل مواجه شد.",
        "",
        `🔧 ${error?.message || error}`
      ].join("\n")
    );

  }

}
