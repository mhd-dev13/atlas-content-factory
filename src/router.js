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


  // ==========================================================
  // /START
  // ==========================================================

  if (text === "/start") {
    await sendMessage(
      env,
      chatId,
      [
        "🚀 Atlas Content Factory فعال شد!",
        "",
        "🧠 موتور تولید محتوا آماده است.",
        "📢 @AtlasContentFactory",
        "",
        "/idea — ایده محتوا",
        "/status — وضعیت Atlas"
      ].join("\n")
    );

    return;
  }


  // ==========================================================
  // /STATUS
  // ==========================================================

  if (text === "/status") {
    await sendMessage(
      env,
      chatId,
      [
        "🟢 ATLAS ONLINE",
        "🧠 AI: Workers AI",
        "🤖 Model: Qwen3",
        "📡 Telegram: Connected"
      ].join("\n")
    );

    return;
  }


  // ==========================================================
  // /IDEA
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
Create ONE short Instagram content idea.

IMPORTANT:
- Return ONLY the final answer.
- Do NOT show reasoning.
- Do NOT explain your thinking.
- Do NOT use <think>.
- Do NOT write "Okay".
- Do NOT write "The user wants".
- Do NOT write "Answer:".
- No medical claims.
- No guaranteed results.

Target audience:
English + Persian.

Return EXACTLY:

💡 IDEA

🇬🇧 Hook:
[short English hook]

🇮🇷 هوک:
[short Persian hook]

🎬 Concept:
[one short sentence]

🎨 Visual:
[one short sentence]

📝 CTA:
[short CTA]

Topic:
calmness / relaxation / ASMR / peaceful content.

Maximum 80 words.
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
        "⚠️ موتور AI فعلاً در دسترس نیست."
      );
    }

    return;
  }


  // ==========================================================
  // UNKNOWN COMMAND
  // ==========================================================

  await sendMessage(
    env,
    chatId,
    "🤖 دستور ناشناخته است.\n\nاز /start استفاده کن."
  );
}
