// ============================================================
// 🎧 ATLAS AUDIO ENGINE
// Simple Audio Library + Loop Preparation
// ============================================================

const AUDIO_LIBRARY = {

  rain: {
    file: "rain.mp3",
    name: "Soft Rain"
  }

};


// ============================================================
// 🔎 GET AUDIO
// ============================================================

export function getAudio(
  type = "rain"
) {

  const selected =
    AUDIO_LIBRARY[type] ||
    AUDIO_LIBRARY.rain;

  return selected;

}


// ============================================================
// 🎵 GET AUDIO URL
// ============================================================
//
// Audio files are served from the public Audio CDN / URL.
//
// We keep this separate from the Renderer so later we can
// change the storage source without changing the video engine.
// ============================================================

export function getAudioUrl(
  env,
  type = "rain"
) {

  const audio =
    getAudio(type);


  if (!env?.ATLAS_AUDIO_BASE_URL) {

    throw new Error(
      "ATLAS_AUDIO_BASE_URL_MISSING"
    );

  }


  return (
    `${env.ATLAS_AUDIO_BASE_URL.replace(/\/$/, "")}/` +
    `${audio.file}`
  );

}


// ============================================================
// 📋 LIST AUDIO
// ============================================================

export function listAudio() {

  return Object.entries(
    AUDIO_LIBRARY
  ).map(
    ([id, audio]) => ({

      id,

      name:
        audio.name,

      file:
        audio.file

    })
  );

}
