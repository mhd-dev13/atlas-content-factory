import { CONFIG } from "../config.js";

export async function askOpenAI(env, messages) {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
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
        temperature: CONFIG.temperature,
        max_tokens: CONFIG.maxTokens
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `OpenAI API error: ${JSON.stringify(data)}`
    );
  }

  return (
    data?.choices?.[0]?.message?.content ||
    ""
  ).trim();
}
