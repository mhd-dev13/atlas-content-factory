import { CONFIG } from "../config.js";

export async function generateAI(env, messages) {
  if (!env.AI) {
    throw new Error("CLOUDFLARE_AI_BINDING_MISSING");
  }

  const prompt = messages
    .map((message) => {
      return `${message.role}: ${message.content}`;
    })
    .join("\n\n");

  try {
    const result = await env.AI.run(
      CONFIG.model,
      {
        prompt,
        max_tokens: CONFIG.maxTokens,
        temperature: CONFIG.temperature,
        top_p: 0.85
      }
    );

    console.log(
      "ATLAS_AI_RESULT:",
      JSON.stringify(result)
    );

    const answer =
      result?.response ||
      result?.result?.response ||
      "";

    if (!answer) {
      throw new Error(
        `CLOUDFLARE_AI_EMPTY_RESPONSE: ${JSON.stringify(result)}`
      );
    }

    return String(answer).trim();

  } catch (error) {

    console.error(
      "CLOUDFLARE_AI_ERROR:",
      error?.stack || error
    );

    throw error;
  }
}
