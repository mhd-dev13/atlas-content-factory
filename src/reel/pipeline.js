// ============================================================
// 🎬 ATLAS REEL PIPELINE
// One Click:
// Idea → Reel Director → Persian Hook → Image → Video → Caption
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
// 📡 SAFE PROGRESS
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
// 🎯 GET PERSIAN HOOK
// ============================================================

function getHook(
  reel,
  idea
) {

  const candidates = [

    // Highest priority:
    reel?.on_screen_text?.fa,

    reel?.hook_fa,

    idea?.hook_fa,

    // Fallback:
    reel?.hook,

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


  return "فقط چند لحظه مکث کن.";

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
    "A peaceful cinematic nature scene,",
    "minimal composition,",
    "soft atmospheric light."
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
    "cinematic static shot";


  const motion =
    reel?.scenes?.[0]?.motion ||
    "subtle natural movement";


  return `

Create ONE premium cinematic background
for a vertical Instagram Reel.

SUBJECT:

${visual}

CAMERA:

${camera}

MOTION CONCEPT:

${motion}

VISUAL STYLE:

cinematic realistic photography,
minimalist Instagram aesthetic,
moody peaceful atmosphere,
soft natural lighting,
subtle film grain,
deep atmospheric tones,
high detail,
professional composition,
strong negative space,
visually interesting but not busy.

COMPOSITION:

Vertical 9:16.
Designed for 1080x1920.
Keep important visual elements away
from the extreme edges.

VERY IMPORTANT:

The final video will contain Persian
on-screen typography added later.

DO NOT generate:

text,
letters,
words,
subtitles,
captions,
logos,
watermarks,
signs,
UI,
interfaces,
borders.

The image itself must contain ZERO text.

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
      reel?.caption_en || ""
    ).trim();


  const persian =
    String(
      reel?.caption_fa || ""
    ).trim();


  const cta =
    String(
      reel?.cta || ""
    ).trim();


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

    english
      ? `🇬🇧 ${english}`
      : "",

    persian
      ? `🇮🇷 ${persian}`
      : "",

    cta
      ? `✨ ${cta}`
      : "",

    hashtags

  ]

    .filter(Boolean)

    .join("\n\n")

    .trim();

}


// ============================================================
// ✂️ TELEGRAM SAFE CAPTION
// ============================================================

function safeCaption(
  caption
) {

  const max =
    850;


  if (
    caption.length <= max
  ) {

    return caption;

  }


  return (
    caption
      .slice(
        0,
        max - 3
      )
      .trim() +
    "..."
  );

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
        `🇮🇷 ${idea?.hook_fa || "در حال ساخت Hook..."}`

      ].join("\n")
    );


    const reel =
      await generateReel(

        env,

        JSON.stringify(
          idea
        )

      );


    // --------------------------------------------------------
    // Persian Hook
    // --------------------------------------------------------

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
        "در حال ساخت تصویر سینمایی...",
        "",
        `📝 متن روی تصویر:`,
        hook
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
        "در حال ساخت Reel...",
        "",
        "📝 Persian Hook",
        "🔍 Slow Zoom",
        "📱 1080×1920",
        "🔊 Audio Engine: Ready"
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

          hook,

          audioUrl:
            env?.ATLAS_AUDIO_URL || ""

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

      safeCaption(
        caption
      )

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

        audio:
          rendered.audio,

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


    // --------------------------------------------------------
    // Don't expose gigantic FFmpeg errors to Telegram
    // --------------------------------------------------------

    let safeError =
      String(
        error?.message ||
        error ||
        "UNKNOWN_ERROR"
      );


    if (
      safeError.length > 1200
    ) {

      safeError =
        safeError.slice(
          0,
          1200
        ) +
        "...";

    }


    try {

      await sendMessage(
        env,
        chatId,

        [
          "❌ ساخت Reel متوقف شد.",
          "",
          `🔧 ${safeError}`,
          "",
          "💡 Reel قبلی دست‌نخورده باقی می‌ماند."
        ].join("\n")
      );

    } catch (
      telegramError
    ) {

      console.error(
        "ATLAS_FAILURE_MESSAGE_ERROR:",
        telegramError?.message ||
        telegramError
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
