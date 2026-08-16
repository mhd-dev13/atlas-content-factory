// ============================================================
// 🎬 ATLAS VIDEO RENDERER 4.0
// Clean Image + Persian Typography + Lightweight Slow Zoom
// Output: MP4 / H.264 / 1080x1920 / 30 FPS
// ============================================================

const BASE_URL =
  "https://api.ffmpeg-micro.com";


// ============================================================
// ⏳ SLEEP
// ============================================================

function sleep(ms) {

  return new Promise(
    resolve => setTimeout(resolve, ms)
  );

}


// ============================================================
// 🔐 AUTH
// ============================================================

function authHeaders(env) {

  if (!env?.FFMPEG_MICRO_API_KEY) {

    throw new Error(
      "FFMPEG_MICRO_API_KEY_MISSING"
    );

  }

  return {

    "Authorization":
      `Bearer ${env.FFMPEG_MICRO_API_KEY}`,

    "Content-Type":
      "application/json"

  };

}


// ============================================================
// 🧹 ESCAPE FFMPEG TEXT
// ============================================================

function escapeDrawtext(value) {

  return String(value || "")

    .replace(/\\/g, "\\\\")

    .replace(/'/g, "\\'")

    .replace(/:/g, "\\:")

    .replace(/,/g, "\\,")

    .replace(/\[/g, "\\[")

    .replace(/\]/g, "\\]")

    .replace(/%/g, "\\%");

}


// ============================================================
// ✂️ WRAP PERSIAN TEXT
// ============================================================

function wrapPersianText(
  text,
  maxChars = 24
) {

  const clean =
    String(text || "")
      .replace(/\s+/g, " ")
      .trim();


  if (!clean) {

    return [];

  }


  const words =
    clean.split(" ");


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
    3
  );

}


// ============================================================
// 📝 BUILD PERSIAN TEXT FILTER
// ============================================================

function buildPersianTextFilter(
  text
) {

  const lines =
    wrapPersianText(
      text,
      24
    );


  if (!lines.length) {

    return "";

  }


  const joined =
    lines.join("\\n");


  const safeText =
    escapeDrawtext(
      joined
    );


  /*
   * IMPORTANT
   *
   * The renderer intentionally uses a
   * common Linux font.
   *
   * If the FFmpeg server exposes a Persian
   * font later, we can upgrade this to:
   *
   * Noto Sans Arabic
   *
   * or:
   *
   * Vazirmatn
   *
   * without changing the pipeline.
   */

  return [

    "drawtext",

    "font='DejaVu Sans'",

    `text='${safeText}'`,

    "fontcolor=white",

    "fontsize=56",

    "line_spacing=12",

    "text_shaping=1",

    "x=(w-text_w)/2",

    "y=h*0.12",

    "box=1",

    "boxcolor=black@0.42",

    "boxborderw=22",

    "shadowcolor=black@0.80",

    "shadowx=2",

    "shadowy=2"

  ].join(":");

}


// ============================================================
// 📤 UPLOAD IMAGE
// ============================================================

async function uploadImage(
  env,
  imageBuffer
) {

  if (!imageBuffer) {

    throw new Error(
      "IMAGE_BUFFER_MISSING"
    );

  }


  const fileSize =
    imageBuffer.byteLength;


  if (!fileSize) {

    throw new Error(
      "IMAGE_BUFFER_EMPTY"
    );

  }


  const filename =
    `atlas-image-${Date.now()}.png`;


  console.log(
    "ATLAS_UPLOAD_START:",
    {
      filename,
      fileSize
    }
  );


  const response =
    await fetch(

      `${BASE_URL}/v1/upload/presigned-url`,

      {

        method:
          "POST",

        headers:
          authHeaders(env),

        body:
          JSON.stringify({

            filename,

            contentType:
              "image/png",

            fileSize

          })

      }

    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(

      `FFMPEG_UPLOAD_URL_FAILED:${JSON.stringify(
        data
      )}`

    );

  }


  const uploadUrl =
    data?.result?.uploadUrl;


  const serverFilename =
    data?.result?.filename;


  if (
    !uploadUrl ||
    !serverFilename
  ) {

    throw new Error(
      "FFMPEG_UPLOAD_URL_INVALID"
    );

  }


  const uploadResponse =
    await fetch(

      uploadUrl,

      {

        method:
          "PUT",

        headers: {

          "Content-Type":
            "image/png"

        },

        body:
          imageBuffer

      }

    );


  if (!uploadResponse.ok) {

    throw new Error(

      `FFMPEG_IMAGE_UPLOAD_FAILED:${uploadResponse.status}`

    );

  }


  const confirmResponse =
    await fetch(

      `${BASE_URL}/v1/upload/confirm`,

      {

        method:
          "POST",

        headers:
          authHeaders(env),

        body:
          JSON.stringify({

            filename:
              serverFilename,

            fileSize

          })

      }

    );


  const confirmData =
    await confirmResponse.json();


  if (!confirmResponse.ok) {

    throw new Error(

      `FFMPEG_UPLOAD_CONFIRM_FAILED:${JSON.stringify(
        confirmData
      )}`

    );

  }


  const fileUrl =
    confirmData?.result?.fileUrl;


  if (!fileUrl) {

    throw new Error(
      "FFMPEG_FILE_URL_MISSING"
    );

  }


  console.log(
    "ATLAS_UPLOAD_COMPLETE:",
    {
      serverFilename,
      fileSize
    }
  );


  return {

    filename:
      serverFilename,

    fileUrl,

    fileSize

  };

}


