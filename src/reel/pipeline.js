// ============================================================
// 🎬 ATLAS REEL PIPELINE
// Idea → Post → Image → Motion → Video
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
// 📊 PROGRESS
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
        "در حال ساخت Caption و محتوای Reel..."
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
    // QUALITY CHECK
    // ========================================================

    let quality =
      await checkContent(
        env,
        post
      );


    if (!quality.approved) {

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
              quality.issues || []
            ),

            "",

            "SUGGESTED FIXES:",

            JSON.stringify(
              quality.fixes || []
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
        "در حال ساخت تصویر سینمایی 9:16..."
      ].join("\n")
    );


    const visual =
      idea?.visual ||
      idea?.concept ||
      idea?.hook_en ||
      "peaceful nature scene";


    const imagePrompt = `

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
Instagram Reel friendly framing.

Do not include:
text,
letters,
logos,
watermarks,
UI,
borders.

`.trim();


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
    // 4️⃣ VIDEO / MOTION
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
        "در حال اعمال Motion و ساخت ویدیو...",
        "",
        "🔍 Slow Zoom",
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
            "zoom_in"
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
        "Reel آماده است.",
        "",
        "📤 در حال ارسال فایل..."
      ].join("\n")
    );


    await sendVideo(
      env,
      chatId,
      rendered.videoUrl,

      [
        "🎬 ATLAS REEL READY",
        "",
        `🎯 ${idea?.hook_en || "Calm Nature"}`,
        "",
        "⏱️ 10 seconds",
        "📱 1080×1920",
        "🔍 Slow Zoom",
        "",
        "📝 CAPTION",
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


    return {

      success:
        true,

      idea,

      post,

      rendered

    };


  } catch (error) {

    console.error(
      "ATLAS_REEL_PIPELINE_ERROR:",
      error?.stack || error
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
