// ============================================================
// 🎬 ATLAS VIDEO RENDERER 4.0
// Persian Hook Typography via ffmpeg-micro @text-overlay
// No drawtext
// Slow Zoom
// 1080x1920
// ============================================================

const BASE_URL =
  "https://api.ffmpeg-micro.com";

const VIDEO_WIDTH =
  1080;

const VIDEO_HEIGHT =
  1920;

const FPS =
  30;

const DEFAULT_DURATION =
  10;

const MAX_DURATION =
  30;

const POLL_INTERVAL =
  2000;

const MAX_ATTEMPTS =
  45;


// ============================================================
// ⏳ SLEEP
// ============================================================

function sleep(ms) {

  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );

}


// ============================================================
// 🔐 AUTH
// ============================================================

function authHeaders(env) {

  if (
    !env?.FFMPEG_MICRO_API_KEY
  ) {

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
// 🧹 CLEAN PERSIAN TEXT
// ============================================================

function cleanText(value) {

  return String(
    value || ""
  )

    .replace(/\r/g, "")

    .replace(
      /\\n/g,
      "\n"
    )

    .replace(
      /\n{3,}/g,
      "\n\n"
    )

    .trim();

}


// ============================================================
// 📝 NORMALIZE HOOK
// ============================================================

function normalizeHook(value) {

  const text =
    cleanText(value);

  if (!text) {

    return "";

  }

  // Keep Persian text compact enough
  // for the overlay engine.

  const lines =
    text
      .split("\n")
      .map(
        line =>
          line
            .replace(/\s+/g, " ")
            .trim()
      )
      .filter(Boolean);

  if (
    lines.length <= 3
  ) {

    return lines.join("\n");

  }

  return lines
    .slice(0, 3)
    .join("\n");

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
    `atlas-reel-${Date.now()}.png`;


  // ----------------------------------------------------------
  // 1. PRESIGNED URL
  // ----------------------------------------------------------

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
      `FFMPEG_UPLOAD_URL_FAILED:${JSON.stringify(data)}`
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


  // ----------------------------------------------------------
  // 2. UPLOAD
  // ----------------------------------------------------------

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


  if (
    !uploadResponse.ok
  ) {

    throw new Error(
      `FFMPEG_IMAGE_UPLOAD_FAILED:${uploadResponse.status}`
    );

  }


  // ----------------------------------------------------------
  // 3. CONFIRM
  // ----------------------------------------------------------

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


  if (
    !confirmResponse.ok
  ) {

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
  hook
) {

  const safeHook =
    normalizeHook(
      hook
    );


  if (!safeHook) {

    throw new Error(
      "PERSIAN_HOOK_MISSING"
    );

  }


  // ----------------------------------------------------------
  // VIDEO FILTER
  //
  // IMPORTANT:
  // NO drawtext here.
  // Persian text is handled by @text-overlay.
  // ----------------------------------------------------------

  const videoFilter = [

    `scale=${VIDEO_WIDTH}:${VIDEO_HEIGHT}:force_original_aspect_ratio=increase`,

    `crop=${VIDEO_WIDTH}:${VIDEO_HEIGHT}`,

    `zoompan=` +
      `z='min(zoom+0.0008,1.08)':` +
      `d=${duration * FPS}:` +
      `x='iw/2-(iw/zoom/2)':` +
      `y='ih/2-(ih/zoom/2)':` +
      `s=${VIDEO_WIDTH}x${VIDEO_HEIGHT}:` +
      `fps=${FPS}`

  ].join(",");


  // ----------------------------------------------------------
  // FFMPEG OPTIONS
  // ----------------------------------------------------------

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
        "-pix_fmt",

      argument:
        "yuv420p"

    },

    {

      option:
        "-r",

      argument:
        String(FPS)

    },

    {

      option:
        "-an",

      argument:
        ""

    },

    {

      option:
        "-movflags",

      argument:
        "+faststart"

    },

    // --------------------------------------------------------
    // 🇮🇷 PERSIAN TEXT OVERLAY
    // --------------------------------------------------------

    {

      option:
        "@text-overlay",

      argument: {

        text:
          safeHook,

        style: {

          position:
            "center",

          fontSize:
            58,

          fontColor:
            "#FFFFFF",

          outlineThickness:
            4,

          outlineColor:
            "#000000",

          textWidth:
            900

        }

      }

    }

  ];


  const body = {

    inputs: [

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
              String(FPS)

          }

        ]

      }

    ],

    outputFormat:
      "mp4",

    options

  };


  console.log(
    "ATLAS_VIDEO_JOB_BODY:",
    JSON.stringify(
      body,
      null,
      2
    )
  );


  // ----------------------------------------------------------
  // CREATE JOB
  // ----------------------------------------------------------

  const response =
    await fetch(
      `${BASE_URL}/v1/transcodes`,
      {

        method:
          "POST",

        headers:
          authHeaders(env),

        body:
          JSON.stringify(body)

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
      `FFMPEG_TRANSCODE_FAILED:${JSON.stringify(data)}`
    );

  }


  const jobId =
    data?.result?.id ||
    data?.id;


  if (!jobId) {

    throw new Error(
      "FFMPEG_JOB_ID_MISSING"
    );

  }


  console.log(
    "ATLAS_VIDEO_JOB_CREATED:",
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

  for (
    let attempt = 1;
    attempt <= MAX_ATTEMPTS;
    attempt++
  ) {

    await sleep(
      POLL_INTERVAL
    );


    const response =
      await fetch(
        `${BASE_URL}/v1/transcodes/${jobId}`,
        {

          method:
            "GET",

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
        `FFMPEG_STATUS_FAILED:${JSON.stringify(data)}`
      );

    }


    const status =
      String(

        data?.result?.status ||
        data?.status ||
        ""

      ).toLowerCase();


    console.log(
      `ATLAS_VIDEO_STATUS [${attempt}/${MAX_ATTEMPTS}]:`,
      status
    );


    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    if (

      status ===
        "completed" ||

      status ===
        "done" ||

      status ===
        "success"

    ) {

      return data;

    }


    // --------------------------------------------------------
    // FAILURE
    // --------------------------------------------------------

    if (

      status ===
        "failed" ||

      status ===
        "error" ||

      status ===
        "cancelled"

    ) {

      const message =
        data?.result?.error_message ||
        data?.error_message ||
        data?.result?.error ||
        data?.error ||
        JSON.stringify(data);


      throw new Error(
        `FFMPEG_RENDER_FAILED:${message}`
      );

    }

  }


  throw new Error(
    "FFMPEG_RENDER_TIMEOUT"
  );

}