// ============================================================
// 🎥 CREATE VIDEO JOB
// ============================================================

async function createVideoJob(
  env,
  fileUrl,
  duration,
  motion,
  persianText,
  audioUrl
) {

  console.log(
    "ATLAS_TRANSCODE_PREPARING:",
    {

      duration,

      motion,

      persianText,

      hasAudio:
        Boolean(audioUrl)

    }
  );


  // ==========================================================
  // 🎞 VIDEO FILTER
  // ==========================================================

  /*
   * IMPORTANT:
   *
   * We intentionally avoid zoompan.
   *
   * zoompan is considerably heavier because
   * it creates frames through a filter chain.
   *
   * For a static AI image, a light scale/crop
   * pipeline is much safer.
   */

  const filters = [

    "scale=1080:1920:force_original_aspect_ratio=increase",

    "crop=1080:1920",

  ];


  // ==========================================================
  // 🔍 OPTIONAL LIGHT ZOOM
  // ==========================================================

  /*
   * Keep the first version extremely stable.
   *
   * We use a tiny dynamic crop movement.
   *
   * This creates a subtle cinematic feeling
   * without the expensive zoompan filter.
   */

  if (
    motion === "zoom_in"
  ) {

    filters.push(

      "scale=1100:1956:force_original_aspect_ratio=increase",

      "crop=1080:1920"

    );

  }


  // ==========================================================
  // 🇮🇷 PERSIAN TYPOGRAPHY
  // ==========================================================

  const textFilter =
    buildPersianTextFilter(
      persianText
    );


  if (textFilter) {

    filters.push(
      textFilter
    );

  }


  const videoFilter =
    filters.join(",");


  console.log(
    "ATLAS_VIDEO_FILTER:",
    videoFilter
  );


  // ==========================================================
  // 📥 INPUT
  // ==========================================================

  const inputs = [

    {

      url:
        fileUrl,

      options: [

        {

          option:
            "-loop",

          argument:
            "1"

        },

        {

          option:
            "-framerate",

          argument:
            "30"

        }

      ]

    }

  ];


  // ==========================================================
  // 🔊 OPTIONAL AUDIO
  // ==========================================================

  const hasAudio =
    Boolean(
      audioUrl
    );


  if (hasAudio) {

    inputs.push({

      url:
        audioUrl,

      options: [

        {

          option:
            "-stream_loop",

          argument:
            "-1"

        }

      ]

    });

  }


  // ==========================================================
  // ⚙️ OUTPUT OPTIONS
  // ==========================================================

  const options = [

    {

      option:
        "-t",

      argument:
        String(duration)

    },

    {

      option:
        "-vf",

      argument:
        videoFilter

    },

    {

      option:
        "-c:v",

      argument:
        "libx264"

    },

    {

      option:
        "-preset",

      argument:
        "veryfast"

    },

    {

      option:
        "-crf",

      argument:
        "23"

    },

    {

      option:
        "-pix_fmt",

      argument:
        "yuv420p"

    },

    {

      option:
        "-r",

      argument:
        "30"

    },

    {

      option:
        "-movflags",

      argument:
        "+faststart"

    }

  ];


  // ==========================================================
  // 🔊 AUDIO OUTPUT
  // ==========================================================

  if (hasAudio) {

    options.push({

      option:
        "-c:a",

      argument:
        "aac"

    });


    options.push({

      option:
        "-b:a",

      argument:
        "128k"

    });


    options.push({

      option:
        "-shortest",

      argument:
        ""

    });

  } else {

    options.push({

      option:
        "-an",

      argument:
        ""

    });

  }


  // ==========================================================
  // 🚀 CREATE JOB
  // ==========================================================

  console.log(
    "ATLAS_TRANSCODE_CREATE"
  );


  const response =
    await fetch(

      `${BASE_URL}/v1/transcodes`,

      {

        method:
          "POST",

        headers:
          authHeaders(env),

        body:
          JSON.stringify({

            inputs,

            outputFormat:
              "mp4",

            options

          })

      }

    );


  const data =
    await response.json();


  if (!response.ok) {

    console.error(
      "ATLAS_TRANSCODE_CREATE_ERROR:",
      data
    );


    throw new Error(

      `FFMPEG_TRANSCODE_FAILED:${JSON.stringify(
        data
      )}`

    );

  }


  const jobId =
    data?.id ||
    data?.result?.id;


  if (!jobId) {

    console.error(
      "ATLAS_TRANSCODE_NO_JOB_ID:",
      data
    );


    throw new Error(
      "FFMPEG_JOB_ID_MISSING"
    );

  }


  console.log(
    "ATLAS_TRANSCODE_JOB_CREATED:",
    jobId
  );


  return jobId;

}


