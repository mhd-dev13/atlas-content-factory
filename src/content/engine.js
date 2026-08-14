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

Write in natural modern Persian.

IMPORTANT:
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
      role: "system",

      content: `
You are Atlas Content Factory Reel Director.

${CONTENT_RULES}

Create ONE short Instagram Reel concept
based specifically on the supplied idea.

The Reel should be easy to produce
using AI video generation tools.

Return ONLY valid JSON.

JSON structure:

{
  "title": "",
  "hook": "",
  "duration": "",
  "visuals": [],
  "audio": "",
  "voiceover_en": "",
  "voiceover_fa": "",
  "on_screen_text_en": "",
  "on_screen_text_fa": "",
  "cta": ""
}

RULES:

title:
Short Reel title.

hook:
Short attention-grabbing opening.

duration:
Use 15s, 30s or 60s.

visuals:
Exactly 3 short visual scenes.

audio:
Describe the ASMR or ambient audio.

voiceover_en:
Short natural English voiceover.
Maximum 25 words.

voiceover_fa:
Natural Persian voiceover.
Maximum 30 words.
Do not translate literally.

on_screen_text_en:
Very short English text.

on_screen_text_fa:
Natural Persian text.

cta:
Short CTA.

No medical claims.
No treatment claims.
No guarantees.
No markdown.
No reasoning.
No <think>.
      `.trim()
    },

    {
      role: "user",

      content: `
Create one Reel based specifically on this idea:

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


  const reel =
    extractJSON(
      raw,
      "REEL"
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
// 🧹 CLEAN RAW
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
// 🎬 FORMAT REEL
// ============================================================

function formatReel(reel) {

  const visuals =
    Array.isArray(reel.visuals)
      ? reel.visuals
          .map(
            (item, index) =>
              `${index + 1}. ${String(item).trim()}`
          )
          .join("\n")
      : "";


  return [

    "🎬 ATLAS REEL",

    "",

    `🎯 Title: ${reel.title || ""}`,

    `⚡ Hook: ${reel.hook || ""}`,

    `⏱ Duration: ${reel.duration || ""}`,

    "",

    "🎥 VISUALS",

    visuals,

    "",

    `🔊 Audio: ${reel.audio || ""}`,

    "",

    "🇬🇧 VOICEOVER",

    reel.voiceover_en || "",

    "",

    "🇮🇷 VOICEOVER فارسی",

    reel.voiceover_fa || "",

    "",

    "🖥 ON-SCREEN TEXT",

    `EN: ${reel.on_screen_text_en || ""}`,

    `FA: ${reel.on_screen_text_fa || ""}`,

    "",

    `📝 CTA: ${reel.cta || ""}`

  ].join("\n");
}
