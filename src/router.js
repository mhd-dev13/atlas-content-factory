import { sendMessage } from "./telegram/api.js";
import { generateAI } from "./ai/engine.js";
import { ATLAS_SYSTEM_PROMPT } from "./ai/prompts.js";

export async function routeUpdate(update, env) {
  const message = update?.message;

  if (!message?.chat?.id) {
    return;
  }

  const chatId = message.chat.id;
  const text = (message.text || "").trim();

  if (!text) {
    return;
  }

  if (text === "/start") {
    await sendMessage(
      env,
      chatId,
      [
        "🚀 Atlas Content Factory فعال شد!",
        "",
        "🧠 هسته تولید محتوا آماده است.",
        "📢 کانال: @AtlasContentFactory",
        "",
        "دستورهای فعلی:",
        "/idea — ساخت ایده محتوا",
        "/status — وضعیت Atlas"
      ].join("\n")
    );

    return;
  }

  if (text === "/status") {
    await sendMessage(
      env,
      chatId,
      "🟢 Atlas ONLINE\n🧠 AI: Connected\n📡 Telegram: Connected"
    );

    return;
  }

  if (text === "/idea") {
    await sendMessage(
      env,
      chatId,
      "🧠 دارم یک ایده محتوا می‌سازم..."
    );

    try {
      const answer = await generateAI(env, [
        {
          role: "system",
          content: ATLAS_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `
Create one short social-media content idea.

Return:
1. English hook
2. Persian hook
3. Short concept
4. Suggested visual
5. CTA

Topic:
calmness / relaxation / ASMR / anxiety relief.

Do not make medical claims.
          `.trim()
        }
      ]);

      await sendMessage(
        env,
        chatId,
        `💡 ATLAS CONTENT IDEA\n\n${answer}`
      );

    } catch (error) {
      console.error("IDEA_ERROR:", error);

      await sendMessage(
        env,
        chatId,
        "⚠️ اتصال به موتور AI با مشکل مواجه شد."
      );
    }

    return;
  }

  await sendMessage(
    env,
    chatId,
    "🤖 دستور ناشناخته است.\n\nاز /start استفاده کن."
  );
}