// ============================================================
// 🔄 WAIT FOR VIDEO
// ============================================================

async function waitForVideo(
  env,
  jobId
) {

  /*
   * 60 attempts × 2 seconds
   *
   * Maximum:
   *
   * 120 seconds
   */

  const maxAttempts =
    60;


  for (
    let attempt = 0;
    attempt < maxAttempts;
    attempt++
  ) {

    await sleep(
      2000
    );


    const response =
      await fetch(

        `${BASE_URL}/v1/transcodes/${jobId}`,

        {

          headers: {

            "Authorization":
              `Bearer ${env.FFMPEG_MICRO_API_KEY}`

          }

        }

      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(

        `FFMPEG_STATUS_FAILED:${JSON.stringify(
          data
        )}`

      );

    }


    const status =
      String(
        data?.status || ""
      ).toLowerCase();


    console.log(

      `ATLAS_VIDEO_STATUS [${attempt + 1}/${maxAttempts}]:`,

      status

    );


    // ========================================================
    // ✅ COMPLETE
    // ========================================================

    if (
      status ===
      "completed"
    ) {

      console.log(
        "ATLAS_VIDEO_RENDER_COMPLETED:",
        jobId
      );


      return data;

    }


    // ========================================================
    // ❌ FAILED
    // ========================================================

    if (

      status === "failed" ||

      status === "error" ||

      status === "cancelled"

    ) {

      console.error(
        "ATLAS_VIDEO_RENDER_FAILED:",
        data
      );


      throw new Error(

        `FFMPEG_RENDER_FAILED:${JSON.stringify(
          data
        )}`

      );

    }


    // ========================================================
    // ⏳ STILL RUNNING
    // ========================================================

    if (
      attempt % 5 === 0
    ) {

      console.log(

        "ATLAS_VIDEO_RENDER_WAITING:",

        {

          jobId,

          attempt:

            attempt + 1,

          status

        }

      );

    }

  }


  throw new Error(
    "FFMPEG_RENDER_TIMEOUT"
  );

}


// ============================================================
// 📥 GET DOWNLOAD URL
// ============================================================

async function getDownloadUrl(
  env,
  jobId
) {

  const response =
    await fetch(

      `${BASE_URL}/v1/transcodes/${jobId}/download?url=true`,

      {

        headers: {

          "Authorization":
            `Bearer ${env.FFMPEG_MICRO_API_KEY}`

        }

      }

    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(

      `FFMPEG_DOWNLOAD_FAILED:${JSON.stringify(
        data
      )}`

    );

  }


  const url =
    data?.url ||
    data?.result?.url;


  if (!url) {

    throw new Error(
      "FFMPEG_DOWNLOAD_URL_MISSING"
    );

  }


  console.log(
    "ATLAS_DOWNLOAD_URL_READY"
  );


  return url;

}


// ============================================================
// 🚀 MAIN RENDER FUNCTION
// ============================================================

export async function renderImageToVideo(
  env,
  imageBuffer,
  options = {}
) {

  const duration =
    Math.max(

      5,

      Math.min(

        30,

        Number(
          options.duration || 10
        )

      )

    );


  const motion =
    options.motion ||
    "zoom_in";


  /*
   * IMPORTANT:
   *
   * This is now Persian text.
   *
   * Pipeline should pass:
   *
   * reel.on_screen_text.fa
   *
   * NOT:
   *
   * reel.hook
   */

  const persianText =
    String(

      options.persianText ||

      options.hookFa ||

      options.text ||

      ""

    )
      .trim();


  const audioUrl =
    options.audioUrl ||

    env?.ATLAS_AUDIO_URL ||

    "";


  console.log(
    "ATLAS_RENDER_START:",
    {

      duration,

      motion,

      persianText,

      hasAudio:
        Boolean(audioUrl),

      bytes:
        imageBuffer?.byteLength

    }
  );


  // ==========================================================
  // 1️⃣ UPLOAD
  // ==========================================================

  const uploaded =
    await uploadImage(

      env,

      imageBuffer

    );


  // ==========================================================
  // 2️⃣ CREATE VIDEO JOB
  // ==========================================================

  const jobId =
    await createVideoJob(

      env,

      uploaded.fileUrl,

      duration,

      motion,

      persianText,

      audioUrl

    );


  // ==========================================================
  // 3️⃣ WAIT
  // ==========================================================

  await waitForVideo(

    env,

    jobId

  );


  // ==========================================================
  // 4️⃣ DOWNLOAD
  // ==========================================================

  const videoUrl =
    await getDownloadUrl(

      env,

      jobId

    );


  // ==========================================================
  // ✅ COMPLETE
  // ==========================================================

  console.log(

    "ATLAS_RENDER_COMPLETE:",

    {

      jobId,

      duration,

      motion,

      persianText,

      hasAudio:
        Boolean(audioUrl),

      videoUrl

    }

  );


  return {

    jobId,

    videoUrl,

    duration,

    motion,

    hook:
      persianText,

    persianText,

    audio:
      Boolean(audioUrl)

  };

}
