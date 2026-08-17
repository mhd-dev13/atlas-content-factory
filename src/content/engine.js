// ============================================================
// 🏭 ATLAS CONTENT ENGINE 4.0
// Stable JSON + Persian Hook + Reel Normalization
//
// Goals:
// - Prevent REEL_JSON_INCOMPLETE
// - Recover JSON from AI output
// - Retry malformed AI JSON
// - Always provide required Reel fields
// - Persian on-screen hook is guaranteed
// - Compatible with existing Reel Pipeline
// ============================================================

import {
  generateAI
} from "../ai/engine.js";


// ============================================================
// ⚙️ CONTENT RULES
// ============================================================

const CONTENT_RULES = `
GENERAL:

Create concise, engaging Instagram content.

Main topics:

calmness
relaxation
ASMR
peaceful moments
mindfulness
nature
rain
ocean
night ambience
cozy moments
slow living

Never make medical claims.
Never claim treatment.
Never guarantee results.

Do not use <think>.
Do not use reasoning.
Do not use markdown.
Do not create multiple versions.

ENGLISH:

Use natural modern English.

Write like a real Instagram creator.

Keep hooks emotionally interesting.

Avoid robotic wording.

Avoid generic motivational clichés.

PERSIAN:

Write natural modern Persian.

Do NOT translate English literally.

The Persian must be independently written
for a Persian-speaking Instagram audience.

Use natural conversational Instagram Persian.

Avoid:

"آرامش خود را پیدا کنید"
"به آرامش بپردازید"
"ذهن خود را آزاد کنید"
"خود را رها کنید"
"با این آرامش همراه شوید"

Prefer:

"چند لحظه از شلوغی فاصله بگیر."
"فقط مکث کن."
"چشم‌هات رو ببند و گوش بده."
"بذار صدای بارون فضا رو آروم‌تر کنه."
"گاهی فقط چند دقیقه سکوت لازمه."

Do not overuse emojis.

Keep content visually and emotionally simple.
`;


// ============================================================
// 🧹 CLEAN RAW AI OUTPUT
// ============================================================

