// ============================================================
// 🤖 ATLAS AI ENGINE
// Cloudflare Workers AI
// ============================================================

import { CONFIG } from "../config.js";


// ============================================================
// 🧠 MAIN AI GENERATOR
// ============================================================

export async function generateAI(env, messages) {

  // ----------------------------------------------------------
  // Check Cloudflare AI Binding
  // ----------------------------------------------------------

  if (!env.AI) {

    throw new Error(
      "CLOUDFLARE_AI_BINDING_MISSING"
    );

  }


  // ----------------------------------------------------------
  // Build prompt
  // ----------------------------------------------------------

  const prompt = messages
    .map((message) => {

      return `${message.role}: ${message.content}`;

    })
    .join("\n\n");


  // ----------------------------------------------------------
  // Call Workers AI
  // ----------------------------------------------------------

  try {

    const result =
      await env.AI.run(
        CONFIG.model,
        {

          prompt,

          max_tokens:
            CONFIG.maxTokens,

          temperature:
            CONFIG.temperature,

          top_p:
            0.85,

          // Qwen3 reasoning control
          enable_thinking:
            false

        }
      );


    // --------------------------------------------------------
    // Debug log
    // --------------------------------------------------------

    console.log(
      "ATLAS_AI_RESULT:",
      JSON.stringify(result)
    );


    // --------------------------------------------------------
    // Extract response
    // --------------------------------------------------------

    let answer =
      result?.response ||
      result?.result?.response ||
      "";


    // --------------------------------------------------------
    // Empty response protection
    // --------------------------------------------------------

    if (!answer) {

      throw new Error(
        `CLOUDFLARE_AI_EMPTY_RESPONSE: ${JSON.stringify(result)}`
      );

    }


    // --------------------------------------------------------
    // Clean response
    // --------------------------------------------------------

    answer =
      cleanAIOutput(answer);


    // --------------------------------------------------------
    // Check after cleaning
    // --------------------------------------------------------

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

  let result =
    String(text || "")
      .trim();


  // ----------------------------------------------------------
  // Remove complete <think> blocks
  // ----------------------------------------------------------

  result =
    result.replace(
      /<think>[\s\S]*?<\/think>/gi,
      ""
    );


  // ----------------------------------------------------------
  // Remove dangling </think>
  // ----------------------------------------------------------

  result =
    result.replace(
      /<\/think>/gi,
      ""
    );


  // ----------------------------------------------------------
  // Remove dangling <think>
  // ----------------------------------------------------------

  result =
    result.replace(
      /<think>/gi,
      ""
    );


  // ----------------------------------------------------------
  // Remove accidental assistant prefix
  // ----------------------------------------------------------

  result =
    result.replace(
      /^\s*assistant\s*:\s*/i,
      ""
    );


  // ----------------------------------------------------------
  // Remove accidental Atlas prefix
  // ----------------------------------------------------------

  result =
    result.replace(
      /^\s*atlas\s*:\s*/i,
      ""
    );


  // ----------------------------------------------------------
  // Normalize excessive empty lines
  // ----------------------------------------------------------

  result =
    result.replace(
      /\n{3,}/g,
      "\n\n"
    );


  return result.trim();

}
