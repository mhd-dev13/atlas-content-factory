// ============================================================
// 🎬 ATLAS REEL PIPELINE 3.0
// Idea → Director → Image → Video → Caption
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
// 💾 SAVE
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
      error?.message ||
      error
    );

  }

}


// ============================================================
// 🎯 HOOK
// ============================================================

function getHook(
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
    const candidate of candidates
  ) {

    if (
      candidate &&
      String(candidate).trim()
    ) {

      return String(
        candidate
      )
        .replace(/\s+/g, " ")
        .trim();

    }

  }


  return "LET THE RAIN SLOW EVERYTHING DOWN.";

}


// ============================================================
// 🎨 VISUAL
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
    "A cinematic peaceful nature scene",
    "with realistic lighting and subtle atmosphere."
  ].join(" ");

}


// ============================================================
// 🖼️ IMAGE PROMPT
// ============================================================

function buildImagePrompt(
  reel,
  idea,
  hook
) {

  const visual =
    getVisual(
      reel,
      idea
    );


  const camera =
    reel?.scenes?.[0]?.camera ||
    "cinematic medium-wide shot";


  return `

Create ONE premium cinematic background image
for an Instagram Reel.

SUBJECT:

${visual}

CAMERA:

${camera}

STYLE:

premium cinematic photography,
photorealistic,
natural realistic lighting,
soft atmospheric depth,
subtle depth of field,
high-end editorial photography,
emotionally calming,
visually rich,
Instagram viral aesthetic,
professional composition.

COMPOSITION:

Vertical 9:16.

Designed specifically for a 1080x1920 Reel.

Keep the main subject visually interesting.

Leave clean negative space in the
upper portion of the image for a headline.

The headline will be added later by the
video rendering system.

IMPORTANT:

DO NOT generate text.

DO NOT generate letters.

DO NOT generate words.

DO NOT generate subtitles.

DO NOT generate logos.

DO NOT generate watermarks.

DO NOT generate UI elements.

DO NOT place typography in the image.

The image must be clean and cinematic.

HEADLINE SPACE:

Keep the upper 25 percent of the image
visually calm and uncluttered.

Do not place important objects directly
behind the future headline.

`.trim();

}


// ============================================================
// 📝 BUILD CAPTION
// ============================================================

function buildCaption(
  reel
) {

  const english =
    String(
      reel?.caption_en ||
      reel?.hook ||
      ""
    ).trim();


  const persian =
    String(
      reel?.caption_fa ||
      "چند لحظه از شلوغی فاصله بگیر."
    ).trim();


  const cta =
    String(
      reel?.cta ||
      ""
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
// ⏱️ DURATION
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
    // 2️⃣ DIRECTOR
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
        "Atlas Reel Director...",
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
        "در حال ساخت تصویر سینمایی...",
        "",
        `🎯 ${hook}`
      ].join("\n")

    );


    const imagePrompt =
      buildImagePrompt(

        reel,

        idea,

        hook

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
        "✨ Hook Typography",
        "🔍 Slow Zoom",
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
        "📤 در حال ارسال به تلگرام..."
      ].join("\n")

    );


    // ========================================================
    // SEND VIDEO
    // ========================================================

    await sendVideo(

      env,

      chatId,

      rendered.videoUrl,

      caption

    );


    // ========================================================
    // COMPLETE
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

        hook,

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
        "💡 Reel قبلی دست‌نخورده باقی می‌ماند."
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
