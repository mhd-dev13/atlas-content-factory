// ============================================================
// 🎬 ATLAS REEL PIPELINE 4.0
//
// Idea
//   ↓
// Reel Director
//   ↓
// Clean Image
//   ↓
// Persian Typography
//   ↓
// Slow Zoom
//   ↓
// Caption
//   ↓
// Telegram
//
// Compatible with:
// src/video/renderer.js 4.0
// src/video/image.js
// src/content/engine.js
// ============================================================


import {
  generateIdea,
  generateReel
} from "../content/engine.js";


import {
  generateImage
} from "../video/image.js";


import {
  renderImageToVideo
} from "../video/renderer.js";


import {
  sendMessage,
  sendVideo
} from "../telegram/api.js";


// ============================================================
// 💾 JOB KEY
// ============================================================

function getReelKey(
  chatId
) {

  return `atlas:reel:${chatId}`;

}


// ============================================================
// 💾 SAVE JOB
// ============================================================

async function saveJob(
  env,
  chatId,
  data
) {

  if (!env?.ATLAS_KV) {

    return;

  }


  try {

    await env.ATLAS_KV.put(

      getReelKey(chatId),

      JSON.stringify({

        ...data,

        updatedAt:
          Date.now()

      }),

      {

        expirationTtl:
          86400

      }

    );

  } catch (error) {

    console.error(

      "ATLAS_KV_SAVE_ERROR:",

      error?.message ||
      error

    );

  }

}


// ============================================================
// 📡 PROGRESS
// ============================================================

async function progress(
  env,
  chatId,
  text
) {

  try {

    await sendMessage(

      env,

      chatId,

      text

    );

  } catch (error) {

    console.error(

      "ATLAS_PROGRESS_ERROR:",

      error?.message ||
      error

    );

  }

}


// ============================================================
// 🎯 GET ENGLISH HOOK
// ============================================================

function getEnglishHook(
  reel,
  idea
) {

  const candidates = [

    reel?.on_screen_text?.en,

    reel?.hook,

    idea?.hook_en,

    reel?.title

  ];


  for (
    const candidate
    of candidates
  ) {

    if (

      candidate &&

      String(candidate).trim()

    ) {

      return String(

        candidate

      )

        .replace(
          /\s+/g,
          " "
        )

        .trim();

    }

  }


  return "LET THE RAIN SLOW EVERYTHING DOWN.";

}


// ============================================================
// 🇮🇷 GET PERSIAN HOOK
// ============================================================

function getPersianHook(
  reel
) {

  const candidates = [

    reel?.on_screen_text?.fa,

    reel?.hook_fa,

    reel?.persian_hook,

    reel?.caption_fa

  ];


  for (
    const candidate
    of candidates
  ) {

    if (

      candidate &&

      String(candidate).trim()

    ) {

      return String(

        candidate

      )

        .replace(
          /\s+/g,
          " "
        )

        .trim();

    }

  }


  /*
   * Safe fallback.
   *
   * This guarantees that the renderer
   * receives Persian text even if the AI
   * forgets to generate on_screen_text.fa.
   */

  return "چند لحظه از شلوغی فاصله بگیر.";

}


// ============================================================
// 🎨 GET VISUAL
// ============================================================

function getVisual(
  reel,
  idea
) {

  if (

    reel?.scenes?.[0]?.visual

  ) {

    return String(

      reel.scenes[0].visual

    ).trim();

  }


  if (
    idea?.visual
  ) {

    return String(

      idea.visual

    ).trim();

  }


  if (
    idea?.concept
  ) {

    return String(

      idea.concept

    ).trim();

  }


  return [

    "A peaceful cinematic nature scene",

    "with realistic lighting and subtle atmosphere."

  ].join(" ");

}


// ============================================================
// 🖼️ BUILD IMAGE PROMPT
// ============================================================

