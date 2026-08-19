// ============================================================
// 🎨 ATLAS IMAGE GENERATOR 6.0
// Cloudflare Workers AI
// + Persian Typography Rasterization
// + Satori
// + Resvg
// + 1080x1920 Instagram/TG Canvas
// ============================================================

import satori from "satori";
import {
  Resvg,
  initWasm
} from "@resvg/resvg-wasm";


// ============================================================
// ⚙️ CONFIG
// ============================================================

const IMAGE_MODEL =
  "@cf/black-forest-labs/flux-1-schnell";

const WIDTH = 1080;
const HEIGHT = 1920;

const DEFAULT_HOOK =
  "چند لحظه از شلوغی فاصله بگیر.";


// ============================================================
// 🧠 WASM INITIALIZATION
// ============================================================

let wasmInitialized = false;

async function ensureWasm() {

  if (wasmInitialized) {
    return;
  }

  try {

    /*
     * Cloudflare Worker compatibility.
     *
     * @resvg/resvg-wasm exposes the WASM binary
     * through the package import.
     */

    const wasmModule =
      await import(
        "@resvg/resvg-wasm/index_bg.wasm"
      );

    await initWasm(
      wasmModule.default
    );

    wasmInitialized = true;

  } catch (error) {

    console.error(
      "ATLAS_RESVG_WASM_INIT_ERROR:",
      error?.stack || error
    );

    throw new Error(
      "RESVG_WASM_INIT_FAILED"
    );

  }

}


// ============================================================
// 🧹 CLEAN TEXT
// ============================================================

function cleanText(
  value,
  fallback = ""
) {

  const text =
    String(
      value ?? ""
    )
      .replace(/\r/g, "")
      .replace(/\t/g, " ")
      .replace(
        /[ ]{2,}/g,
        " "
      )
      .trim();

  return text || fallback;

}


// ============================================================
// ✂️ PERSIAN TEXT WRAP
// ============================================================

function wrapPersian(
  text,
  maxChars = 22,
  maxLines = 3
) {

  const clean =
    cleanText(
      text
    );

  if (!clean) {
    return [];
  }

  const words =
    clean.split(/\s+/);

  const lines = [];

  let current = "";

  for (
    const word of words
  ) {

    const candidate =
      current
        ? `${current} ${word}`
        : word;

    if (
      candidate.length <=
      maxChars
    ) {

      current =
        candidate;

    } else {

      if (current) {

        lines.push(
          current
        );

      }

      current =
        word;

    }

  }

  if (current) {

    lines.push(
      current
    );

  }

  return lines.slice(
    0,
    maxLines
  );

}


// ============================================================
// 🔍 RTL DETECTION
// ============================================================

function isPersian(
  text
) {

  return /[\u0600-\u06FF]/.test(
    String(text || "")
  );

}


// ============================================================
// 📝 BUILD TYPOGRAPHY
// ============================================================

function buildTypography(
  hook
) {

  const safeHook =
    cleanText(
      hook,
      DEFAULT_HOOK
    );

  const lines =
    wrapPersian(
      safeHook,
      22,
      3
    );

  if (!lines.length) {

    return {
      text: DEFAULT_HOOK,
      lines: [DEFAULT_HOOK]
    };

  }

  return {

    text:
      lines.join("\n"),

    lines

  };

}


// ============================================================
// 🎨 SATORI SVG
// ============================================================

async function createTypographySvg(
  hook,
  fontData
) {

  const typography =
    buildTypography(
      hook
    );

  /*
   * Satori supports RTL layout.
   *
   * We intentionally keep the text separate
   * from the generated AI image.
   */

  const svg =
    await satori(

      {

        type:
          "div",

        props: {

          dir:
            "rtl",

          style: {

            width:
              `${WIDTH}px`,

            height:
              `${HEIGHT}px`,

            display:
              "flex",

            flexDirection:
              "column",

            alignItems:
              "center",

            justifyContent:
              "flex-start",

            paddingTop:
              "190px",

            paddingLeft:
              "80px",

            paddingRight:
              "80px",

            boxSizing:
              "border-box"

          },

          children: [

            {

              type:
                "div",

              props: {

                dir:
                  "rtl",

                style: {

                  display:
                    "flex",

                  flexDirection:
                    "column",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  background:
                    "rgba(0,0,0,0.42)",

                  borderRadius:
                    "34px",

                  padding:
                    "28px 44px",

                  maxWidth:
                    "920px",

                  boxSizing:
                    "border-box"

                },

                children: [

                  {

                    type:
                      "div",

                    props: {

                      dir:
                        "rtl",

                      style: {

                        color:
                          "#ffffff",

                        fontSize:
                          "64px",

                        fontWeight:
                          700,

                        lineHeight:
                          1.35,

                        textAlign:
                          "center",

                        direction:
                          "rtl",

                        whiteSpace:
                          "pre-wrap",

                        textShadow:
                          "0 4px 14px rgba(0,0,0,0.85)",

                        letterSpacing:
                          "0px"

                      },

                      children:
                        typography.text

                    }

                  }

                ]

              }

            }

          ]

        }

      },

      {

        width:
          WIDTH,

        height:
          HEIGHT,

        fonts: [

          {

            name:
              "Persian",

            data:
              fontData,

            weight:
              700,

            style:
              "normal"

          }

        ]

      }

    );

  return svg;

}


