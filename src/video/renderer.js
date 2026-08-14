// ============================================================
// 🎬 ATLAS VIDEO RENDERER
// FFmpeg Micro
//
// Flow:
// ArrayBuffer Image
//      ↓
// Presigned Upload
//      ↓
// Confirm
//      ↓
// Transcode
//      ↓
// Poll
//      ↓
// Download URL
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
// 🔐 HEADERS
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


  const bytes =
    imageBuffer.byteLength;


  if (!bytes) {

    throw new Error(
      "IMAGE_BUFFER_EMPTY"
    );

  }


  const filename =
    `atlas-image-${Date.now()}.png`;


  // ----------------------------------------------------------
  // Step 1
  // Request presigned URL
  // ----------------------------------------------------------

  const presignedResponse =
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

            fileSize:
              bytes

          })

      }
    );


  const presignedData =
    await presignedResponse.json();


  if (!presignedResponse.ok) {

    console.error(
      "ATLAS_UPLOAD_URL_ERROR:",
      presignedData
    );

    throw new Error(
      `FFMPEG_UPLOAD_URL_FAILED:${JSON.stringify(
        presignedData
      )}`
    );

  }


  const uploadUrl =
    presignedData?.result?.uploadUrl;

  const serverFilename =
    presignedData?.result?.filename;


  if (
    !uploadUrl ||
    !serverFilename
  ) {

    console.error(
      "ATLAS_UPLOAD_URL_INVALID:",
      presignedData
    );

    throw new Error(
      "FFMPEG_UPLOAD_URL_INVALID"
    );

  }


  // ----------------------------------------------------------
  // Step 2
  // Upload binary directly
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

    const uploadError =
      await uploadResponse.text();

    console.error(
      "ATLAS_IMAGE_UPLOAD_ERROR:",
      uploadError
    );

    throw new Error(
      `FFMPEG_IMAGE_UPLOAD_FAILED:${uploadResponse.status}`
    );

  }


  // ----------------------------------------------------------
  // Step 3
  // Confirm upload
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

            fileSize:
              bytes

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

    console.error(
      "ATLAS_UPLOAD_CONFIRM_INVALID:",
      confirmData
    );

    throw new Error(
      "FFMPEG_FILE_URL_MISSING"
    );

  }


  console.log(
    "ATLAS_IMAGE_UPLOADED:",
    serverFilename
  );


  return {
    filename:
      serverFilename,

    fileUrl,

    fileSize:
      bytes

  };

}


// ============================================================
// 🎬 CREATE VIDEO
// ============================================================

async function createVideoJob(
  env,
  fileUrl,
  duration
) {

  const response =
    await fetch(
      `${BASE_URL}/v1/transcodes`,
      {
        method: "POST",

        headers:
          authHeaders(env),

        body:
          JSON.stringify({

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
                      "30"

                  }

                ]

              }

            ],

            outputFormat:
              "mp4",

            options: [

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
                  "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920"

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

            ]

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
      "ATLAS_TRANSCODE_INVALID:",
      data
    );

    throw new Error(
      "FFMPEG_JOB_ID_MISSING"
    );

  }


  console.log(
    "ATLAS_VIDEO_JOB:",
    jobId
  );


  return jobId;

}


// ============================================================
// 🔄 POLL JOB
// ============================================================

async function waitForVideo(
  env,
  jobId
) {

  const maxAttempts =
    40;


  for (
    let attempt = 0;
    attempt < maxAttempts;
    attempt++
  ) {

    await sleep(2000);


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

      console.error(
        "ATLAS_TRANSCODE_STATUS_ERROR:",
        data
      );

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
      `ATLAS_VIDEO_STATUS [${attempt + 1}]:`,
      status
    );


    if (
      status ===
      "completed"
    ) {

      return data;

    }


    if (
      status ===
        "failed" ||
      status ===
        "error" ||
      status ===
        "cancelled"
    ) {

      throw new Error(
        `FFMPEG_RENDER_FAILED:${JSON.stringify(
          data
        )}`
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

    console.error(
      "ATLAS_DOWNLOAD_ERROR:",
      data
    );

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

    console.error(
      "ATLAS_DOWNLOAD_INVALID:",
      data
    );

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
      1,
      Math.min(
        30,
        Number(
          options.duration ||
          10
        )
      )
    );


  console.log(
    "ATLAS_RENDER_START:",
    {
      duration,
      bytes:
        imageBuffer?.byteLength
    }
  );


  // ----------------------------------------------------------
  // Upload image
  // ----------------------------------------------------------

  const uploaded =
    await uploadImage(
      env,
      imageBuffer
    );


  // ----------------------------------------------------------
  // Create transcode
  // ----------------------------------------------------------

  const jobId =
    await createVideoJob(
      env,
      uploaded.fileUrl,
      duration
    );


  // ----------------------------------------------------------
  // Wait
  // ----------------------------------------------------------

  await waitForVideo(
    env,
    jobId
  );


  // ----------------------------------------------------------
  // Download URL
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
      videoUrl
    }
  );


  return {

    jobId,

    videoUrl,

    duration

  };

}