function cleanRaw(text) {

  return String(
    text || ""
  )

    .replace(
      /<think>[\s\S]*?<\/think>/gi,
      ""
    )

    .replace(
      /<think>[\s\S]*/gi,
      ""
    )

    .replace(
      /<\/think>/gi,
      ""
    )

    .replace(
      /```json/gi,
      ""
    )

    .replace(
      /```JSON/gi,
      ""
    )

    .replace(
      /```/g,
      ""
    )

    .trim();

}


// ============================================================
// 🔎 EXTRACT BALANCED JSON
// ============================================================

function extractJSONObject(
  text
) {

  const cleaned =
    cleanRaw(text);

  const start =
    cleaned.indexOf("{");

  if (start === -1) {

    throw new Error(
      "JSON_OBJECT_NOT_FOUND"
    );

  }

  let depth = 0;

  let inString = false;

  let escaped = false;

  for (
    let i = start;
    i < cleaned.length;
    i++
  ) {

    const char =
      cleaned[i];

    if (
      char === "\\" &&
      !escaped
    ) {

      escaped = true;

      continue;

    }

    if (
      char === '"' &&
      !escaped
    ) {

      inString =
        !inString;

    }

    escaped = false;

    if (inString) {
      continue;
    }

    if (char === "{") {

      depth++;

    }

    if (char === "}") {

      depth--;

      if (depth === 0) {

        return cleaned.slice(
          start,
          i + 1
        );

      }

    }

  }

  throw new Error(
    "JSON_OBJECT_INCOMPLETE"
  );

}


// ============================================================
// 🧠 PARSE JSON
// ============================================================

function parseAIJSON(
  text,
  type = "CONTENT"
) {

  const cleaned =
    cleanRaw(text);

  // ----------------------------------------------------------
  // DIRECT PARSE
  // ----------------------------------------------------------

  try {

    return JSON.parse(
      cleaned
    );

  } catch {
    // Continue.
  }

  // ----------------------------------------------------------
  // EXTRACT OBJECT
  // ----------------------------------------------------------

  try {

    const jsonText =
      extractJSONObject(
        cleaned
      );

    return JSON.parse(
      jsonText
    );

  } catch (error) {

    const reason =
      error?.message ||
      String(error);

    throw new Error(
      `${type}_JSON_INCOMPLETE:${reason}`
    );

  }

}


// ============================================================
// 🛠️ NORMALIZE REEL
// ============================================================

function normalizeReel(
  reel
) {

  if (
    !reel ||
    typeof reel !== "object"
  ) {

    throw new Error(
      "REEL_INVALID"
    );

  }

  // ----------------------------------------------------------
  // BASIC
  // ----------------------------------------------------------

  reel.title =
    String(
      reel.title ||
      "A Quiet Moment"
    ).trim();

  reel.hook =
    String(
      reel.hook ||
      reel?.on_screen_text?.en ||
      "LET THE WORLD SLOW DOWN."
    )
      .replace(/\s+/g, " ")
      .trim();

  // ----------------------------------------------------------
  // DURATION
  // ----------------------------------------------------------

  reel.duration =
    normalizeDuration(
      reel.duration
    );

  // ----------------------------------------------------------
  // SCENES
  // ----------------------------------------------------------

  if (
    !Array.isArray(
      reel.scenes
    )
  ) {

    reel.scenes = [];

  }

  // We only need the first visual for
  // the current single-image renderer.

  if (
    reel.scenes.length === 0
  ) {

    reel.scenes.push({

      duration:
        "10s",

      visual:
        "A cinematic peaceful rain scene in a quiet forest, soft rainfall falling over wet leaves, atmospheric mist and gentle natural light.",

      camera:
        "cinematic medium-wide shot",

      motion:
        "slow subtle push-in"

    });

  }

  // Guarantee exactly three scenes
  // for compatibility with the existing
  // content contract.

  while (
    reel.scenes.length < 3
  ) {

    reel.scenes.push({

      duration:
        "10s",

      visual:
        reel.scenes[0]?.visual ||
        "A peaceful cinematic nature scene.",

      camera:
        reel.scenes[0]?.camera ||
        "cinematic medium-wide shot",

      motion:
        reel.scenes[0]?.motion ||
        "slow subtle movement"

    });

  }

  reel.scenes =
    reel.scenes
      .slice(0, 3)
      .map(
        scene => ({

          duration:
            String(
              scene?.duration ||
              "10s"
            ),

          visual:
            String(
              scene?.visual ||
              "A peaceful cinematic nature scene."
            ).trim(),

          camera:
            String(
              scene?.camera ||
              "cinematic medium-wide shot"
            ).trim(),

          motion:
            String(
              scene?.motion ||
              "slow subtle movement"
            ).trim()

        })
      );

  // ----------------------------------------------------------
  // AUDIO
  // ----------------------------------------------------------

  if (
    !reel.audio ||
    typeof reel.audio !== "object"
  ) {

    reel.audio = {};

  }

  reel.audio.ambient =
    String(
      reel.audio.ambient ||
      "soft natural rain ambience"
    ).trim();

  reel.audio.effects =
    String(
      reel.audio.effects ||
      "subtle natural environmental sounds"
    ).trim();

  // ----------------------------------------------------------
  // VOICEOVER
  // ----------------------------------------------------------

  if (
    !reel.voiceover ||
    typeof reel.voiceover !== "object"
  ) {

    reel.voiceover = {};

  }

  reel.voiceover.en =
    String(
      reel.voiceover.en ||
      ""
    ).trim();

  reel.voiceover.fa =
    String(
      reel.voiceover.fa ||
      ""
    ).trim();

  // ----------------------------------------------------------
  // ON SCREEN TEXT
  // ----------------------------------------------------------

  if (
    !reel.on_screen_text ||
    typeof reel.on_screen_text !== "object"
  ) {

    reel.on_screen_text = {};

  }

  // English fallback

  reel.on_screen_text.en =
    String(
      reel.on_screen_text.en ||
      reel.hook ||
      "LET THE WORLD SLOW DOWN."
    )
      .replace(/\s+/g, " ")
      .trim();

  // ----------------------------------------------------------
  // PERSIAN HOOK
  // ----------------------------------------------------------

  reel.on_screen_text.fa =
    String(
      reel.on_screen_text.fa ||
      ""
    )
      .replace(/\s+/g, " ")
      .trim();

  /*
   * IMPORTANT:
   *
   * The current Renderer is expected to receive
   * a Persian hook.
   *
   * If AI fails to provide one, generate a safe
   * contextual fallback instead of leaving it empty.
   */

  if (
    !reel.on_screen_text.fa
  ) {

    reel.on_screen_text.fa =
      createPersianFallback(
        reel
      );

  }

  // ----------------------------------------------------------
  // CTA
  // ----------------------------------------------------------

  reel.cta =
    String(
      reel.cta ||
      "Stay for a few quiet seconds."
    ).trim();

  // ----------------------------------------------------------
  // CAPTION EN
  // ----------------------------------------------------------

  reel.caption_en =
    String(
      reel.caption_en ||
      reel.hook ||
      "A quiet moment to slow down."
    ).trim();

  // ----------------------------------------------------------
  // CAPTION FA
  // ----------------------------------------------------------

  reel.caption_fa =
    String(
      reel.caption_fa ||
      "چند لحظه از شلوغی فاصله بگیر و فقط گوش بده."
    ).trim();

  // ----------------------------------------------------------
  // HASHTAGS
  // ----------------------------------------------------------

  if (
    !Array.isArray(
      reel.hashtags
    )
  ) {

    reel.hashtags = [];

  }

  reel.hashtags =
    reel.hashtags
      .map(
        tag =>
          String(
            tag || ""
          ).trim()
      )
      .filter(Boolean)
      .slice(0, 8);

  return reel;

}


// ============================================================
// 🇮🇷 PERSIAN FALLBACK
// ============================================================

function createPersianFallback(
  reel
) {

  const text =
    `${reel?.hook || ""} ${reel?.title || ""} ${reel?.caption_fa || ""}`
      .toLowerCase();

  if (
    text.includes("rain") ||
    text.includes("باران") ||
    text.includes("rainy")
  ) {

    return "چند لحظه به صدای باران گوش بده.";

  }

  if (
    text.includes("ocean") ||
    text.includes("sea") ||
    text.includes("دریا")
  ) {

    return "فقط چند لحظه به صدای دریا گوش بده.";

  }

  if (
    text.includes("night") ||
    text.includes("شب")
  ) {

    return "امشب فقط چند لحظه مکث کن.";

  }

  if (
    text.includes("forest") ||
    text.includes("جنگل")
  ) {

    return "بذار سکوت جنگل چند لحظه کنارت بمونه.";

  }

  return "چند لحظه از شلوغی فاصله بگیر.";

}


// ============================================================
// ⏱️ NORMALIZE DURATION
// ============================================================

function normalizeDuration(
  value
) {

  const match =
    String(
      value || ""
    ).match(
      /(\d+)/
    );

  if (!match) {
    return "10s";
  }

  const seconds =
    Math.max(
      5,
      Math.min(
        30,
        Number(
          match[1]
        )
      )
    );

  return `${seconds}s`;

}


// ============================================================
// 🛡️ VALIDATE REEL
// ============================================================

function validateReel(
  reel
) {

  if (
    !reel ||
    typeof reel !== "object"
  ) {

    throw new Error(
      "REEL_INVALID"
    );

  }

  const required = [

    "title",
    "hook",
    "duration",
    "scenes",
    "audio",
    "voiceover",
    "on_screen_text",
    "cta",
    "caption_en",
    "caption_fa"

  ];

  for (
    const field of required
  ) {

    if (
      reel[field] === undefined ||
      reel[field] === null
    ) {

      throw new Error(
        `REEL_FIELD_MISSING:${field}`
      );

    }

  }

  if (
    !String(
      reel.hook
    ).trim()
  ) {

    throw new Error(
      "REEL_HOOK_MISSING"
    );

  }

  if (
    !Array.isArray(
      reel.scenes
    ) ||
    reel.scenes.length !== 3
  ) {

    throw new Error(
      "REEL_SCENES_INVALID"
    );

  }

  for (
    const scene of reel.scenes
  ) {

    if (
      !scene ||
      !scene.visual ||
      !scene.camera ||
      !scene.motion ||
      !scene.duration
    ) {

      throw new Error(
        "REEL_SCENE_INCOMPLETE"
      );

    }

  }

  if (
    !reel.audio ||
    typeof reel.audio !== "object"
  ) {

    throw new Error(
      "REEL_AUDIO_INVALID"
    );

  }

  if (
    !reel.voiceover ||
    typeof reel.voiceover !== "object"
  ) {

    throw new Error(
      "REEL_VOICEOVER_INVALID"
    );

  }

  if (
    !reel.on_screen_text ||
    typeof reel.on_screen_text !== "object"
  ) {

    throw new Error(
      "REEL_ONSCREEN_INVALID"
    );

  }

  if (
    !reel.on_screen_text.en
  ) {

    throw new Error(
      "REEL_ONSCREEN_EN_MISSING"
    );

  }

  if (
    !reel.on_screen_text.fa
  ) {

    throw new Error(
      "REEL_ONSCREEN_FA_MISSING"
    );

  }

  if (
    !reel.caption_en
  ) {

    throw new Error(
      "REEL_CAPTION_EN_MISSING"
    );

  }

  if (
    !reel.caption_fa
  ) {

    throw new Error(
      "REEL_CAPTION_FA_MISSING"
    );

  }

  return true;

}


// ============================================================
// 💡 GENERATE IDEA
// ============================================================

export async function generateIdea(
  env
) {

  const messages = [

    {
      role: "system",

      content: `
You are Atlas Content Factory.

${CONTENT_RULES}

Create ONE original Instagram Reel idea.

Return ONLY valid JSON.

Structure:

{
  "hook_en": "",
  "hook_fa": "",
  "concept": "",
  "visual": "",
  "cta": ""
}

Rules:

hook_en:
Maximum 10 words.

hook_fa:
Maximum 10 natural Persian words.

concept:
One concise sentence.

visual:
One visually powerful scene.

cta:
Short natural CTA.

Return JSON only.
      `.trim()

    },

    {
      role: "user",

      content: `
Create one original Reel idea for:

calmness,
relaxation,
ASMR,
rain,
nature,
peaceful moments,
slow living.

Return JSON only.
      `.trim()

    }

  ];

  const raw =
    await generateAI(
      env,
      messages
    );

  try {

    return parseAIJSON(
      raw,
      "IDEA"
    );

  } catch (firstError) {

    console.error(
      "ATLAS_IDEA_JSON_RETRY:",
      firstError?.message ||
      firstError
    );

    const retryMessages = [

      {
        role: "system",

        content: `
Return ONLY valid JSON.

No markdown.
No explanation.
No reasoning.

{
  "hook_en": "",
  "hook_fa": "",
  "concept": "",
  "visual": "",
  "cta": ""
}
        `.trim()

      },

      {
        role: "user",

        content:
          "Create one calm cinematic Instagram Reel idea."
      }

    ];

    const retryRaw =
      await generateAI(
        env,
        retryMessages
      );

    return parseAIJSON(
      retryRaw,
      "IDEA_RETRY"
    );

  }

}


// ============================================================
// 🎬 GENERATE REEL
// ============================================================

export async function generateReel(
  env,
  sourceIdea = ""
) {

  const idea =
    sourceIdea?.trim() ||
    "Create a calm cinematic ASMR Reel.";

  const messages = [

    {
      role: "system",

      content: `
You are Atlas Reel Director.

${CONTENT_RULES}

Create ONE production-ready
Instagram Reel.

IMPORTANT:

Return ONLY ONE valid JSON object.

No markdown.
No explanation.
No reasoning.
No <think>.
No multiple versions.

The JSON MUST contain these fields:

{
  "title": "",
  "hook": "",
  "duration": "10s",

  "scenes": [
    {
      "duration": "10s",
      "visual": "",
      "camera": "",
      "motion": ""
    },
    {
      "duration": "10s",
      "visual": "",
      "camera": "",
      "motion": ""
    },
    {
      "duration": "10s",
      "visual": "",
      "camera": "",
      "motion": ""
    }
  ],

  "audio": {
    "ambient": "",
    "effects": ""
  },

  "voiceover": {
    "en": "",
    "fa": ""
  },

  "on_screen_text": {
    "en": "",
    "fa": ""
  },

  "cta": "",

  "caption_en": "",
  "caption_fa": "",

  "hashtags": []
}

STRICT RULES:

hook:
Maximum 8 English words.

on_screen_text.en:
Same English hook.

on_screen_text.fa:
REQUIRED.
Write a short natural Persian hook.
Maximum 10 Persian words.
Do NOT translate word-for-word.

caption_en:
REQUIRED.
Maximum 30 words.

caption_fa:
REQUIRED.
Maximum 30 natural Persian words.

voiceover:
REQUIRED.
It may be empty.

audio:
REQUIRED.

hashtags:
5 to 8 hashtags.

scenes:
Exactly 3.

Each scene must contain:
duration
visual
camera
motion

Do not put text inside visual descriptions.

Do not use markdown.

Return JSON only.
      `.trim()

    },

    {
      role: "user",

      content: `
Create ONE production-ready Reel based specifically
on this idea:

${idea}

The Reel should feel calm,
cinematic,
natural,
premium,
and suitable for Instagram.

IMPORTANT:

The Persian on-screen hook is required.

Return JSON only.
      `.trim()

    }

  ];

  // ----------------------------------------------------------
  // FIRST ATTEMPT
  // ----------------------------------------------------------

  let raw;

  try {

    raw =
      await generateAI(
        env,
        messages
      );

    console.log(
      "ATLAS_REEL_RAW_LENGTH:",
      String(
        raw || ""
      ).length
    );

  } catch (error) {

    console.error(
      "ATLAS_REEL_AI_ERROR:",
      error?.stack ||
      error
    );

    throw error;

  }

  // ----------------------------------------------------------
  // PARSE
  // ----------------------------------------------------------

  try {

    const reel =
      parseAIJSON(
        raw,
        "REEL"
      );

    const normalized =
      normalizeReel(
        reel
      );

    validateReel(
      normalized
    );

    return normalized;

  } catch (firstError) {

    console.error(
      "ATLAS_REEL_JSON_RETRY:",
      firstError?.message ||
      firstError
    );

  }

  // ----------------------------------------------------------
  // JSON REPAIR REQUEST
  // ----------------------------------------------------------

  const repairMessages = [

    {
      role: "system",

      content: `
You are a JSON repair engine.

Return ONLY valid JSON.

No markdown.
No explanation.
No reasoning.

The required structure is:

{
  "title": "",
  "hook": "",
  "duration": "10s",
  "scenes": [
    {
      "duration": "10s",
      "visual": "",
      "camera": "",
      "motion": ""
    },
    {
      "duration": "10s",
      "visual": "",
      "camera": "",
      "motion": ""
    },
    {
      "duration": "10s",
      "visual": "",
      "camera": "",
      "motion": ""
    }
  ],
  "audio": {
    "ambient": "",
    "effects": ""
  },
  "voiceover": {
    "en": "",
    "fa": ""
  },
  "on_screen_text": {
    "en": "",
    "fa": ""
  },
  "cta": "",
  "caption_en": "",
  "caption_fa": "",
  "hashtags": []
}

Make every field valid.

Do not add commentary.
      `.trim()

    },

    {
      role: "user",

      content: `
Repair or recreate this Reel JSON.

SOURCE IDEA:

${idea}

If the previous response was incomplete,
create the missing values yourself.

The Persian on-screen text MUST exist.

Return ONLY valid JSON.
      `.trim()

    }

  ];

  const repairedRaw =
    await generateAI(
      env,
      repairMessages
    );

  let repaired;

  try {

    repaired =
      parseAIJSON(
        repairedRaw,
        "REEL_REPAIR"
      );

  } catch (error) {

    console.error(
      "ATLAS_REEL_REPAIR_FAILED:",
      error?.message ||
      error
    );

    throw new Error(
      "REEL_JSON_INVALID_AFTER_REPAIR"
    );

  }

  const normalized =
    normalizeReel(
      repaired
    );

  validateReel(
    normalized
  );

  return normalized;

}


// ============================================================
// 🧾 FORMAT REEL
// ============================================================

export function formatReel(
  reel
) {

  const scenes =
    reel.scenes
      .map(
        (scene, index) => {

          return [

            `🎥 SCENE ${index + 1}`,

            `⏱ Duration: ${scene.duration}`,

            `👁 Visual: ${scene.visual}`,

            `📷 Camera: ${scene.camera}`,

            `🎞 Motion: ${scene.motion}`

          ].join("\n");

        }
      )
      .join("\n\n");

  const hashtags =
    reel.hashtags
      .map(
        tag => {

          let value =
            String(
              tag || ""
            ).trim();

          if (
            value &&
            !value.startsWith("#")
          ) {

            value =
              "#" + value;

          }

          return value;

        }
      )
      .filter(Boolean)
      .slice(0, 8)
      .join(" ");

  return [

    "🎬 ATLAS REEL",

    "",

    `🎯 Title: ${reel.title}`,

    `⚡ Hook: ${reel.hook}`,

    `🇮🇷 Persian Hook: ${reel.on_screen_text.fa}`,

    `⏱ Duration: ${reel.duration}`,

    "",

    scenes,

    "",

    "🔊 AUDIO",

    `🌧 Ambient: ${reel.audio.ambient}`,

    `✨ Effects: ${reel.audio.effects}`,

    "",

    "🎙 VOICEOVER",

    `🇬🇧 ${reel.voiceover.en}`,

    `🇮🇷 ${reel.voiceover.fa}`,

    "",

    "🖥 ON-SCREEN TEXT",

    `🇬🇧 ${reel.on_screen_text.en}`,

    `🇮🇷 ${reel.on_screen_text.fa}`,

    "",

    `📝 CTA: ${reel.cta}`,

    "",

    "📦 CAPTION",

    `🇬🇧 ${reel.caption_en}`,

    `🇮🇷 ${reel.caption_fa}`,

    "",

    "🔖 HASHTAGS",

    hashtags

  ].join("\n");

}


// ============================================================
// 📝 GENERATE POST
// ============================================================

export async function generatePost(
  env,
  sourceIdea = ""
) {

  const idea =
    sourceIdea?.trim() ||
    "Create a fresh calm and relaxing ASMR idea.";

  const messages = [

    {
      role: "system",

      content: `
You are Atlas Content Factory.

${CONTENT_RULES}

Create ONE bilingual Instagram post.

Return ONLY valid JSON.

{
  "hook_en": "",
  "caption_en": "",
  "cta_en": "",
  "hook_fa": "",
  "caption_fa": "",
  "cta_fa": "",
  "hashtags": []
}

All fields are REQUIRED.

English:

hook_en:
Maximum 10 words.

caption_en:
Maximum 25 words.

cta_en:
Maximum 10 words.

Persian:

hook_fa:
Maximum 10 natural words.

caption_fa:
Maximum 30 natural words.

cta_fa:
Maximum 10 natural words.

Hashtags:
5 to 8 relevant hashtags.

Do not return empty fields.

Return JSON only.
      `.trim()

    },

    {
      role: "user",

      content: `
Create ONE Instagram post based specifically
on this idea:

${idea}

Return JSON only.
      `.trim()

    }

  ];

  let raw;

  try {

    raw =
      await generateAI(
        env,
        messages
      );

  } catch (error) {

    console.error(
      "ATLAS_POST_AI_ERROR:",
      error?.stack ||
      error
    );

    throw error;

  }

  let post;

  try {

    post =
      parseAIJSON(
        raw,
        "POST"
      );

  } catch {

    const retryRaw =
      await generateAI(
        env,
        [

          {
            role: "system",

            content: `
Return ONLY valid JSON.

{
  "hook_en": "",
  "caption_en": "",
  "cta_en": "",
  "hook_fa": "",
  "caption_fa": "",
  "cta_fa": "",
  "hashtags": []
}
            `.trim()

          },

          {
            role: "user",

            content:
              idea

          }

        ]
      );

    post =
      parseAIJSON(
        retryRaw,
        "POST_RETRY"
      );

  }

  validatePost(
    post
  );

  return formatPost(
    post
  );

}


// ============================================================
// 🛡️ VALIDATE POST
// ============================================================

function validatePost(
  post
) {

  const fields = [

    "hook_en",
    "caption_en",
    "cta_en",
    "hook_fa",
    "caption_fa",
    "cta_fa"

  ];

  for (
    const field of fields
  ) {

    if (
      typeof post[field] !== "string" ||
      !post[field].trim()
    ) {

      throw new Error(
        `POST_FIELD_MISSING:${field}`
      );

    }

  }

  if (
    !Array.isArray(
      post.hashtags
    )
  ) {

    post.hashtags = [];

  }

}


// ============================================================
// 🧾 FORMAT POST
// ============================================================

function formatPost(
  post
) {

  const hashtags =
    post.hashtags
      .map(
        tag => {

          let value =
            String(
              tag || ""
            ).trim();

          if (
            value &&
            !value.startsWith("#")
          ) {

            value =
              "#" + value;

          }

          return value;

        }
      )
      .filter(Boolean)
      .slice(0, 8)
      .join(" ");

  return [

    "📦 ATLAS POST",

    "",

    "🇬🇧 ENGLISH",

    `Hook: ${post.hook_en}`,

    `Caption: ${post.caption_en}`,

    `CTA: ${post.cta_en}`,

    "",

    "🇮🇷 فارسی",

    `هوک: ${post.hook_fa}`,

    `کپشن: ${post.caption_fa}`,

    `CTA: ${post.cta_fa}`,

    "",

    "🔖 HASHTAGS",

    hashtags

  ].join("\n");

}