// ============================================================
// 📥 DOWNLOAD URL
// ============================================================

async function getDownloadUrl(
  env,
  jobId
) {

  const response =
    await fetch(

      `${BASE_URL}/v1/transcodes/${jobId}/download?url=true`,

      {

        method:
          "GET",

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
      `FFMPEG_DOWNLOAD_FAILED:${JSON.stringify(data)}`
    );

  }


  const url =

    data?.result?.url ||

    data?.url ||

    data?.result?.downloadUrl;


  if (!url) {

    throw new Error(
      `FFMPEG_DOWNLOAD_URL_MISSING:${JSON.stringify(data)}`
    );

  }


  return url;

}


// ============================================================
// 🚀 MAIN
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

        MAX_DURATION,

        Number(
          options.duration ||
          DEFAULT_DURATION
        )

      )

    );


  const hook =
    normalizeHook(

      options.persianText ||

      options.hook ||

      options.text ||

      ""

    );


  if (!hook) {

    throw new Error(
      "PERSIAN_HOOK_MISSING"
    );

  }


  console.log(
    "ATLAS_RENDER_START:",
    {

      duration,

      hook,

      hasPersianText:
        true,

      bytes:
        imageBuffer?.byteLength

    }
  );


  // ----------------------------------------------------------
  // 1️⃣ UPLOAD
  // ----------------------------------------------------------

  const uploaded =
    await uploadImage(

      env,

      imageBuffer

    );


  console.log(
    "ATLAS_IMAGE_UPLOADED:",
    uploaded.fileUrl
  );


  // ----------------------------------------------------------
  // 2️⃣ CREATE JOB
  // ----------------------------------------------------------

  const jobId =
    await createVideoJob(

      env,

      uploaded.fileUrl,

      duration,

      hook

    );


  // ----------------------------------------------------------
  // 3️⃣ WAIT
  // ----------------------------------------------------------

  await waitForVideo(

    env,

    jobId

  );


  // ----------------------------------------------------------
  // 4️⃣ DOWNLOAD
  // ----------------------------------------------------------

  const videoUrl =
    await getDownloadUrl(

      env,

      jobId

    );


  console.log(
    "ATLAS_RENDER_COMPLETE:",
    {

      jobId,

      duration,

      hook,

      videoUrl

    }
  );


  return {

    jobId,

    videoUrl,

    duration,

    hook,

    persianText:
      hook,

    audio:
      false

  };

}


// ============================================================
// 🔁 COMPATIBILITY ALIAS
// ============================================================

export async function renderQuoteImage(
  env,
  imageBuffer,
  options = {}
) {

  return renderImageToVideo(

    env,

    imageBuffer,

    {

      duration:
        options.duration,

      persianText:
        options.text ||

        options.persianText ||

        ""

    }

  );

}
