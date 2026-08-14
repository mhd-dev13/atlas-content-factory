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

    let answer =
      result?.response ||
      result?.result?.response ||
      "";

    if (!answer) {
      throw new Error(
        `CLOUDFLARE_AI_EMPTY_RESPONSE: ${JSON.stringify(result)}`
      );
    }

    answer = cleanAIOutput(answer);

    if (!answer) {
      throw new Error(
        "CLOUDFLARE_AI_EMPTY_AFTER_CLEAN"
      );
    }

    return answer;

  } catch (error) {

    console.error(
      "CLOUDFLARE_AI_ERROR:",
      error?.stack || error
    );

    throw error;
  }
}


// ============================================================
// 🧹 CLEAN AI OUTPUT
// ============================================================

function cleanAIOutput(text) {

  let result = String(text).trim();

  // Remove <think>...</think>
  result = result.replace(
    /<think>[\s\S]*?<\/think>/gi,
    ""
  );

  // Remove possible Assistant prefix
  result = result.replace(
    /^assistant\s*:\s*/i,
    ""
  );

  // Remove Atlas prefix
  result = result.replace(
    /^(atlas|atlas bot)\s*:\s*/i,
    ""
  );

  // Remove excessive empty lines
  result = result.replace(
    /\n{3,}/g,
    "\n\n"
  );

  return result.trim();
}