function buildImagePrompt(
  reel,
  idea
) {

  const visual =
    getVisual(
      reel,
      idea
    );


  const camera =

    reel?.scenes?.[0]?.camera ||

    "cinematic medium-wide shot";


  const motion =

    reel?.scenes?.[0]?.motion ||

    "subtle natural movement";


  return `

Create ONE premium cinematic background image
for an Instagram Reel.

SUBJECT:

${visual}

CAMERA:

${camera}

MOTION CONCEPT:

${motion}

STYLE:

premium cinematic photography,
photorealistic,
natural realistic lighting,
soft atmospheric depth,
subtle depth of field,
high-end editorial photography,
emotionally calming,
visually rich,
premium Instagram aesthetic,
natural colors,
professional composition.

COMPOSITION:

Vertical 9:16.

Designed specifically for a 1080x1920 Reel.

Keep the main subject visually interesting.

Keep the upper portion of the image
relatively clean and visually calm.

Leave negative space in the upper area
for future Persian typography.

IMPORTANT:

DO NOT generate text.

DO NOT generate letters.

DO NOT generate words.

DO NOT generate subtitles.

DO NOT generate logos.

DO NOT generate watermarks.

DO NOT generate UI elements.

DO NOT place typography in the image.

The final image must contain
ONLY the cinematic visual.

HEADLINE SPACE:

Keep approximately the upper 25 percent
visually calm.

Do not place important objects directly
behind the future headline.

`.trim();

}


// ============================================================
// 📝 BUILD FINAL CAPTION
// ============================================================

function buildCaption(
  reel
) {

  const english =

    String(

      reel?.caption_en ||

      reel?.hook ||

      "Take a quiet moment."

    )

      .trim();


  const persian =

    String(

      reel?.caption_fa ||

      "چند لحظه از شلوغی فاصله بگیر."

    )

      .trim();


  const cta =

    String(

      reel?.cta ||

      ""

    )

      .trim();


  const hashtags =

    Array.isArray(
      reel?.hashtags
    )

      ? reel.hashtags

          .map(
            tag => {

              let value =

                String(
                  tag || ""
                ).trim();


              if (

                value &&

                !value.startsWith("#")

              ) {

                value =
                  "#" + value;

              }


              return value;

            }
          )

          .filter(Boolean)

          .slice(
            0,
            8
          )

          .join(" ")

      : "";


  return [

    "🇬🇧",

    english,

    "",

    "🇮🇷",

    persian,

    cta
      ? `✨ ${cta}`
      : "",

    hashtags

  ]

    .filter(

      value =>

        value !== undefined &&

        value !== null &&

        String(value).trim() !== ""

    )

    .join("\n")

    .trim();

}


// ============================================================
// ⏱️ PARSE DURATION
// ============================================================

function parseDuration(
  value
) {

  const match =

    String(
      value || ""
    ).match(
      /(\d+)/
    );


  if (!match) {

    return 10;

  }


  return Math.max(

    5,

    Math.min(

      30,

      Number(
        match[1]
      )

    )

  );

}


// ============================================================
// 🧠 CREATE REEL
// ============================================================

