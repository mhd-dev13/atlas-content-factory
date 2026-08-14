// ============================================================
// 🎬 ATLAS REEL PIPELINE
// One Click:
// Idea → Reel Director → Hook → Image → Video → Caption
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

function getReelKey(chatId) {

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
      error?.message || error
    );

  }

}


// ============================================================
// 🎯 GET BEST HOOK
// ============================================================

function getHook(
  reel,
  idea
) {

  const candidates = [

    reel?.hook,

    reel?.on_screen_text?.en,

    idea?.hook_en,

    reel?.title

  ];


  for (
    const candidate of candidates
  ) {

    if (
      candidate &&
      String(candidate).trim()
    ) {

      return String(
        candidate
      ).trim();

    }

  }


  return "YOUR MIND NEEDS A BREAK.";

}


// ============================================================
// 🎨 GET VISUAL
// ============================================================

function getVisual(
  reel,
  idea
) {

  // ----------------------------------------------------------
  // Prefer first Reel scene
  // ----------------------------------------------------------

  if (
    reel?.scenes?.[0]?.visual
  ) {

    return String(
      reel.scenes[0].visual
    ).trim();

  }


  // ----------------------------------------------------------
  // Fallback to original idea
  // ----------------------------------------------------------

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


  return "A peaceful cinematic nature scene.";

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
    "cinematic static shot";


  const motion =
    reel?.scenes?.[0]?.motion ||
    "subtle natural movement";


  return `

Create ONE cinematic vertical Instagram Reel
background image.

VISUAL:
${visual}

CAMERA:
${camera}

MOTION CONCEPT:
${motion}

STYLE:

cinematic realistic photography,
high visual quality,
soft natural lighting,
peaceful atmosphere,
calming mood,
subtle depth of field,
natural colors,
premium Instagram aesthetic.

FORMAT:

Vertical 9:16.
Designed for 1080x1920 video.
Strong visual composition.
Keep the main subject visually interesting.

IMPORTANT:

DO NOT generate any text.

DO NOT generate letters.

DO NOT generate words.

DO NOT generate subtitles.

DO NOT generate logos.

DO NOT generate watermarks.

DO NOT generate UI.

The Hook will be added later
by the video renderer.

`.trim();

}


// ============================================================
// 📝 BUILD FINAL CAPTION
// ============================================================

function buildCaption(
  reel
) {

  const english =
    reel?.caption_en ||
    "";


  const persian =
    reel?.caption_fa ||
    "";


  const cta =
    reel?.cta ||
    "";


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

          .slice(0, 8)

          .join(" ")

      : "";


  return [

    "🇬🇧",
    english,

    "",

    "🇮🇷",
    persian,

    "",

    cta
      ? `✨ ${cta}`
      : "",

    "",

    hashtags

  ]

    .filter(
      line =>
        line !== undefined &&
        line !== null
    )

    .join("\n")

    .trim();

}


// ============================================================
// 🚀 CREATE REEL
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


    const hook =
      getHook(
        reel,
        idea
      );


    job.reel =
      reel;


    job.hook =
      hook;


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
        "در حال ساخت تصویر...",
        "",
        `🎯 Hook: ${hook}`
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


    job.image =
      "generated";


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
        "🔍 Slow Zoom",
        "📝 Hook Overlay",
        "📱 1080×1920"
      ].join("\n")
    );


    const duration =
      parseDuration(
        reel?.duration
      );


    const rendered =
      await renderImageToVideo(

        env,

        imageBuffer,

        {

          duration,

          motion:
            "zoom_in",

          hook

        }

      );


    job.video =
      rendered;


    await saveJob(
      env,
      chatId,
      job
    );


    // ========================================================
    // 5️⃣ FINAL
    // ========================================================

    job.status =
      "ready";


    await saveJob(
      env,
      chatId,
      job
    );


    const caption =
      buildCaption(
        reel
      );


    await progress(
      env,
      chatId,

      [
        "📦 مرحله 5/5",
        "Reel آماده شد.",
        "",
        "📤 در حال ارسال..."
      ].join("\n")
    );


    // ========================================================
    // SEND VIDEO
    // ========================================================

    await sendVideo(
      env,
      chatId,

      rendered.videoUrl,

      [
        "🎬 ATLAS REEL READY",
        "",
        `🎯 ${hook}`,
        "",
        `⏱️ ${duration} seconds`,
        "📱 1080×1920",
        "🔍 Slow Zoom",
        "",
        "━━━━━━━━━━━━━━",
        "",
        "📝 CAPTION",
        "",
        caption
      ].join("\n")
    );


    // ========================================================
    // COMPLETE
    // ========================================================

    job.status =
      "completed";


    job.completedAt =
      Date.now();


    job.caption =
      caption;


    await saveJob(
      env,
      chatId,
      job
    );


    console.log(
      "ATLAS_REEL_COMPLETED:",
      JSON.stringify({

        chatId,

        hook,

        duration,

        video:
          rendered.videoUrl

      })
    );


    return {

      success:
        true,

      idea,

      reel,

      hook,

      caption,

      rendered

    };


  } catch (error) {

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


    await saveJob(
      env,
      chatId,
      job
    );


    await sendMessage(
      env,
      chatId,

      [
        "❌ ساخت Reel متوقف شد.",
        "",
        `🔧 ${error?.message || error}`,
        "",
        "💡 کدها سالم هستند؛ مشکل در یکی از مراحل Pipeline رخ داده."
      ].join("\n")
    );


    return {

      success:
        false,

      error:
        error?.message ||
        String(error)

    };

  }

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


  const seconds =
    Number(
      match[1]
    );


  return Math.max(
    5,
    Math.min(
      30,
      seconds
    )
  );

}
