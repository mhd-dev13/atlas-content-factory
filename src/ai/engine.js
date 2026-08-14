import { CONFIG } from "../config.js";

export async function generateAI(env, messages) {
  if (!env.AI) {
    throw new Error("CLOUDFLARE_AI_BINDING_MISSING");
  }

  const result = await env.AI.run(
    CONFIG.model,
    {
      messages,
      max_tokens: CONFIG.maxTokens,
      temperature: CONFIG.temperature,
      top_p: 0.85
    }
  );

  const answer =
    result?.response ||
    result?.result?.response ||
    "";

  if (!answer) {
    throw new Error("CLOUDFLARE_AI_EMPTY_RESPONSE");
  }

  return String(answer).trim();
}