export async function createReel(
  env,
  chatId
) {

  const job = {

    status:
      "starting",

    startedAt:
      Date.now(),

    chatId

  };


  await saveJob(

    env,

    chatId,

    job

  );


  try {

    // ========================================================
    // 1️⃣ IDEA
    // ========================================================

    job.status =
      "idea";


    await saveJob(

      env,

      chatId,

      job

    );


    await progress(

      env,

      chatId,

      [

        "🎬 ATLAS REEL FACTORY",

        "",

        "🧠 مرحله 1/5",

        "در حال ساخت ایده..."

      ].join("\n")

    );


    const idea =

      await generateIdea(
        env
      );


    job.idea =
      idea;


    await saveJob(

      env,

      chatId,

      job

    );


    // ========================================================
    // 2️⃣ REEL DIRECTOR
    // ========================================================

    job.status =
      "director";


    await saveJob(

      env,

      chatId,

      job

    );


    await progress(

      env,

      chatId,

      [

        "🎯 مرحله 2/5",

        "Atlas Reel Director در حال طراحی Reel...",

        "",

        `🇬🇧 ${idea?.hook_en || ""}`,

        `🇮🇷 ${idea?.hook_fa || ""}`

      ].join("\n")

    );


    const reel =

      await generateReel(

        env,

        JSON.stringify(
          idea
        )

      );


    // ========================================================
    // 🎯 HOOKS
    // ========================================================

    const englishHook =

      getEnglishHook(

        reel,

        idea

      );


    const persianHook =

      getPersianHook(
        reel
      );


    job.reel =
      reel;


    job.englishHook =
      englishHook;


    job.persianHook =
      persianHook;


    await saveJob(

      env,

      chatId,

      job

    );


    // ========================================================
    // 3️⃣ IMAGE
    // ========================================================

    job.status =
      "image";


    await saveJob(

      env,

      chatId,

      job

    );


    await progress(

      env,

      chatId,

      [

        "🖼️ مرحله 3/5",

        "در حال ساخت تصویر سینمایی...",

        "",

        `🎯 ${englishHook}`,

        `🇮🇷 ${persianHook}`

      ].join("\n")

    );


    const imagePrompt =

      buildImagePrompt(

        reel,

        idea

      );


    const imageBuffer =

      await generateImage(

        env,

        imagePrompt

      );


    if (!imageBuffer) {

      throw new Error(
        "IMAGE_GENERATION_EMPTY"
      );

    }


    job.image =
      "generated";


    job.imageBytes =
      imageBuffer.byteLength;


    await saveJob(

      env,

      chatId,

      job

    );


    // ========================================================
    // 4️⃣ VIDEO
    // ========================================================

    job.status =
      "rendering";


    job.renderStartedAt =
      Date.now();


    await saveJob(

      env,

      chatId,

      job

    );


    await progress(

      env,

      chatId,

      [

        "🎥 مرحله 4/5",

        "در حال ساخت ویدیو...",

        "",

        "✨ Persian Hook Typography",

        `🇮🇷 ${persianHook}`,

        "🔍 Slow Zoom",

        "📱 1080×1920"

      ].join("\n")

    );


    const duration =

      parseDuration(

        reel?.duration

      );


    /*
     * IMPORTANT:
     *
     * Persian text is explicitly passed
     * to renderer.
     *
     * Renderer 4.0 expects:
     *
     * options.persianText
     */

    const rendered =

      await renderImageToVideo(

        env,

        imageBuffer,

        {

          duration,

          motion:
            "zoom_in",

          persianText:
            persianHook,

          audioUrl:
            env?.ATLAS_AUDIO_URL || ""

        }

      );


    if (

      !rendered ||

      !rendered.videoUrl

    ) {

      throw new Error(
        "VIDEO_RENDER_OUTPUT_MISSING"
      );

    }


    job.video =
      rendered;


    job.renderCompletedAt =
      Date.now();


    await saveJob(

      env,

      chatId,

      job

    );


    // ========================================================
    // 5️⃣ CAPTION
    // ========================================================

    job.status =
      "caption";


    const caption =

      buildCaption(
        reel
      );


    job.caption =
      caption;


    await saveJob(

      env,

      chatId,

      job

    );


    await progress(

      env,

      chatId,

      [

        "📦 مرحله 5/5",

        "Reel آماده است.",

        "",

        "🎬 ویدیو ساخته شد",

        "📝 کپشن آماده شد",

        "📤 در حال ارسال به تلگرام..."

      ].join("\n")

    );


    // ========================================================
    // 📤 SEND VIDEO
    // ========================================================

    await sendVideo(

      env,

      chatId,

      rendered.videoUrl,

      caption

    );


    // ========================================================
    // ✅ COMPLETE
    // ========================================================

    job.status =
      "completed";


    job.completedAt =
      Date.now();


    await saveJob(

      env,

      chatId,

      job

    );


    console.log(

      "ATLAS_REEL_COMPLETED:",

      JSON.stringify({

        chatId,

        englishHook,

        persianHook,

        duration,

        caption,

        video:
          rendered.videoUrl

      })

    );


    return {

      success:
        true,

      idea,

      reel,

      englishHook,

      persianHook,

      hook:
        englishHook,

      caption,

      rendered

    };


  } catch (error) {

    // ========================================================
    // ❌ FAILURE
    // ========================================================

    console.error(

      "ATLAS_REEL_PIPELINE_ERROR:",

      error?.stack ||

      error

    );


    job.status =
      "failed";


    job.error =

      error?.message ||

      String(error);


    job.failedAt =
      Date.now();


    await saveJob(

      env,

      chatId,

      job

    );


    try {

      await sendMessage(

        env,

        chatId,

        [

          "❌ ساخت Reel متوقف شد.",

          "",

          `🔧 ${error?.message || error}`,

          "",

          "📌 مرحله:",

          job.status,

          "",

          "💡 Reel قبلی دست‌نخورده باقی می‌ماند."

        ].join("\n")

      );

    } catch (
      notificationError
    ) {

      console.error(

        "ATLAS_FAILURE_NOTIFICATION_ERROR:",

        notificationError?.message ||

        notificationError

      );

    }


    return {

      success:
        false,

      error:

        error?.message ||

        String(error)

    };

  }

}
