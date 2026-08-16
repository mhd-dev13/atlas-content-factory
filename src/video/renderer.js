// ============================================================
// 🎬 ATLAS VIDEO RENDERER 4.0
// Persian Typography + Slow Zoom + Stable FFmpeg
// ============================================================

const BASE_URL =
  "https://api.ffmpeg-micro.com";


// ============================================================
// ⚙️ CONFIG
// ============================================================

const VIDEO_WIDTH = 1080;
const VIDEO_HEIGHT = 1920;
const FPS = 30;

const DEFAULT_DURATION = 10;

const MAX_DURATION = 30;

const POLL_INTERVAL = 2000;

const MAX_ATTEMPTS = 30;


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
// 🧹 ESCAPE FFMPEG DRAW_TEXT
// ============================================================

function escapeDrawtext(
  value
) {

  return String(
    value || ""
  )

    // Backslash
    .replace(
      /\\/g,
      "\\\\"
    )

    // Single quote
    .replace(
      /'/g,
      "\\'"
    )

    // Colon
    .replace(
      /:/g,
      "\\:"
    )

    // Percent
    .replace(
      /%/g,
      "\\%"
    )

    // Comma
    .replace(
      /,/g,
      "\\,"
    )

    // Brackets
    .replace(
      /\[/g,
      "\\["
    )

    .replace(
      /\]/g,
      "\\]"
    );

}


// ============================================================
// ✂️ WRAP PERSIAN TEXT
// ============================================================

function wrapPersian(
  text,
  maxChars = 22
) {

  const clean =
    String(
      text || ""
    )
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
// 📝 BUILD PERSIAN HOOK FILTER
// ============================================================

function buildPersianHookFilter(
  hook
) {

  const lines =
    wrapPersian(
      hook,
      22
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


  // ----------------------------------------------------------
  // IMPORTANT
  //
  // FFmpeg drawtext syntax MUST start with:
  //
  // drawtext=
  //
  // NOT:
  //
  // drawtext:
  // ----------------------------------------------------------

  const fontFile =
    "/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf";


  return [

    "drawtext=",

    `fontfile='${fontFile}'`,

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


  // ----------------------------------------------------------
  // GET PRESIGNED URL
  // ----------------------------------------------------------

  const response =
    await fetch(
      `${BASE_URL}/v1/upload/presigned-url`,
      {

        method: "POST",

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
  // UPLOAD
  // ----------------------------------------------------------

  const uploadResponse =
    await fetch(
      uploadUrl,
      {

        method: "PUT",

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


  // ----------------------------------------------------------
  // CONFIRM
  // ----------------------------------------------------------

  const confirmResponse =
    await fetch(
      `${BASE_URL}/v1/upload/confirm`,
      {

        method: "POST",

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
  hook,
  audioUrl
) {

  // ----------------------------------------------------------
  // VIDEO FILTER
  // ----------------------------------------------------------

  const filters = [

    // Normalize image
    `scale=${VIDEO_WIDTH}:${VIDEO_HEIGHT}:force_original_aspect_ratio=increase`,

    // Crop to exact vertical format
    `crop=${VIDEO_WIDTH}:${VIDEO_HEIGHT}`,

    // Slow cinematic zoom
    "zoompan="
      + "z='min(zoom+0.0008,1.08)':"
      + `d=${duration * FPS}:`
      + "x='iw/2-(iw/zoom/2)':"
      + "y='ih/2-(ih/zoom/2)':"
      + `s=${VIDEO_WIDTH}x${VIDEO_HEIGHT}:`
      + `fps=${FPS}`

  ];


  // ----------------------------------------------------------
  // 🇮🇷 PERSIAN HOOK
  // ----------------------------------------------------------

  const hookFilter =
    buildPersianHookFilter(
      hook
    );


  if (hookFilter) {

    filters.push(
      hookFilter
    );

  }


  const videoFilter =
    filters.join(",");


  console.log(
    "ATLAS_VIDEO_FILTER:",
    videoFilter
  );


  // ----------------------------------------------------------
  // INPUTS
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
            String(FPS)

        }

      ]

    }

  ];


  // ----------------------------------------------------------
  // AUDIO
  // ----------------------------------------------------------

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
        String(FPS)

    },

    {

      option:
        "-movflags",

      argument:
        "+faststart"

    }

  ];


  // ----------------------------------------------------------
  // AUDIO OUTPUT
  // ----------------------------------------------------------

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


  // ----------------------------------------------------------
  // CREATE TRANSCODE
  // ----------------------------------------------------------

  const response =
    await fetch(
      `${BASE_URL}/v1/transcodes`,
      {

        method: "POST",

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
  jobId
) {

  for (
    let attempt = 0;
    attempt < MAX_ATTEMPTS;
    attempt++
  ) {

    await sleep(
      POLL_INTERVAL
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
        data?.status || ""
      )
        .toLowerCase();


    console.log(

      `ATLAS_VIDEO_STATUS [${attempt + 1}/${MAX_ATTEMPTS}]:`,

      status

    );


    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    if (
      status === "completed"
    ) {

      return data;

    }


    // --------------------------------------------------------
    // FAILURE
    // --------------------------------------------------------

    if (

      status === "failed" ||

      status === "error" ||

      status === "cancelled"

    ) {

      const details =
        data?.error_message ||
        data?.error ||
        JSON.stringify(data);


      throw new Error(
        `FFMPEG_RENDER_FAILED:${details}`
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

        MAX_DURATION,

        Number(
          options.duration ||
          DEFAULT_DURATION
        )

      )

    );


  const motion =
    options.motion ||
    "zoom_in";


  const hook =
    String(
      options.hook || ""
    )
      .replace(/\s+/g, " ")
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

      hook,

      hasAudio:
        Boolean(audioUrl),

      imageBytes:
        imageBuffer?.byteLength

    }
  );


  // ----------------------------------------------------------
  // 1. UPLOAD
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
  // 2. CREATE JOB
  // ----------------------------------------------------------

  const jobId =
    await createVideoJob(

      env,

      uploaded.fileUrl,

      duration,

      motion,

      hook,

      audioUrl

    );


  // ----------------------------------------------------------
  // 3. WAIT
  // ----------------------------------------------------------

  await waitForVideo(

    env,

    jobId

  );


  // ----------------------------------------------------------
  // 4. DOWNLOAD
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

      videoUrl,

      duration,

      motion,

      hook,

      audio:
        Boolean(audioUrl)

    }
  );


  return {

    jobId,

    videoUrl,

    duration,

    motion,

    hook,

    audio:
      Boolean(audioUrl)

  };

}
