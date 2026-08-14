// ============================================================
// 🏭 ATLAS CONTENT ENGINE
// ============================================================

import { generateAI } from "../ai/engine.js";


// ============================================================
// ⚙️ CONTENT RULES
// ============================================================

const CONTENT_RULES = `
GENERAL:

Create concise, engaging social media content.

Main topics:

calmness
relaxation
ASMR
peaceful moments
mindfulness
nature sounds

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
Keep sentences short.
Avoid robotic wording.
Avoid exaggerated claims.

PERSIAN:

Write natural modern Persian.

Do NOT translate the English sentence word-by-word.

The Persian must be independently written
for a Persian-speaking Instagram audience.

Use natural conversational Persian.

Avoid unnatural expressions such as:

"آرامش خود را پیدا کنید"
"به آرامش بپردازید"
"ذهن خود را آزاد کنید"
"با این آرامش همراه شوید"
"تنفس کن با صدای باران"

Prefer natural expressions such as:

"چند لحظه از شلوغی فاصله بگیر."
"چشم‌هات رو ببند و به صدای بارون گوش بده."
"فقط چند لحظه مکث کن."
"بذار صدای بارون فضا رو آروم‌تر کنه."

Do not overuse emojis.

Keep Persian suitable for Instagram.
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

Create ONE short Instagram content idea.

Return ONLY valid JSON.

JSON structure:

{
  "hook_en": "",
  "hook_fa": "",
  "concept": "",
  "visual": "",
  "cta": ""
}

Requirements:

hook_en:
Short and catchy natural English.

hook_fa:
Natural Persian.
Do not translate hook_en literally.

concept:
One short sentence describing the content.

visual:
One short visual direction.

cta:
Short natural CTA.

Keep the entire idea concise.
      `.trim()
    },

    {
      role: "user",

      content: `
Create one original idea for an Instagram page
focused on calmness, relaxation, ASMR and peaceful content.

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

JSON structure:

{
  "hook_en": "",
  "caption_en": "",
  "cta_en": "",
  "hook_fa": "",
  "caption_fa": "",
  "cta_fa": "",
  "hashtags": []
}

ENGLISH:

hook_en:
Maximum 10 words.

caption_en:
Maximum 25 words.

cta_en:
Maximum 10 words.

PERSIAN:

hook_fa:
Maximum 10 natural words.

caption_fa:
Maximum 30 natural words.

cta_fa:
Maximum 10 natural words.

IMPORTANT:

Write Persian independently.

Do NOT translate English literally.

Make the Persian sound like a real
Persian Instagram creator wrote it.

HASHTAGS:

Return 5 to 8 relevant hashtags.

Mix English and Persian hashtags naturally.

Do not repeat hashtags.
      `.trim()
    },

    {
      role: "user",

      content: `
Create ONE Instagram post based specifically
on this idea:

${idea}

Do not change the main topic.

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
// 🎬 GENERATE REEL 2.0
// ============================================================

export async function generateReel(
  env,
  sourceIdea = ""
) {

  const idea =
    sourceIdea?.trim() ||
    "Create a calm and relaxing ASMR Reel.";


  const messages = [

    {
      role: "system",

      content: `
You are Atlas Reel Director.

${CONTENT_RULES}

Create ONE production-ready Instagram Reel
for a calmness, relaxation, ASMR and peaceful-content page.

The Reel must be practical for AI video generation.

IMPORTANT:

Return ONLY one valid JSON object.

No markdown.
No reasoning.
No <think>.
No explanation.
No multiple versions.

The Reel must have exactly 3 visual scenes.

Each scene must describe:

- visual
- camera
- motion
- duration

The total duration must be approximately
15, 30 or 60 seconds.

Do not make medical claims.
Do not claim treatment.
Do not guarantee results.

PERSIAN:

Write natural modern Persian.

Do NOT translate English literally.

Avoid robotic Persian.

Avoid expressions such as:

"به آرامش بپردازید"
"ذهن خود را آزاد کنید"
"خود را رها کنید"
"آرامش خود را پیدا کنید"
"صدای آرامش بخش به شما کمک می‌کند"

Prefer natural Instagram-style Persian.

Example style:

"چشم‌هات رو ببند و چند لحظه فقط به صدای بارون گوش بده."

"بذار این چند لحظه از شلوغی روز جدا باشه."

"فقط مکث کن و به صدای طبیعت گوش بده."

JSON STRUCTURE:

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

RULES:

title:
Maximum 6 words.

hook:
Maximum 12 words.

scene visual:
Describe only what should appear visually.

camera:
Specify shot type or camera movement.

motion:
Describe subtle natural movement.

audio:
Describe realistic ambient sound.

voiceover:
Maximum 25 words per language.

on_screen_text:
Maximum 8 words per language.

cta:
Maximum 12 words.

caption:
Maximum 30 words per language.

hashtags:
5 to 8 relevant hashtags.

Do not put audio descriptions inside scenes.

Do not put camera instructions inside visual descriptions.

Do not put voiceover inside captions.

Make every scene visually different.
      `.trim()
    },

    {
      role: "user",

      content: `
Create ONE production-ready Reel based specifically
on this idea:

${idea}

Keep the original topic and mood.

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


  return formatReel(
    reel
  );
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


  // ----------------------------------------------------------
  // Direct JSON
  // ----------------------------------------------------------

  try {

    return JSON.parse(
      cleaned
    );

  } catch {
    // Continue.
  }


  // ----------------------------------------------------------
  // Find complete JSON object
  // ----------------------------------------------------------

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
// 🧹 CLEAN RAW AI OUTPUT
// ============================================================

function cleanRaw(text) {

  return String(text || "")

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
    "cta"

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

    reel.audio = {};

  }


  if (
    !reel.audio.ambient
  ) {

    reel.audio.ambient = "";

  }


  if (
    !reel.audio.effects
  ) {

    reel.audio.effects = "";

  }


  if (
    !reel.voiceover ||
    typeof reel.voiceover !== "object"
  ) {

    reel.voiceover = {};

  }


  if (
    !reel.voiceover.en
  ) {

    reel.voiceover.en = "";

  }


  if (
    !reel.voiceover.fa
  ) {

    reel.voiceover.fa = "";

  }


  if (
    !reel.on_screen_text ||
    typeof reel.on_screen_text !== "object"
  ) {

    reel.on_screen_text = {};

  }


  if (
    !reel.on_screen_text.en
  ) {

    reel.on_screen_text.en = "";

  }


  if (
    !reel.on_screen_text.fa
  ) {

    reel.on_screen_text.fa = "";

  }


  if (
    !Array.isArray(
      reel.hashtags
    )
  ) {

    reel.hashtags = [];

  }


  if (
    typeof reel.caption_en !== "string"
  ) {

    reel.caption_en = "";

  }


  if (
    typeof reel.caption_fa !== "string"
  ) {

    reel.caption_fa = "";

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
            String(tag || "")
              .trim();


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


// ============================================================
// 🎬 FORMAT REEL 2.0
// ============================================================

function formatReel(reel) {

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
            String(tag || "")
              .trim();


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

    "🎬 ATLAS REEL 2.0",

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