// ============================================================
// 🖼️ RENDER SVG → PNG
// ============================================================

async function rasterizeSvg(
  svg
) {

  await ensureWasm();

  const renderer =
    new Resvg(
      svg,
      {

        fitTo: {

          mode:
            "width",

          value:
            WIDTH

        }

      }
    );

  const rendered =
    renderer.render();

  const png =
    rendered.asPng();

  return png.buffer.slice(
    png.byteOffset,
    png.byteOffset +
    png.byteLength
  );

}


// ============================================================
// 🧩 COMPOSE IMAGE + TEXT
// ============================================================

async function composeImage(
  imageBuffer,
  hook,
  fontData
) {

  /*
   * We use SVG as a composition layer.
   *
   * The AI image becomes the background.
   * Satori renders the Persian typography.
   * Resvg converts the final composition to PNG.
   */

  const imageBase64 =
    arrayBufferToBase64(
      imageBuffer
    );

  const typographySvg =
    await createTypographySvg(
      hook,
      fontData
    );

  /*
   * Inject the AI image behind
   * the typography layer.
   */

  const finalSvg =
    typographySvg.replace(

      "<svg",

      `<svg><image href="data:image/png;base64,${imageBase64}" x="0" y="0" width="${WIDTH}" height="${HEIGHT}" preserveAspectRatio="xMidYMid slice"/>`

    );

  return rasterizeSvg(
    finalSvg
  );

}


// ============================================================
// 🔢 ARRAYBUFFER → BASE64
// ============================================================

function arrayBufferToBase64(
  buffer
) {

  const bytes =
    new Uint8Array(
      buffer
    );

  const chunkSize =
    0x8000;

  let binary = "";

  for (
    let i = 0;
    i < bytes.length;
    i += chunkSize
  ) {

    const chunk =
      bytes.subarray(
        i,
        Math.min(
          i + chunkSize,
          bytes.length
        )
      );

    binary +=
      String.fromCharCode(
        ...chunk
      );

  }

  return btoa(
    binary
  );

}


// ============================================================
// 🧠 GET FONT
// ============================================================

async function getPersianFont(
  env
) {

  /*
   * IMPORTANT:
   *
   * Put the Persian font in the Worker project,
   * or expose it through an environment binding.
   *
   * Expected:
   *
   * env.ATLAS_PERSIAN_FONT
   *
   * as ArrayBuffer / Uint8Array.
   */

  if (
    env?.ATLAS_PERSIAN_FONT
  ) {

    if (
      env.ATLAS_PERSIAN_FONT
        instanceof ArrayBuffer
    ) {

      return env.ATLAS_PERSIAN_FONT;

    }

    if (
      env.ATLAS_PERSIAN_FONT
        instanceof Uint8Array
    ) {

      return env.ATLAS_PERSIAN_FONT.buffer;

    }

  }


  /*
   * Optional URL fallback.
   */

  if (
    env?.ATLAS_PERSIAN_FONT_URL
  ) {

    const response =
      await fetch(
        env.ATLAS_PERSIAN_FONT_URL
      );

    if (!response.ok) {

      throw new Error(
        `PERSIAN_FONT_DOWNLOAD_FAILED:${response.status}`
      );

    }

    return response.arrayBuffer();

  }


  throw new Error(
    "ATLAS_PERSIAN_FONT_MISSING"
  );

}


// ============================================================
// 🖼️ NORMALIZE IMAGE
// ============================================================

