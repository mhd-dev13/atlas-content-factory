// ============================================================
// 🎬 ATLAS VIDEO RENDERER
// Persian Hook + Slow Zoom + Optional Audio
// Stable FFmpeg Renderer
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
// 🧹 ESCAPE FFMPEG DRAWTEXT
// ============================================================

function escapeDrawtext(value) {

  return String(value || "")

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
    );

}


// ============================================================
// ✂️ WRAP TEXT
// ============================================================

function wrapText(
  text,
  maxChars = 25
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

  let current =
    "";


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
// 📝 BUILD TEXT FILTER
// ============================================================

function buildTextFilter(
  hook
) {

  const lines =
    wrapText(
      hook,
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
   * Do NOT use:
   *
   * fontweight=bold
   * text_shaping=1
   *
   * because some ffmpeg-micro environments
   * reject those options.
   */


  return [

    "drawtext",

    "font='DejaVu Sans'",

    `text='${safeText}'`,

    "fontcolor=white",

    "fontsize=58",

    "line_spacing=16",

    "x=(w-text_w)/2",

    "y=(h-text_h)/2",

    "box=1",

    "boxcolor=black@0.42",

    "boxborderw=24",

    "shadowcolor=black@0.75",

    "shadowx=3",

    "shadowy=3"

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

    console.error(
      "ATLAS_UPLOAD_URL_ERROR:",
      data
    );

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
  // Upload binary
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

    const errorText =
      await uploadResponse.text();


    console.error(
      "ATLAS_IMAGE_UPLOAD_ERROR:",
      errorText
    );


    throw new Error(
      `FFMPEG_IMAGE_UPLOAD_FAILED:${uploadResponse.status}`
    );

  }


  // ----------------------------------------------------------
  // Confirm
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

    console.error(
      "ATLAS_UPLOAD_CONFIRM_ERROR:",
      confirmData
    );


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
  // VIDEO FILTERS
  // ----------------------------------------------------------

  const filters = [

    "scale=1200:2133:force_original_aspect_ratio=increase",

    "crop=1200:2133",

    "zoompan="
      + "z='min(zoom+0.0015,1.12)':"
      + "d=300:"
      + "x='iw/2-(iw/zoom/2)':"
      + "y='ih/2-(ih/zoom/2)':"
      + "s=1080x1920:"
      + "fps=30"

  ];


  // ----------------------------------------------------------
  // TEXT OVERLAY
  // ----------------------------------------------------------

  const textFilter =
    buildTextFilter(
      hook
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
            "30"

        }

      ]

    }

  ];


  // ----------------------------------------------------------
  // OPTIONAL AUDIO
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


  // ----------------------------------------------------------
  // AUDIO
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

    console.error(
      "ATLAS_TRANSCODE_INVALID:",
      data
    );


    throw new Error(
      "FFMPEG_JOB_ID_MISSING"
    );

  }


  return jobId;

}


// ============================================================
// 🔄 WAIT FOR VIDEO
// ============================================================

async function waitForVideo(
  env,
  jobId
) {

  const maxAttempts =
    45;


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
        `FFMPEG_STATUS_FAILED:${JSON.stringify(data)}`
      );

    }


    const status =
      String(
        data?.status || ""
      ).toLowerCase();


    console.log(
      `ATLAS_VIDEO_STATUS [${attempt + 1}]:`,
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

      throw new Error(
        `FFMPEG_RENDER_FAILED:${JSON.stringify(data)}`
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
        30,
        Number(
          options.duration || 10
        )
      )
    );


  const motion =
    options.motion ||
    "zoom_in";


  const hook =
    String(
      options.hook || ""
    ).trim();


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

      bytes:
        imageBuffer?.byteLength

    }
  );


  // ----------------------------------------------------------
  // Upload
  // ----------------------------------------------------------

  const uploaded =
    await uploadImage(
      env,
      imageBuffer
    );


  // ----------------------------------------------------------
  // Create job
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
  // Wait
  // ----------------------------------------------------------

  await waitForVideo(
    env,
    jobId
  );


  // ----------------------------------------------------------
  // Download
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

      motion,

      hook,

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

    hook,

    audio:
      Boolean(audioUrl)

  };

}
