// ============================================================
// 🎬 ATLAS VIDEO RENDERER 4.0
// Persian ASS Typography + Slow Zoom
// FFmpeg Micro
//
// Pipeline:
// Image → Scale/Crop → Zoom → ASS Persian Subtitle → MP4
//
// IMPORTANT:
// - No drawtext
// - No simultaneous -vf + -filter_complex
// - Persian rendering handled by libass
// ============================================================

const BASE_URL = "https://api.ffmpeg-micro.com";


// ============================================================
// ⏳ SLEEP
// ============================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


// ============================================================
// 🔐 AUTH
// ============================================================

function authHeaders(env) {

  if (!env?.FFMPEG_MICRO_API_KEY) {
    throw new Error("FFMPEG_MICRO_API_KEY_MISSING");
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

  return String(value || "")
    .replace(/\r/g, "")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

}


// ============================================================
// ✂️ WRAP PERSIAN TEXT
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

  for (const word of words) {

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
        lines.push(current);
      }

      current =
        word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.slice(0, 3);
}


// ============================================================
// 🧾 ASS ESCAPE
// ============================================================

function escapeASS(value) {

  return String(value || "")
    .replace(/\r/g, "")
    .replace(/\n/g, "\\N")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}");

}


// ============================================================
// 🎨 BUILD ASS FILE
// ============================================================

function buildASS(hook) {

  const lines =
    wrapPersian(
      hook,
      24
    );

  if (!lines.length) {
    return "";
  }

  const text =
    lines
      .map(
        line =>
          escapeASS(line)
      )
      .join("\\N");

  // ----------------------------------------------------------
  // ASS uses PlayRes 1080x1920
  // Alignment 8 = top-center
  // MarginV = 170
  //
  // Font: Noto Sans Arabic
  // The server's fontconfig/libass stack should resolve
  // an Arabic-compatible font.
  // ----------------------------------------------------------

  return [
    "[Script Info]",
    "ScriptType: v4.00+",
    "PlayResX: 1080",
    "PlayResY: 1920",
    "ScaledBorderAndShadow: yes",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    "Style: Atlas,Noto Sans Arabic,60,&H00FFFFFF,&H00FFFFFF,&H00000000,&H70000000,-1,0,0,0,100,100,0,0,1,3,2,8,70,70,170,1",
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    `Dialogue: 0,0:00:00.00,0:30:00.00,Atlas,,0,0,0,,${text}`,
    ""
  ].join("\n");
}


// ============================================================
// 📤 UPLOAD FILE
// ============================================================

async function uploadFile(
  env,
  buffer,
  filename,
  contentType
) {

  if (!buffer) {
    throw new Error(
      `UPLOAD_BUFFER_MISSING:${filename}`
    );
  }

  const fileSize =
    buffer.byteLength;

  if (!fileSize) {
    throw new Error(
      `UPLOAD_BUFFER_EMPTY:${filename}`
    );
  }

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

            contentType,

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
            contentType
        },

        body:
          buffer
      }
    );

  if (!uploadResponse.ok) {

    throw new Error(
      `FFMPEG_FILE_UPLOAD_FAILED:${uploadResponse.status}`
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
// 🖼️ UPLOAD IMAGE
// ============================================================

async function uploadImage(
  env,
  imageBuffer
) {

  return uploadFile(
    env,
    imageBuffer,
    `atlas-image-${Date.now()}.png`,
    "image/png"
  );

}


// ============================================================
// 📝 UPLOAD ASS
// ============================================================

async function uploadASS(
  env,
  assText
) {

  if (!assText) {
    return null;
  }

  const assBuffer =
    new TextEncoder().encode(
      assText
    ).buffer;

  return uploadFile(
    env,
    assBuffer,
    `atlas-hook-${Date.now()}.ass`,
    "text/x-ass"
  );

}


// ============================================================
// 🎥 CREATE VIDEO JOB
// ============================================================

async function createVideoJob(
  env,
  imageUrl,
  assUrl,
  duration,
  audioUrl
) {

  // ----------------------------------------------------------
  // VIDEO FILTER
  // ----------------------------------------------------------

  let videoFilter = [

    "scale=1080:1920:force_original_aspect_ratio=increase",

    "crop=1080:1920",

    "zoompan=" +
      "z='min(zoom+0.0008,1.08)':" +
      "d=900:" +
      "x='iw/2-(iw/zoom/2)':" +
      "y='ih/2-(ih/zoom/2)':" +
      "s=1080x1920:" +
      "fps=30"

  ];

  // ----------------------------------------------------------
  // ASS
  // ----------------------------------------------------------

  if (assUrl) {

    videoFilter.push(
      `subtitles='${assUrl}'`
    );

  }

  const filter =
    videoFilter.join(",");

  console.log(
    "ATLAS_ASS_RENDER_FILTER:",
    filter
  );

  // ----------------------------------------------------------
  // INPUT
  // ----------------------------------------------------------

  const inputs = [

    {
      url:
        imageUrl,

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
  // OUTPUT
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
        filter
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
        "30"
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

  } else {

    options.push({

      option:
        "-an",

      argument:
        ""
    });

  }

  // ----------------------------------------------------------
  // REQUEST
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

  return jobId;
}


// ============================================================
// 🔄 WAIT
// ============================================================

async function waitForVideo(
  env,
  jobId
) {

  const maxAttempts =
    90;

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
      `ATLAS_VIDEO_STATUS [${attempt + 1}/${maxAttempts}]:`,
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

      const message =
        data?.error_message ||
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
// 📥 DOWNLOAD
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

  const hook =
    cleanText(
      options.hook || ""
    );

  const audioUrl =
    options.audioUrl ||
    env?.ATLAS_AUDIO_URL ||
    "";

  console.log(
    "ATLAS_RENDER_START:",
    {
      duration,
      hook,
      hasAudio:
        Boolean(audioUrl),
      imageBytes:
        imageBuffer?.byteLength
    }
  );

  // ----------------------------------------------------------
  // 1. IMAGE
  // ----------------------------------------------------------

  const uploadedImage =
    await uploadImage(
      env,
      imageBuffer
    );

  console.log(
    "ATLAS_IMAGE_UPLOADED:",
    uploadedImage.fileUrl
  );

  // ----------------------------------------------------------
  // 2. ASS
  // ----------------------------------------------------------

  let uploadedASS = null;

  if (hook) {

    const assText =
      buildASS(
        hook
      );

    uploadedASS =
      await uploadASS(
        env,
        assText
      );

    console.log(
      "ATLAS_ASS_UPLOADED:",
      uploadedASS?.fileUrl
    );

  }

  // ----------------------------------------------------------
  // 3. VIDEO
  // ----------------------------------------------------------

  const jobId =
    await createVideoJob(

      env,

      uploadedImage.fileUrl,

      uploadedASS?.fileUrl || "",

      duration,

      audioUrl

    );

  console.log(
    "ATLAS_VIDEO_JOB_CREATED:",
    jobId
  );

  // ----------------------------------------------------------
  // 4. WAIT
  // ----------------------------------------------------------

  await waitForVideo(
    env,
    jobId
  );

  // ----------------------------------------------------------
  // 5. DOWNLOAD
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
      hook
    }
  );

  return {

    jobId,

    videoUrl,

    duration,

    motion:
      "zoom_in",

    hook,

    audio:
      Boolean(audioUrl)

  };
}
