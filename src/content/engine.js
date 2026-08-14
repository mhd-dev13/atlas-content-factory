// ============================================================
// 🏭 ATLAS CONTENT ENGINE
// ============================================================

import {
  generateAI
} from "../ai/engine.js";


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
rain
night
silence
loneliness
reflection
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
Keep sentences short.
Avoid robotic wording.
Avoid exaggerated claims.

PERSIAN:

Write natural modern Persian.

Do NOT translate English literally.

The Persian must be independently written
for a Persian-speaking Instagram audience.

Use natural conversational Instagram Persian.

Avoid robotic expressions.

Prefer phrases such as:

"فقط چند لحظه مکث کن."

"بذار بارون چند دقیقه جای شلوغی روز رو بگیره."

"گاهی فقط باید از همه‌چیز فاصله بگیری."

"چشم‌هات رو ببند و چند لحظه گوش بده."

"همین چند لحظه برای خودته."

The Persian should feel emotional,
human and natural.

Avoid excessive emojis.
`;


// ============================================================
// 💡 GENERATE IDEA
// ============================================================

export async function generateIdea(
  env
) {

  const messages = [

    {

      role:
        "system",

      content: `

You are Atlas Content Factory.

${CONTENT_RULES}

Create ONE original Instagram content idea.

The idea must be visually simple enough
to become a minimalist Reel.

Return ONLY valid JSON.

JSON:

{
  "hook_en": "",
  "hook_fa": "",
  "concept": "",
  "visual": "",
  "cta": ""
}

RULES:

hook_en:
Maximum 10 words.

hook_fa:
Maximum 10 natural Persian words.

The Persian hook must NOT be a literal translation.

It should feel emotional and natural.

concept:
One concise sentence.

visual:
One clear cinematic visual direction.

cta:
Short and natural.

Return JSON only.

`.trim()

    },

    {

      role:
        "user",

      content: `

Create ONE original idea for a Persian-first
Instagram page focused on:

calmness,
relaxation,
ASMR,
peaceful moments,
nature,
rain,
night,
silence,
reflection.

The Reel should have strong emotional
potential while remaining simple.

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

      role:
        "system",

      content: `

You are Atlas Content Factory.

${CONTENT_RULES}

Create ONE bilingual Instagram post.

Return ONLY valid JSON.

JSON:

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

HASHTAGS:

5 to 8 relevant hashtags.

Mix English and Persian naturally.

Do not repeat hashtags.

Return JSON only.

`.trim()

    },

    {

      role:
        "user",

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
// 🎬 GENERATE REEL
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

      role:
        "system",

      content: `

You are Atlas Reel Director.

${CONTENT_RULES}

Create ONE production-ready
minimalist Instagram Reel.

The Reel is designed for a Persian-first
Instagram audience.

The most important element of the Reel
is the Persian ON-SCREEN TEXT.

The viewer should understand the emotional
idea of the Reel by reading the text
on the video itself.

IMPORTANT:

on_screen_text.fa is the PRIMARY HOOK.

It must be:

- Persian
- emotional
- natural
- short
- instantly understandable
- visually suitable for 9:16
- maximum 8 words
- ideally 1 to 2 short lines

Do NOT make it a generic CTA.

Examples of the STYLE:

"فقط چند لحظه مکث کن."

"بعضی شب‌ها فقط سکوت می‌خوای."

"بذار بارون شلوغی روز رو بشوره."

"گاهی فاصله گرفتن لازمه."

"امشب فقط برای خودت وقت بذار."

Do NOT copy these examples.

Create an original line.

The English hook is secondary.

Return ONLY valid JSON.

No markdown.
No reasoning.
No <think>.
No explanation.
No multiple versions.

The Reel must contain exactly
3 visual scenes.

JSON STRUCTURE:

{
  "title": "",
  "hook": "",
  "hook_fa": "",

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

RULES:

title:
Maximum 6 words.

hook:
Maximum 12 English words.

hook_fa:
Maximum 10 Persian words.

duration:
Use 10s, 15s or 30s.

scenes:
Exactly 3.

scene visual:
Only describe what appears visually.

camera:
Only describe camera shot/movement.

motion:
Only describe subtle visual movement.

audio:
Describe realistic ambient sound.

voiceover:
Maximum 25 words per language.

IMPORTANT:
Voiceover is optional.
Do not depend on voiceover.

on_screen_text.en:
Maximum 8 words.

on_screen_text.fa:
Maximum 8 Persian words.

IMPORTANT:

on_screen_text.fa must be the strongest
emotional sentence in the entire Reel.

It must NOT be:

a title,
a generic CTA,
a hashtag,
a translation of English.

cta:
Maximum 12 words.

caption_en:
Maximum 30 words.

caption_fa:
Maximum 30 Persian words.

hashtags:
5 to 8 relevant hashtags.

Do not put audio descriptions inside scenes.

Do not put camera instructions inside visual.

Do not put voiceover inside captions.

Make scenes visually different.

Return JSON only.

`.trim()

    },

    {

      role:
        "user",

      content: `

Create ONE production-ready Reel
based specifically on this idea:

${idea}

Preserve the original emotional topic.

The Persian on-screen text must be
the strongest hook.

The visual must support the emotion
of the text.

Avoid generic motivational quotes.

Make it feel like a premium minimalist
Persian Instagram Reel.

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


  let depth =
    0;

  let inString =
    false;

  let escaped =
    false;


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

      escaped =
        true;

      continue;

    }


    if (
      char === '"' &&
      !escaped
    ) {

      inString =
        !inString;

    }


    escaped =
      false;


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

function cleanRaw(
  text
) {

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

    post.hashtags =
      [];

  }

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

    reel.audio.ambient =
      "";

  }


  if (
    !reel.audio.effects
  ) {

    reel.audio.effects =
      "";

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

    reel.voiceover.en =
      "";

  }


  if (
    !reel.voiceover.fa
  ) {

    reel.voiceover.fa =
      "";

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

    reel.on_screen_text.en =
      "";

  }


  if (
    !reel.on_screen_text.fa
  ) {

    reel.on_screen_text.fa =
      reel.hook_fa ||
      "";

  }


  // ----------------------------------------------------------
  // Important fallback
  // ----------------------------------------------------------

  if (
    !reel.on_screen_text.fa.trim()
  ) {

    reel.on_screen_text.fa =
      "فقط چند لحظه مکث کن.";

  }


  if (
    !Array.isArray(
      reel.hashtags
    )
  ) {

    reel.hashtags =
      [];

  }


  if (
    typeof reel.caption_en !== "string"
  ) {

    reel.caption_en =
      "";

  }


  if (
    typeof reel.caption_fa !== "string"
  ) {

    reel.caption_fa =
      "";

  }


  if (
    typeof reel.hook_fa !== "string"
  ) {

    reel.hook_fa =
      reel.on_screen_text.fa;

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

      .slice(
        0,
        8
      )

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
// 🎬 FORMAT REEL
// ============================================================

function formatReel(
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

      .slice(
        0,
        8
      )

      .join(" ");


  return [

    "🎬 ATLAS REEL 2.0",

    "",

    `🎯 Title: ${reel.title}`,

    `⚡ Hook: ${reel.hook}`,

    `🇮🇷 Persian Hook: ${reel.hook_fa || reel.on_screen_text.fa}`,

    `⏱ Duration: ${reel.duration}`,

    "",

    scenes,

    "",

    "🔊 AUDIO",

    `🌧 Ambient: ${reel.audio.ambient}`,

    `✨ Effects: ${reel.audio.effects}`,

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
