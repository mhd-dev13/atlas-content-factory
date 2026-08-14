import { CONFIG } from "../config.js";

export async function askOpenAI(env, messages) {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY_MISSING");
  }

  const response = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: CONFIG.model,
        messages,
        max_tokens: CONFIG.maxTokens,
        temperature: CONFIG.temperature
      })
    }
  );

  const raw = await response.text();

  if (!response.ok) {
    console.error(
      "OPENAI_HTTP_ERROR:",
      response.status,
      raw
    );

    throw new Error(
      `OPENAI_HTTP_${response.status}: ${raw.slice(0, 500)}`
    );
  }

  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("OPENAI_INVALID_JSON");
  }

  const answer =
    data?.choices?.[0]?.message?.content?.trim();

  if (!answer) {
    throw new Error("OPENAI_EMPTY_RESPONSE");
  }

  return answer;
}