async function normalizeImage(
  imageBuffer
) {

  if (!imageBuffer) {

    throw new Error(
      "IMAGE_BUFFER_MISSING"
    );

  }

  if (
    imageBuffer instanceof Uint8Array
  ) {

    return imageBuffer.buffer.slice(
      imageBuffer.byteOffset,
      imageBuffer.byteOffset +
      imageBuffer.byteLength
    );

  }

  if (
    imageBuffer instanceof ArrayBuffer
  ) {

    return imageBuffer;

  }

  throw new Error(
    "IMAGE_BUFFER_INVALID"
  );

}


// ============================================================
// 🎨 GENERATE AI IMAGE
// ============================================================

export async function generateImage(
  env,
  prompt,
  hook = ""
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

  const cleanPrompt =
    String(
      prompt
    ).trim();

  const finalPrompt = `

Vertical cinematic Instagram content.

Create a premium realistic photographic scene.

${cleanPrompt}

COMPOSITION:

9:16 vertical composition.
Designed for a 1080x1920 canvas.

Keep the upper portion visually calm
and suitable for a Persian headline overlay.

Do not put important objects in the
upper center area.

STYLE:

cinematic realistic photography,
soft natural lighting,
peaceful atmosphere,
subtle depth of field,
high detail,
natural colors,
professional editorial photography.

ABSOLUTELY NO TEXT.

No letters.
No words.
No subtitles.
No captions.
No typography.
No logos.
No watermark.
No UI.
No borders.

The final image must be a clean
photographic background only.

`.trim();

  console.log(
    "ATLAS_IMAGE_GENERATION:",
    finalPrompt
  );


  let result;

  try {

    result =
      await env.AI.run(
        IMAGE_MODEL,
        {

          prompt:
            finalPrompt

        }
      );

  } catch (error) {

    console.error(
      "ATLAS_IMAGE_AI_ERROR:",
      error?.stack || error
    );

    throw new Error(
      `IMAGE_GENERATION_FAILED:${error?.message || error}`
    );

  }


  // ----------------------------------------------------------
  // DIRECT ARRAYBUFFER
  // ----------------------------------------------------------

  if (
    result instanceof ArrayBuffer
  ) {

    return normalizeAndRasterize(
      env,
      result,
      hook
    );

  }


  // ----------------------------------------------------------
  // UINT8ARRAY
  // ----------------------------------------------------------

  if (
    result instanceof Uint8Array
  ) {

    return normalizeAndRasterize(
      env,
      result.buffer.slice(
        result.byteOffset,
        result.byteOffset +
        result.byteLength
      ),
      hook
    );

  }


  // ----------------------------------------------------------
  // BASE64
  // ----------------------------------------------------------

  if (
    result &&
    typeof result.image === "string"
  ) {

    let binary;

    try {

      binary =
        Uint8Array.from(

          atob(
            result.image
          ),

          char =>
            char.charCodeAt(0)

        );

    } catch {

      throw new Error(
        "IMAGE_BASE64_INVALID"
      );

    }


    return normalizeAndRasterize(
      env,
      binary.buffer,
      hook
    );

  }


  console.error(
    "ATLAS_IMAGE_UNEXPECTED_RESPONSE:",
    result
  );

  throw new Error(
    "IMAGE_GENERATION_INVALID_RESPONSE"
  );

}


// ============================================================
// 🧩 FINALIZE IMAGE
// ============================================================

async function normalizeAndRasterize(
  env,
  imageBuffer,
  hook
) {

  const normalized =
    await normalizeImage(
      imageBuffer
    );


  /*
   * Load Persian font only when
   * typography is actually requested.
   */

  const fontData =
    await getPersianFont(
      env
    );


  console.log(
    "ATLAS_PERSIAN_TEXT:",
    cleanText(
      hook,
      DEFAULT_HOOK
    )
  );


  try {

    const finalImage =
      await composeImage(

        normalized,

        hook,

        fontData

      );


    console.log(
      "ATLAS_IMAGE_COMPOSED:",
      {

        width:
          WIDTH,

        height:
          HEIGHT,

        bytes:
          finalImage.byteLength

      }
    );


    return finalImage;

  } catch (error) {

    console.error(
      "ATLAS_IMAGE_COMPOSE_ERROR:",
      error?.stack || error
    );

    throw new Error(
      `PERSIAN_IMAGE_COMPOSITION_FAILED:${error?.message || error}`
    );

  }

}
