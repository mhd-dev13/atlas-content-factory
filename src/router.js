// ============================================================
// 🤖 ATLAS ROUTER
// ============================================================

import { sendMessage } from "./telegram/api.js";
import { generateAI } from "./ai/engine.js";
import { generatePost } from "./content/engine.js";
import { ATLAS_SYSTEM_PROMPT } from "./ai/prompts.js";


// ============================================================
// 🚦 MAIN ROUTER
// ============================================================

export async function routeUpdate(update, env) {

  const message = update?.message;

  if (!message?.chat?.id) {
    return;
  }

  const chatId = message.chat.id;

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
        "🚀 Atlas Content Factory فعال شد!",
        "",
        "🧠 موتور تولید محتوا آماده است.",
        "",
        "💡 /idea — ساخت ایده",
        "📝 /post — ساخت پست",
        "📊 /status — وضعیت سیستم"
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
        "🟢 ATLAS ONLINE",
        "",
        "🧠 AI: Workers AI",
        "🤖 Model: Qwen3",
        "📡 Telegram: Connected",
        "🏭 Content Engine: Active"
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
      "🧠 در حال ساخت ایده..."
    );

    try {

      const answer = await generateAI(
        env,
        [
          {
            role: "system",
            content: ATLAS_SYSTEM_PROMPT
          },

          {
            role: "user",

            content: `
Create one short Instagram content idea.

Output ONLY the final content.

No reasoning.
No analysis.
No <think>.
No "Okay".
No "Answer:".
No medical claims.
No guaranteed results.

English + Persian audience.

Use exactly:

💡 IDEA

🇬🇧 Hook:
short English hook

🇮🇷 هوک:
short natural Persian hook

🎬 Concept:
one short sentence

🎨 Visual:
one short sentence

📝 CTA:
one short sentence

Maximum 50 words.
            `.trim()
          }
        ]
      );

      await sendMessage(
        env,
        chatId,
        answer
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
      "📝 در حال ساخت پست..."
    );

    try {

      const post = await generatePost(
        env
      );

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
        "⚠️ ساخت پست با مشکل مواجه شد."
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
      "🤖 دستور ناشناخته است.",
      "",
      "دستورات موجود:",
      "/idea",
      "/post",
      "/status"
    ].join("\n")
  );
}
