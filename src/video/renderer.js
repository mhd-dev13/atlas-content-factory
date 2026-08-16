// ============================================================
// 🎬 ATLAS VIDEO RENDERER 5.0
// Persian RTL Typography + Slow Zoom + Stable FFmpeg
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
// 🧹 SAFE TEXT
// ============================================================

function cleanText(value) {

  return String(
    value || ""
  )
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

}


// ============================================================
// ✂️ PERSIAN WRAP
// ============================================================

function wrapPersian(
  text,
  maxChars = 24
) {

  const clean =
    cleanText(text);

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
// 🔤 ESCAPE ASS
// ============================================================

function escapeASS(
  value
) {

  return String(
    value || ""
  )

    .replace(
      /\\/g,
      "\\\\"
    )

    .replace(
      /\{/g,
      "\\{"
    )

    .replace(
      /\}/g,
      "\\}"
    )

    .replace(
      /,/g,
      "\\,"
    );

}


// ============================================================
// 📝 BUILD ASS SUBTITLE
// ============================================================

function buildASS(
  hook,
  duration
) {

  const lines =
    wrapPersian(
      hook,
      24
    );

  if (!lines.length) {

    return "";

  }

  const safeLines =
    lines
      .map(
        line =>
          escapeASS(line)
      );

  const dialogueText =
    safeLines.join("\\N");

  const durationSeconds =
    Math.max(
      5,
      Math.min(
        30,
        Number(duration) || 10
      )
    );

  const endSeconds =
    durationSeconds;

  const endMinutes =
    Math.floor(
      endSeconds / 60
    );

  const remaining =
    endSeconds -
    endMinutes * 60;

  const endSecondsPart =
    remaining
      .toFixed(2)
      .padStart(5, "0");

  const endTime =
    `0:${String(endMinutes).padStart(2, "0")}:${endSecondsPart}`;

  // ----------------------------------------------------------
  // ASS STYLE
  //
  // Alignment 8 = centered upper area.
  // Font: Noto Sans Arabic
  // Border + shadow for cinematic readability.
  // ----------------------------------------------------------

  return [

    "[Script Info]",

    "ScriptType: v4.00+",

    "PlayResX: 1080",

    "PlayResY: 1920",

    "WrapStyle: 2",

    "ScaledBorderAndShadow: yes",

    "",

    "[V4+ Styles]",

    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",

    "Style: Atlas,Noto Sans Arabic,60,&H00FFFFFF,&H00FFFFFF,&H00101010,&H78000000,1,0,0,0,100,100,0,0,1,3,2,8,70,70,170,1",

    "",

    "[Events]",

    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",

    `Dialogue: 0,0:00:00.00,${endTime},Atlas,,0,0,170,,${dialogueText}`

  ].join("\n");

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
// 📝 UPLOAD ASS FILE
// ============================================================

async function uploadASS(
  env,
  assText
) {

  if (!assText) {

    throw new Error(
      "ASS_TEXT_EMPTY"
    );

  }

  const encoder =
    new TextEncoder();

  const assBuffer =
    encoder.encode(
      assText
    );

  const fileSize =
    assBuffer.byteLength;

  const filename =
    `atlas-hook-${Date.now()}.ass`;

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
              "text/x-ass",

            fileSize

          })

      }
    );

  const data =
    await response.json();

  if (!response.ok) {

    throw new Error(
      `FFMPEG_ASS_URL_FAILED:${JSON.stringify(data)}`
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
      "FFMPEG_ASS_URL_INVALID"
    );

  }

  const uploadResponse =
    await fetch(
      uploadUrl,
      {

        method: "PUT",

        headers: {

          "Content-Type":
            "text/x-ass"

        },

        body:
          assBuffer

      }
    );

  if (!uploadResponse.ok) {

    throw new Error(
      `FFMPEG_ASS_UPLOAD_FAILED:${uploadResponse.status}`
    );

  }

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
      `FFMPEG_ASS_CONFIRM_FAILED:${JSON.stringify(
        confirmData
      )}`
    );

  }

  const fileUrl =
    confirmData?.result?.fileUrl;

  if (!fileUrl) {

    throw new Error(
      "FFMPEG_ASS_FILE_URL_MISSING"
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
  audioUrl,
  assUrl
) {

  const filters = [

    `scale=${VIDEO_WIDTH}:${VIDEO_HEIGHT}:force_original_aspect_ratio=increase`,

    `crop=${VIDEO_WIDTH}:${VIDEO_HEIGHT}`,

    "zoompan="
      + "z='min(zoom+0.0008,1.08)':"
      + `d=${duration * FPS}:`
      + "x='iw/2-(iw/zoom/2)':"
      + "y='ih/2-(ih/zoom/2)':"
      + `s=${VIDEO_WIDTH}x${VIDEO_HEIGHT}:`
      + `fps=${FPS}`

  ];

  // ----------------------------------------------------------
  // ASS OVERLAY
  //
  // Using subtitles= instead of drawtext.
  // This avoids the previous drawtext parser problem.
  // ----------------------------------------------------------

  if (assUrl) {

    filters.push(
      `subtitles='${assUrl}'`
    );

  }

  const videoFilter =
    filters.join(",");

  console.log(
    "ATLAS_VIDEO_FILTER:",
    videoFilter
  );

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
// 🔄 WAIT
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

    if (
      status === "completed"
    ) {

      return data;

    }

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

  const motion =
    options.motion ||
    "zoom_in";

  const hook =
    cleanText(
      options.hook
    );

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
  // 1️⃣ IMAGE UPLOAD
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
  // 2️⃣ BUILD PERSIAN ASS
  // ----------------------------------------------------------

  const assText =
    buildASS(
      hook,
      duration
    );

  console.log(
    "ATLAS_ASS_GENERATED:",
    Boolean(assText)
  );

  // ----------------------------------------------------------
  // 3️⃣ UPLOAD ASS
  // ----------------------------------------------------------

  let assUrl = "";

  if (assText) {

    const uploadedASS =
      await uploadASS(

        env,

        assText

      );

    assUrl =
      uploadedASS.fileUrl;

    console.log(
      "ATLAS_ASS_UPLOADED:",
      assUrl
    );

  }

  // ----------------------------------------------------------
  // 4️⃣ CREATE VIDEO
  // ----------------------------------------------------------

  const jobId =
    await createVideoJob(

      env,

      uploaded.fileUrl,

      duration,

      motion,

      hook,

      audioUrl,

      assUrl

    );

  // ----------------------------------------------------------
  // 5️⃣ WAIT
  // ----------------------------------------------------------

  await waitForVideo(

    env,

    jobId

  );

  // ----------------------------------------------------------
  // 6️⃣ DOWNLOAD
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
        Boolean(audioUrl),

      typography:
        Boolean(assUrl)

    }
  );

  return {

    jobId,

    videoUrl,

    duration,

    motion,

    hook,

    audio:
      Boolean(audioUrl),

    typography:
      Boolean(assUrl)

  };

}
