// ============================================================
// 🎬 ATLAS VIDEO RENDERER
// FFmpeg Micro
// ============================================================

const BASE_URL = "https://api.ffmpeg-micro.com";

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));


// ============================================================
// 🎥 CREATE VIDEO FROM PUBLIC IMAGE URL
// ============================================================

export async function renderImageToVideo(
  env,
  imageUrl,
  options = {}
) {

  if (!env.FFMPEG_MICRO_API_KEY) {
    throw new Error("FFMPEG_MICRO_API_KEY_MISSING");
  }

  if (!imageUrl) {
    throw new Error("IMAGE_URL_MISSING");
  }

  const duration =
    Math.max(
      1,
      Math.min(
        30,
        Number(options.duration || 10)
      )
    );

  const headers = {
    "Authorization":
      `Bearer ${env.FFMPEG_MICRO_API_KEY}`,
    "Content-Type":
      "application/json"
  };


  // ----------------------------------------------------------
  // Create transcode job
  // ----------------------------------------------------------

  const response =
    await fetch(
      `${BASE_URL}/v1/transcodes`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({

          inputs: [
            {
              url: imageUrl,

              options: [
                {
                  option: "-loop",
                  argument: "1"
                },
                {
                  option: "-framerate",
                  argument: "30"
                },
                {
                  option: "-t",
                  argument: String(duration)
                }
              ]
            }
          ],

          outputFormat: "mp4",

          options: [
            {
              option: "-c:v",
              argument: "libx264"
            },
            {
              option: "-pix_fmt",
              argument: "yuv420p"
            },
            {
              option: "-crf",
              argument: "23"
            },
            {
              option: "-r",
              argument: "30"
            },
            {
              option: "-movflags",
              argument: "+faststart"
            }
          ]

        })
      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    console.error(
      "FFMPEG_CREATE_ERROR:",
      data
    );

    throw new Error(
      `FFMPEG_CREATE_FAILED:${JSON.stringify(data)}`
    );
  }


  const jobId =
    data?.id ||
    data?.jobId ||
    data?.result?.id;


  if (!jobId) {

    console.error(
      "FFMPEG_CREATE_INVALID:",
      data
    );

    throw new Error(
      "FFMPEG_JOB_ID_MISSING"
    );
  }


  console.log(
    "ATLAS_FFMPEG_JOB:",
    jobId
  );


  // ----------------------------------------------------------
  // Poll job
  // ----------------------------------------------------------

  const maxAttempts = 30;

  for (
    let attempt = 0;
    attempt < maxAttempts;
    attempt++
  ) {

    await sleep(2000);


    const statusResponse =
      await fetch(
        `${BASE_URL}/v1/transcodes/${jobId}`,
        {
          method: "GET",
          headers: {
            "Authorization":
              `Bearer ${env.FFMPEG_MICRO_API_KEY}`
          }
        }
      );


    const statusData =
      await statusResponse.json();


    if (!statusResponse.ok) {

      console.error(
        "FFMPEG_STATUS_ERROR:",
        statusData
      );

      throw new Error(
        `FFMPEG_STATUS_FAILED:${JSON.stringify(statusData)}`
      );
    }


    const status =
      String(
        statusData?.status || ""
      ).toLowerCase();


    console.log(
      "ATLAS_FFMPEG_STATUS:",
      status
    );


    if (
      status === "completed" ||
      status === "complete" ||
      status === "success"
    ) {

      break;
    }


    if (
      status === "failed" ||
      status === "error" ||
      status === "cancelled"
    ) {

      throw new Error(
        `FFMPEG_RENDER_FAILED:${JSON.stringify(statusData)}`
      );
    }


    if (
      attempt === maxAttempts - 1
    ) {

      throw new Error(
        "FFMPEG_RENDER_TIMEOUT"
      );
    }

  }


  // ----------------------------------------------------------
  // Get signed download URL
  // ----------------------------------------------------------

  const downloadResponse =
    await fetch(
      `${BASE_URL}/v1/transcodes/${jobId}/download`,
      {
        method: "GET",

        headers: {
          "Authorization":
            `Bearer ${env.FFMPEG_MICRO_API_KEY}`
        }
      }
    );


  const downloadData =
    await downloadResponse.json();


  if (!downloadResponse.ok) {

    console.error(
      "FFMPEG_DOWNLOAD_ERROR:",
      downloadData
    );

    throw new Error(
      `FFMPEG_DOWNLOAD_FAILED:${JSON.stringify(downloadData)}`
    );
  }


  const videoUrl =
    downloadData?.url ||
    downloadData?.result?.url ||
    downloadData?.downloadUrl;


  if (!videoUrl) {

    console.error(
      "FFMPEG_DOWNLOAD_INVALID:",
      downloadData
    );

    throw new Error(
      "FFMPEG_VIDEO_URL_MISSING"
    );
  }


  return {
    jobId,
    videoUrl,
    duration
  };

}
