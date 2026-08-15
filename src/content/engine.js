// ============================================================
// 🏭 ATLAS CONTENT ENGINE
// Reel Director 3.0
// ============================================================

import { generateAI } from "../ai/engine.js";


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
// 💡 GENERATE IDEA
// ============================================================

export async function generateIdea(env) {

  const messages = [

    {
      role: "system",

      content: `
You are Atlas Content Factory.

${CONTENT_RULES}

Create ONE original Instagram Reel idea.

The idea must have strong visual potential.

The hook should make someone stop scrolling.

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
Must feel like a real Instagram hook.
Must create curiosity or emotion.

hook_fa:
Maximum 10 natural Persian words.
Do not translate hook_en literally.

concept:
One concise sentence.

visual:
Describe one visually powerful scene.

cta:
Short natural CTA.

Return JSON only.
      `.trim()
    },

    {
      role: "user",

      content: `
Create one original Reel idea for a page focused on:

calmness,
relaxation,
ASMR,
rain,
nature,
peaceful moments,
slow living.

Make the visual highly attractive
for Instagram Reels.

Return JSON only.
      `.trim()
    }

  ];


  const raw =
    await generateAI(
      env,
      messages
    );


  return extractJSON(
    raw,
    "IDEA"
  );
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

Your job is to design a production-ready
Instagram Reel.

The Reel must be visually powerful,
simple and emotionally engaging.

IMPORTANT:

Return ONLY one valid JSON object.

No markdown.
No explanation.
No reasoning.
No <think>.
No multiple versions.

The Reel must contain exactly 3 scenes.

The Reel must have:

1 strong Hook
3 visually different scenes
ambient audio direction
optional voiceover
on-screen Hook
English caption
Persian caption
CTA
hashtags

HOOK:

The hook is the most important element.

It must make the viewer stop scrolling.

Use short natural English.

Good examples:

"LET THE RAIN SLOW EVERYTHING DOWN."

"YOU DON'T NEED TO RUSH TONIGHT."

"STAY HERE FOR A FEW QUIET SECONDS."

"THIS IS YOUR SIGN TO SLOW DOWN."

Avoid generic phrases.

Do not use clickbait.

Do not make medical claims.

ON-SCREEN TEXT:

The English hook MUST be suitable
for large typography on a vertical Reel.

Maximum 8 words.

Do not use emojis.

CAPTIONS:

caption_en is REQUIRED.

caption_fa is REQUIRED.

Neither may ever be empty.

English caption:
Maximum 30 words.

Persian caption:
Maximum 30 natural words.

Persian must NOT be a literal translation.

CTA:

Maximum 12 words.

HASHTAGS:

5 to 8 relevant hashtags.

Mix English and Persian naturally.

SCENES:

Exactly 3 scenes.

Each scene must contain:

visual
camera
motion
duration

Make every scene visually different.

Do not put text inside visual descriptions.

Do not put camera instructions inside visual.

Do not put audio descriptions inside scenes.

TOTAL DURATION:

Approximately 15, 30 or 60 seconds.

For this system prefer 30 seconds,
but 10-30 seconds is acceptable
for rendering limitations.

JSON:

{
  "title": "",
  "hook": "",
  "duration": "30s",

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

Return JSON only.
      `.trim()
    },

    {
      role: "user",

      content: `
Create ONE production-ready Reel
based specifically on this idea:

${idea}

Keep the original mood and topic.

The final result must contain
a strong English Hook suitable
for large on-screen typography.

caption_en and caption_fa
must both contain real content.

Return JSON only.
      `.trim()
    }

  ];


  const raw =
    await generateAI(
      env,
      messages
    );


  const reel =
    extractJSON(
      raw,
      "REEL"
    );


  validateReel(
    reel
  );


  return reel;
}


// ============================================================
// 🧠 EXTRACT JSON
// ============================================================

function extractJSON(
  text,
  type = "CONTENT"
) {

  const cleaned =
    cleanRaw(
      text
    );


  try {

    return JSON.parse(
      cleaned
    );

  } catch {
    // Continue.
  }


  const start =
    cleaned.indexOf("{");


  if (start === -1) {

    throw new Error(
      `${type}_JSON_NOT_FOUND`
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

        const jsonText =
          cleaned.slice(
            start,
            i + 1
          );


        try {

          return JSON.parse(
            jsonText
          );

        } catch {

          throw new Error(
            `${type}_JSON_INVALID`
          );

        }

      }

    }

  }


  throw new Error(
    `${type}_JSON_INCOMPLETE`
  );

}


// ============================================================
// 🧹 CLEAN AI OUTPUT
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
      /<\/think>/gi,
      ""
    )

    .replace(
      /```json/gi,
      ""
    )

    .replace(
      /```/g,
      ""
    )

    .trim();

}


// ============================================================
// 🛡️ VALIDATE REEL
// ============================================================

function validateReel(reel) {

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


  // ----------------------------------------------------------
  // HOOK
  // ----------------------------------------------------------

  if (
    typeof reel.hook !== "string" ||
    !reel.hook.trim()
  ) {

    throw new Error(
      "REEL_HOOK_MISSING"
    );

  }


  // ----------------------------------------------------------
  // SCENES
  // ----------------------------------------------------------

  if (
    !Array.isArray(
      reel.scenes
    )
  ) {

    throw new Error(
      "REEL_SCENES_INVALID"
    );

  }


  if (
    reel.scenes.length !== 3
  ) {

    throw new Error(
      "REEL_SCENES_COUNT_INVALID"
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
      reel.audio.ambient || ""
    );


  reel.audio.effects =
    String(
      reel.audio.effects || ""
    );


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
      reel.voiceover.en || ""
    );


  reel.voiceover.fa =
    String(
      reel.voiceover.fa || ""
    );


  // ----------------------------------------------------------
  // ON SCREEN TEXT
  // ----------------------------------------------------------

  if (
    !reel.on_screen_text ||
    typeof reel.on_screen_text !== "object"
  ) {

    reel.on_screen_text = {};

  }


  /*
   * English Hook is authoritative.
   *
   * This guarantees the renderer
   * always has a valid text.
   */

  reel.on_screen_text.en =
    String(
      reel.on_screen_text.en ||
      reel.hook ||
      ""
    ).trim();


  reel.on_screen_text.fa =
    String(
      reel.on_screen_text.fa || ""
    ).trim();


  // ----------------------------------------------------------
  // CTA
  // ----------------------------------------------------------

  reel.cta =
    String(
      reel.cta || ""
    ).trim();


  // ----------------------------------------------------------
  // CAPTION EN
  // ----------------------------------------------------------

  reel.caption_en =
    String(
      reel.caption_en || ""
    ).trim();


  if (!reel.caption_en) {

    reel.caption_en =
      reel.hook.trim();

  }


  // ----------------------------------------------------------
  // CAPTION FA
  // ----------------------------------------------------------

  reel.caption_fa =
    String(
      reel.caption_fa || ""
    ).trim();


  if (!reel.caption_fa) {

    reel.caption_fa =
      "چند لحظه از شلوغی فاصله بگیر.";

  }


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


  const raw =
    await generateAI(
      env,
      messages
    );


  const post =
    extractJSON(
      raw,
      "POST"
    );


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

function validatePost(post) {

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

function formatPost(post) {

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
