// ============================================================
// 🤖 ATLAS CONTENT FACTORY — ROUTER
// ============================================================

import { sendMessage } from "./telegram/api.js";
import { generateAI } from "./ai/engine.js";
import {
  generateIdea,
  generatePost
} from "./content/engine.js";

import { checkContent } from "./content/quality.js";


// ============================================================
// ⚙️ MEMORY KEYS
// ============================================================

function getIdeaKey(chatId) {

  return `atlas:content:idea:${chatId}`;

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
        await generateIdea(env);


      // ------------------------------------------------------
      // Save latest idea
      // ------------------------------------------------------

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


      // ------------------------------------------------------
      // Format idea
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

      // ------------------------------------------------------
      // Load latest idea
      // ------------------------------------------------------

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


      // ------------------------------------------------------
      // If no idea exists
      // ------------------------------------------------------

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


      // ------------------------------------------------------
      // Generate post
      // ------------------------------------------------------

      let post =
        await generatePost(
          env,
          sourceIdea
        );


      // ------------------------------------------------------
      // Quality check
      // ------------------------------------------------------

      const quality =
        await checkContent(
          env,
          post
        );


      console.log(
        "ATLAS_POST_QUALITY:",
        JSON.stringify(quality)
      );


      // ------------------------------------------------------
      // First quality failure
      // ------------------------------------------------------

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


        // ----------------------------------------------------
        // Second quality check
        // ----------------------------------------------------

        const secondQuality =
          await checkContent(
            env,
            post
          );


        console.log(
          "ATLAS_POST_QUALITY_RETRY:",
          JSON.stringify(secondQuality)
        );


        // ----------------------------------------------------
        // If still bad
        // ----------------------------------------------------

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


      // ------------------------------------------------------
      // Send final post
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
          "دوباره /post را امتحان کن."
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
      "/status — وضعیت سیستم"
    ].join("\n")
  );

}
