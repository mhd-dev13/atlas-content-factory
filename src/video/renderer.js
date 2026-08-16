// ============================================================
// 🎬 ATLAS VIDEO RENDERER 5.0
//
// Stable Render Engine
//
// Image
//   ↓
// 1080x1920
//   ↓
// Slow Zoom
//   ↓
// Persian Typography
//   ↓
// MP4
//
// IMPORTANT:
// - Persian text is rendered by FFmpeg
// - Audio is disabled for the first stable test
// - Renderer has a hard timeout
// - Avoids unnecessary heavy filters
// ============================================================


const BASE_URL =
  "https://api.ffmpeg-micro.com";


// ============================================================
// ⏳ SLEEP
// ============================================================

function sleep(ms) {

  return new Promise(
    resolve =>
      setTimeout(resolve, ms)
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

  return String(
    value || ""
  )

    .replace(
      /\\/g,
      "\\\\"
    )

    .replace(
      /'/g,
      "\\'"
    )

    .replace(
      /:/g,
      "\\:"
    )

    .replace(
      /,/g,
      "\\,"
    )

    .replace(
      /\[/g,
      "\\["
    )

    .replace(
      /\]/g,
      "\\]"
    )

    .replace(
      /%/g,
      "\\%"
    )

    .replace(
      /;/g,
      "\\;"
    );

}


// ============================================================
// ✂️ PERSIAN TEXT WRAP
// ============================================================

function wrapPersian(
  text,
  maxChars = 25
) {

  const clean =
    String(
      text || ""
    )

      .replace(
        /\s+/g,
        " "
      )

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
// 🇮🇷 BUILD PERSIAN TYPOGRAPHY
// ============================================================

function buildPersianFilter(
  persianText
) {

  const lines =
    wrapPersian(
      persianText,
      25
    );


  if (!lines.length) {

    return "";

  }


  const text =
    lines.join("\\n");


  const safeText =
    escapeDrawtext(
      text
    );


  /*
   * IMPORTANT:
   *
   * Use explicit font name.
   *
   * DejaVu Sans contains Arabic/Persian
   * glyphs and FFmpeg-Micro has already
   * been observed running with this font.
   *
   * text_shaping=1 is required for Arabic
   * / Persian character shaping.
   */

  return [

    "drawtext",

    "font='DejaVu Sans'",

    `text='${safeText}'`,

    "fontcolor=white",

    "fontsize=60",

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

      `FFMPEG_UPLOAD_CONFIRM_FAILED:${JSON.stringify(confirmData)}`

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

  motion,

  persianText

) {

  // ----------------------------------------------------------
  // 🎞️ FRAME COUNT
  // ----------------------------------------------------------

  const fps =
    30;


  const frameCount =
    Math.max(

      150,

      Math.min(

        900,

        Math.round(
          duration * fps
        )

      )

    );


  // ----------------------------------------------------------
  // 🎥 VIDEO FILTER
  // ----------------------------------------------------------

  const filters = [

    /*
     * Normalize image.
     */

    "scale=1080:1920:force_original_aspect_ratio=increase",

    "crop=1080:1920",


    /*
     * Slow cinematic zoom.
     *
     * d is now based on actual duration.
     */

    `zoompan=z='min(zoom+0.0008,1.08)':d=${frameCount}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${fps}`

  ];


  // ----------------------------------------------------------
  // 🇮🇷 PERSIAN TYPOGRAPHY
  // ----------------------------------------------------------

  const persianFilter =
    buildPersianFilter(
      persianText
    );


  if (persianFilter) {

    filters.push(
      persianFilter
    );

  }


  const videoFilter =
    filters.join(",");


  console.log(
    "ATLAS_VIDEO_FILTER:",
    videoFilter
  );


  // ----------------------------------------------------------
  // INPUT
  // ----------------------------------------------------------

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
            String(fps)

        }

      ]

    }

  ];


  // ----------------------------------------------------------
  // OUTPUT OPTIONS
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
        "ultrafast"

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
        String(fps)

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

    }

  ];


  console.log(

    "ATLAS_TRANSCODE_CREATE:",

    JSON.stringify({

      duration,

      fps,

      frameCount,

      motion,

      persianText,
      hasText:
        Boolean(persianText)

    })

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

      `FFMPEG_TRANSCODE_FAILED:${JSON.stringify(data)}`

    );

  }


  const jobId =
    data?.id ||
    data?.result?.id;


  if (!jobId) {

    throw new Error(
      "FFMPEG_JOB_ID_MISSING"
    );

  }


  console.log(

    "ATLAS_FFMPEG_JOB_CREATED:",

    jobId

  );


  return jobId;

}


// ============================================================
// 🔄 WAIT FOR VIDEO
// ============================================================

async function waitForVideo(

  env,

  jobId,

  duration

) {

  /*
   * FFmpeg should normally finish well
   * under this limit.
   *
   * 90 seconds is enough for a 5-30s Reel.
   */

  const timeoutMs =
    90000;


  const started =
    Date.now();


  let attempt =
    0;


  while (
    Date.now() - started <
    timeoutMs
  ) {

    attempt++;


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

        `FFMPEG_STATUS_FAILED:${JSON.stringify(data)}`

      );

    }


    const status =
      String(

        data?.status ||

        ""

      ).toLowerCase();


    console.log(

      `ATLAS_VIDEO_STATUS [${attempt}]:`,

      status

    );


    // --------------------------------------------------------
    // COMPLETE
    // --------------------------------------------------------

    if (
      status ===
      "completed"
    ) {

      return data;

    }


    // --------------------------------------------------------
    // FAILED
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

        data?.error_message ||

        data?.error ||

        JSON.stringify(data);


      throw new Error(

        `FFMPEG_RENDER_FAILED:${message}`

      );

    }

  }


  // ----------------------------------------------------------
  // TIMEOUT
  // ----------------------------------------------------------

  throw new Error(

    `FFMPEG_RENDER_TIMEOUT:job=${jobId}:duration=${duration}s`

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
    data?.url ||
    data?.result?.url;


  if (!url) {

    throw new Error(
      "FFMPEG_DOWNLOAD_URL_MISSING"
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
   * New Pipeline sends:
   *
   * options.persianText
   */

  const persianText =

    String(

      options.persianText ||

      options.hook ||

      ""

    )

      .trim();


  console.log(

    "ATLAS_RENDER_START:",

    JSON.stringify({

      duration,

      motion,

      persianText,

      hasPersianText:
        Boolean(persianText),

      bytes:
        imageBuffer?.byteLength

    })

  );


  // ==========================================================
  // 1️⃣ UPLOAD
  // ==========================================================

  const uploaded =

    await uploadImage(

      env,

      imageBuffer

    );


  console.log(

    "ATLAS_IMAGE_UPLOADED:",

    uploaded.filename

  );


  // ==========================================================
  // 2️⃣ CREATE FFMPEG JOB
  // ==========================================================

  const jobId =

    await createVideoJob(

      env,

      uploaded.fileUrl,

      duration,

      motion,

      persianText

    );


  // ==========================================================
  // 3️⃣ WAIT
  // ==========================================================

  await waitForVideo(

    env,

    jobId,

    duration

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
  // 5️⃣ RESULT
  // ==========================================================

  console.log(

    "ATLAS_RENDER_COMPLETE:",

    JSON.stringify({

      jobId,

      duration,

      motion,

      persianText,

      videoUrl

    })

  );


  return {

    jobId,

    videoUrl,

    duration,

    motion,

    persianText,

    audio:
      false

  };

}
