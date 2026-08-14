// ============================================================
// 🎨 ATLAS IMAGE GENERATOR
// Cloudflare Workers AI
// ============================================================

const IMAGE_MODEL =
  "@cf/black-forest-labs/flux-1-schnell";


// ============================================================
// 🖼️ GENERATE IMAGE
// ============================================================

export async function generateImage(
  env,
  prompt
) {

  if (!env?.AI) {

    throw new Error(
      "CLOUDFLARE_AI_BINDING_MISSING"
    );

  }


  if (
    !prompt ||
    !String(prompt).trim()
  ) {

    throw new Error(
      "IMAGE_PROMPT_MISSING"
    );

  }


  const finalPrompt = `
Vertical Instagram Reel background, 9:16 composition.

${String(prompt).trim()}

Style:
cinematic realistic photography,
soft natural lighting,
peaceful atmosphere,
high detail,
subtle depth of field,
natural colors,
no text,
no logo,
no watermark,
no UI,
no borders.

The image must be visually suitable for
calmness, relaxation, ASMR and peaceful content.
  `.trim();


  console.log(
    "ATLAS_IMAGE_GENERATION:",
    finalPrompt
  );


  try {

    // --------------------------------------------------------
    // Cloudflare Workers AI
    // --------------------------------------------------------

    const result =
      await env.AI.run(
        IMAGE_MODEL,
        {
          prompt: finalPrompt
        }
      );


    // --------------------------------------------------------
    // Direct binary response
    // --------------------------------------------------------

    if (
      result instanceof ArrayBuffer
    ) {

      return result;

    }


    if (
      result instanceof Uint8Array
    ) {

      return result.buffer.slice(
        result.byteOffset,
        result.byteOffset +
        result.byteLength
      );

    }


    // --------------------------------------------------------
    // Base64 image response
    // --------------------------------------------------------

    if (
      result &&
      typeof result.image === "string"
    ) {

      const binary =
        Uint8Array.from(
          atob(result.image),
          char =>
            char.charCodeAt(0)
        );


      return binary.buffer;

    }


    // --------------------------------------------------------
    // Unexpected response
    // --------------------------------------------------------

    console.error(
      "ATLAS_IMAGE_UNEXPECTED_RESPONSE:",
      result
    );


    throw new Error(
      "IMAGE_GENERATION_INVALID_RESPONSE"
    );

  } catch (error) {

    console.error(
      "ATLAS_IMAGE_ERROR:",
      error?.stack || error
    );


    throw error;

  }

}
