// ============================================================
// 🎬 ATLAS REEL PIPELINE
// Idea → Post → Image → Hook → Motion → Video
// ============================================================

import {
  generateIdea,
  generatePost
} from "../content/engine.js";

import {
  checkContent
} from "../content/quality.js";

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
// 📊 PROGRESS MESSAGE
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
  idea
) {

  const candidates = [

    idea?.hook_en,

    idea?.hook,

    idea?.title,

    idea?.headline

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
// 🖼️ BUILD IMAGE PROMPT
// ============================================================

function buildImagePrompt(
  idea
) {

  const visual =
    idea?.visual ||
    idea?.concept ||
    "peaceful nature scene";


  return `

Create a cinematic vertical Instagram Reel scene.

Main visual:
${visual}

Concept:
${idea?.concept || ""}

Atmosphere:
peaceful, calming, relaxing, natural,
cinematic realistic photography,
soft natural lighting,
subtle depth of field.

Composition:
vertical 9:16,
strong visual subject,
clean center composition,
Instagram Reel friendly framing.

IMPORTANT:
The image itself must contain NO text.
Do not generate letters.
Do not generate words.
Do not generate logos.
Do not generate watermarks.

The Hook will be added later by the
video renderer.

`.trim();

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
        "در حال ساخت ایده و Hook..."
      ].join("\n")
    );


    const idea =
      await generateIdea(
        env
      );


    const hook =
      getHook(
        idea
      );


    job.idea =
      idea;


    job.hook =
      hook;


    await saveJob(
      env,
      chatId,
      job
    );


    // ========================================================
    // 2️⃣ POST / CAPTION
    // ========================================================

    job.status =
      "content";


    await saveJob(
      env,
      chatId,
      job
    );


    await progress(
      env,
      chatId,

      [
        "📝 مرحله 2/5",
        "در حال ساخت Caption..."
      ].join("\n")
    );


    let post =
      await generatePost(
        env,
        JSON.stringify(
          idea
        )
      );


    // ========================================================
    // 🛡️ QUALITY CHECK
    // ========================================================

    let quality =
      await checkContent(
        env,
        post
      );


    if (
      !quality.approved
    ) {

      console.log(
        "ATLAS_REEL_QUALITY_RETRY:",
        JSON.stringify(
          quality
        )
      );


      post =
        await generatePost(
          env,

          [

            JSON.stringify(
              idea
            ),

            "",

            "QUALITY ISSUES:",

            JSON.stringify(
              quality.issues ||
              []
            ),

            "",

            "SUGGESTED FIXES:",

            JSON.stringify(
              quality.fixes ||
              []
            )

          ].join("\n")
        );


      quality =
        await checkContent(
          env,
          post
        );

    }


    job.post =
      post;


    job.quality =
      quality;


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
        "در حال ساخت تصویر مرتبط با Hook...",
        "",
        `🎯 ${hook}`
      ].join("\n")
    );


    const imagePrompt =
      buildImagePrompt(
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
    // 4️⃣ VIDEO + HOOK
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
        "⏱️ 10 seconds"
      ].join("\n")
    );


    const rendered =
      await renderImageToVideo(

        env,

        imageBuffer,

        {

          duration:
            10,

          motion:
            "zoom_in",

          hook:
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
        "⏱️ 10 seconds",
        "📱 1080×1920",
        "🔍 Slow Zoom",
        "",
        "━━━━━━━━━━━━━━",
        "",
        "📝 CAPTION",
        "",
        post
      ].join("\n")
    );


    // ========================================================
    // DONE
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
        duration:
          10
      })
    );


    return {

      success:
        true,

      idea,

      hook,

      post,

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
