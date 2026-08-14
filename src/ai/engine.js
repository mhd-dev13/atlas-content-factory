import { CONFIG } from "../config.js";

export async function generateAI(env, messages) {
  if (!env.AI) {
    throw new Error("CLOUDFLARE_AI_BINDING_MISSING");
  }

  const prompt = messages
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n\n");

  try {
    const result = await env.AI.run(CONFIG.model, {
      prompt,
      max_tokens: CONFIG.maxTokens,
      temperature: CONFIG.temperature,
      top_p: 0.85
    });

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

    return cleanAIOutput(answer);

  } catch (error) {
    console.error(
      "CLOUDFLARE_AI_ERROR:",
      error?.stack || error
    );

    throw error;
  }
}


// ============================================================
// CLEAN ATLAS OUTPUT
// ============================================================

function cleanAIOutput(text) {
  let result = String(text).trim();

  // Remove Qwen thinking blocks
  result = result.replace(
    /<think>[\s\S]*?<\/think>/gi,
    ""
  );

  // Remove common reasoning text
  const markers = [
    /^okay,?\s+the user wants[\s\S]*?(?=\n(?:answer\s*:|1\.\s*\*\*))/i,
    /^the user wants[\s\S]*?(?=\n(?:answer\s*:|1\.\s*\*\*))/i,
    /^let me start[\s\S]*?(?=\n(?:answer\s*:|1\.\s*\*\*))/i,
    /^first,?\s+the english hook[\s\S]*?(?=\n(?:answer\s*:|1\.\s*\*\*))/i
  ];

  for (const marker of markers) {
    result = result.replace(marker, "");
  }

  result = result.replace(
    /^\s*answer\s*:\s*/i,
    ""
  );

  result = result.replace(
    /^\s*(assistant|atlas|atlas bot)\s*:\s*/i,
    ""
  );

  result = result.replace(
    /\n{3,}/g,
    "\n\n"
  );

  return result.trim();
}
