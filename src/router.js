// ============================================================
// 🤖 ATLAS CONTENT FACTORY — ROUTER
// ============================================================

import { sendMessage, sendPhoto } from "./telegram/api.js";

import {
  generateIdea,
  generatePost
} from "./content/engine.js";

import { checkContent } from "./content/quality.js";

import { generateImage } from "./video/image.js";


// ============================================================
// ⚙️ MEMORY KEYS
// ============================================================

function getIdeaKey(chatId) {

  return `atlas:content:idea:${chatId}`;

}


// ============================================================
// 🚦 MAIN ROUTER
// ============================================================

export async function routeUpdate(
  update,
  env
) {

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

  if (text === "/start") {

    await sendMessage(
      env,
      chatId,

      [
        "🚀 Atlas Content Factory",
        "",
        "🟢 سیستم فعال است.",
        "",
        "💡 /idea",
        "📝 /post",
        "🎨 /image",
        "📊 /status",
        "",
        "ابتدا /idea را بزن و بعد /post."
      ].join("\n")
    );

    return;
  }


  // ==========================================================
  // 📊 STATUS
  // ==========================================================

  if (text === "/status") {

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
        "🎨 Image Engine: ACTIVE",
        "📡 Telegram: CONNECTED"
      ].join("\n")
    );

    return;
  }


  // ==========================================================
  // 💡 IDEA
  // ==========================================================

  if (text === "/idea") {

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
          getIdeaKey(chatId),

          JSON.stringify({
            idea,
            createdAt: Date.now()
          }),

          {
            expirationTtl: 86400
          }
        );

      }


      const output = [

        "💡 ATLAS IDEA",
        "",
        `🇬🇧 Hook: ${idea.hook_en}`,
        "",
        `🇮🇷 هوک: ${idea.hook_fa}`,
        "",
        `🎬 Concept: ${idea.concept}`,
        "",
        `🎨 Visual: ${idea.visual}`,
        "",
        `📝 CTA: ${idea.cta}`,
        "",
        "━━━━━━━━━━━━━━",
        "📝 حالا /post را بزن."

      ].join("\n");


      await sendMessage(
        env,
        chatId,
        output
      );


    } catch (error) {

      console.error(
        "IDEA_ERROR:",
        error?.stack || error
      );


      await sendMessage(
        env,
        chatId,
        "⚠️ ساخت ایده با مشکل مواجه شد."
      );

    }


    return;
  }


  // ==========================================================
  // 📝 POST
  // ==========================================================

  if (text === "/post") {

    await sendMessage(
      env,
      chatId,
      "📝 در حال ساخت پست از آخرین ایده..."
    );


    try {

      let sourceIdea = "";


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
            "💡 هنوز ایده‌ای ساخته نشده.",
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


      const quality =
        await checkContent(
          env,
          post
        );


      console.log(
        "ATLAS_POST_QUALITY:",
        JSON.stringify(quality)
      );


      if (!quality.approved) {

        await sendMessage(
          env,
          chatId,
          "🛡️ کیفیت پست کافی نبود؛ در حال اصلاح..."
        );


        const retryIdea = [

          sourceIdea,

          "",

          "QUALITY ISSUES:",

          JSON.stringify(
            quality.issues
          ),

          "",

          "SUGGESTED FIXES:",

          JSON.stringify(
            quality.fixes
          )

        ].join("\n");


        post =
          await generatePost(
            env,
            retryIdea
          );


        const secondQuality =
          await checkContent(
            env,
            post
          );


        console.log(
          "ATLAS_POST_QUALITY_RETRY:",
          JSON.stringify(secondQuality)
        );


        if (!secondQuality.approved) {

          await sendMessage(
            env,
            chatId,

            [
              "⚠️ Atlas نتوانست این پست را به کیفیت موردنظر برساند.",
              "",
              "دوباره /post را امتحان کن."
            ].join("\n")
          );

          return;
        }

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
          "دوباره /post را امتحان کن."
        ].join("\n")
      );

    }


    return;
  }


  // ==========================================================
  // 🎨 IMAGE TEST
  // ==========================================================

  if (text === "/image") {

    await sendMessage(
      env,
      chatId,
      "🎨 در حال ساخت تصویر آزمایشی..."
    );


    try {

      const imagePrompt = `
Peaceful cinematic forest at dawn,
soft mist between trees,
gentle rain falling on green leaves,
warm natural morning light,
small water droplets on leaves,
calm atmospheric scene,
realistic photography,
beautiful depth of field,
vertical composition for Instagram Reel,
no people,
no text,
no logo,
no watermark
      `.trim();


      const image =
        await generateImage(
          env,
          imagePrompt
        );


      await sendPhoto(
        env,
        chatId,
        image,
        "🎨 ATLAS IMAGE TEST\n🌿 Calm Nature"
      );


      console.log(
        "ATLAS_IMAGE_SENT:",
        chatId
      );


    } catch (error) {

      console.error(
        "IMAGE_ERROR:",
        error?.stack || error
      );


      await sendMessage(
        env,
        chatId,

        [
          "⚠️ ساخت تصویر با مشکل مواجه شد.",
          "",
          `🔧 ${error?.message || "UNKNOWN_ERROR"}`
        ].join("\n")
      );

    }


    return;
  }


  // ==========================================================
  // ❓ UNKNOWN COMMAND
  // ==========================================================

  await sendMessage(
    env,
    chatId,

    [
      "🤖 دستور شناخته نشد.",
      "",
      "دستورات:",
      "",
      "/idea — ساخت ایده",
      "/post — ساخت پست",
      "/image — ساخت تصویر",
      "/status — وضعیت سیستم"
    ].join("\n")
  );

}
