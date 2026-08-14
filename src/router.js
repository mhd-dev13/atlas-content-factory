// ============================================================
// 🤖 ATLAS CONTENT FACTORY — ROUTER
// ============================================================

import { sendMessage } from "./telegram/api.js";

import {
  generateIdea,
  generatePost,
  generateReel
} from "./content/engine.js";

import { checkContent } from "./content/quality.js";


// ============================================================
// ⚙️ MEMORY KEYS
// ============================================================

function getIdeaKey(chatId) {
  return `atlas:content:idea:${String(chatId)}`;
}


// ============================================================
// 🚦 MAIN ROUTER
// ============================================================

export async function routeUpdate(update, env) {

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
        "🎬 /reel",
        "📊 /status"
      ].join("\n")
    );

    return;
  }


  // ==========================================================
  // 📊 STATUS
  // ==========================================================

  if (text === "/status") {

    const kv =
      !!env.ATLAS_KV;


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
        "📡 Telegram: CONNECTED",
        "",
        kv
          ? "💾 KV: CONNECTED"
          : "🔴 KV: MISSING"
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

      // ------------------------------------------------------
      // KV MUST EXIST
      // ------------------------------------------------------

      if (!env.ATLAS_KV) {

        throw new Error(
          "ATLAS_KV_BINDING_MISSING"
        );
      }


      // ------------------------------------------------------
      // GENERATE IDEA
      // ------------------------------------------------------

      const idea =
        await generateIdea(env);


      // ------------------------------------------------------
      // SAVE IDEA
      // ------------------------------------------------------

      const key =
        getIdeaKey(chatId);


      const record = {

        idea,

        createdAt:
          Date.now()

      };


      await env.ATLAS_KV.put(
        key,
        JSON.stringify(record),
        {
          expirationTtl: 86400
        }
      );


      // ------------------------------------------------------
      // VERIFY STORAGE
      // ------------------------------------------------------

      const saved =
        await env.ATLAS_KV.get(
          key,
          "json"
        );


      if (!saved?.idea) {

        throw new Error(
          "ATLAS_KV_SAVE_FAILED"
        );
      }


      // ------------------------------------------------------
      // OUTPUT
      // ------------------------------------------------------

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

        "💾 Idea: SAVED",

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

        [
          "⚠️ ساخت ایده با مشکل مواجه شد.",
          "",
          `🔧 ${error?.message || "UNKNOWN_ERROR"}`
        ].join("\n")
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

      // ------------------------------------------------------
      // KV CHECK
      // ------------------------------------------------------

      if (!env.ATLAS_KV) {

        throw new Error(
          "ATLAS_KV_BINDING_MISSING"
        );
      }


      // ------------------------------------------------------
      // LOAD IDEA
      // ------------------------------------------------------

      const key =
        getIdeaKey(chatId);


      const stored =
        await env.ATLAS_KV.get(
          key,
          "json"
        );


      // ------------------------------------------------------
      // IDEA NOT FOUND
      // ------------------------------------------------------

      if (!stored?.idea) {

        await sendMessage(
          env,
          chatId,

          [
            "💡 هنوز ایده‌ای ذخیره نشده.",
            "",
            "ابتدا /idea را بزن."
          ].join("\n")
        );

        return;
      }


      // ------------------------------------------------------
      // GENERATE POST
      // ------------------------------------------------------

      let post =
        await generatePost(
          env,
          JSON.stringify(
            stored.idea
          )
        );


      // ------------------------------------------------------
      // QUALITY CHECK
      // ------------------------------------------------------

      let quality =
        await checkContent(
          env,
          post
        );


      console.log(
        "ATLAS_POST_QUALITY:",
        JSON.stringify(quality)
      );


      // ------------------------------------------------------
      // QUALITY RETRY
      // ------------------------------------------------------

      if (!quality.approved) {

        await sendMessage(
          env,
          chatId,
          "🛡️ کیفیت کافی نبود؛ Atlas در حال اصلاح..."
        );


        const retryInput = [

          JSON.stringify(
            stored.idea
          ),

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


        console.log(
          "ATLAS_POST_QUALITY_RETRY:",
          JSON.stringify(quality)
        );

      }


      // ------------------------------------------------------
      // FINAL QUALITY DECISION
      // ------------------------------------------------------

      if (!quality.approved) {

        await sendMessage(
          env,
          chatId,

          [
            "⚠️ Atlas نتوانست پست را به کیفیت موردنظر برساند.",
            "",
            `📊 Score: ${quality.score ?? "N/A"}/100`
          ].join("\n")
        );

        return;
      }


      // ------------------------------------------------------
      // SEND FINAL POST
      // ------------------------------------------------------

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
          `🔧 ${error?.message || "UNKNOWN_ERROR"}`
        ].join("\n")
      );

    }


    return;
  }


  // ==========================================================
  // 🎬 REEL
  // ==========================================================

  if (text === "/reel") {

    await sendMessage(
      env,
      chatId,
      "🎬 در حال ساخت سناریوی Reel از آخرین ایده..."
    );


    try {

      if (!env.ATLAS_KV) {

        throw new Error(
          "ATLAS_KV_BINDING_MISSING"
        );
      }


      const key =
        getIdeaKey(chatId);


      const stored =
        await env.ATLAS_KV.get(
          key,
          "json"
        );


      if (!stored?.idea) {

        await sendMessage(
          env,
          chatId,

          [
            "💡 هنوز ایده‌ای ذخیره نشده.",
            "",
            "ابتدا /idea را بزن."
          ].join("\n")
        );

        return;
      }


      const reel =
        await generateReel(
          env,
          JSON.stringify(
            stored.idea
          )
        );


      await sendMessage(
        env,
        chatId,
        reel
      );


    } catch (error) {

      console.error(
        "REEL_ERROR:",
        error?.stack || error
      );


      await sendMessage(
        env,
        chatId,

        [
          "⚠️ ساخت Reel با مشکل مواجه شد.",
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
      "/idea — ساخت ایده",
      "/post — ساخت پست",
      "/reel — ساخت سناریوی Reel",
      "/status — وضعیت سیستم"
    ].join("\n")
  );

}
