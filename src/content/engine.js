// ============================================================
// 🏭 ATLAS CONTENT ENGINE
// ============================================================

import { generateAI } from "../ai/engine.js";
import { checkContent } from "./quality.js";


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

Create ONE bilingual Instagram post.

Main topics:

calmness
relaxation
ASMR
peaceful moments
mindfulness

IMPORTANT:

Return ONLY ONE valid JSON object.

No explanation.
No reasoning.
No <think>.
No markdown.
No multiple versions.

The Persian must be natural modern Persian.

Never translate English word-by-word.

The Persian should sound like something
a real Persian-speaking Instagram creator
would write.

Avoid medical claims.
Avoid treatment claims.
Avoid guaranteed results.

Keep everything concise.

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
      `.trim()
    },

    {
      role: "user",

      content: `
Create one Instagram post based specifically
on this idea:

${idea}

Do not change the topic.

English:
Natural and engaging.

Persian:
Natural and conversational.
Do NOT translate literally.

Use 5 to 8 relevant hashtags.

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
    extractPostJSON(raw);


  return formatPost(
    post
  );
}


// ============================================================
// 💡 GENERATE IDEA
// ============================================================

export async function generateIdea(env) {

  const messages = [

    {
      role: "system",

      content: `
You are Atlas Content Factory.

Create ONE short Instagram content idea.

Topic:
calmness, relaxation, ASMR and peaceful content.

Return ONLY valid JSON.

No reasoning.
No analysis.
No <think>.
No markdown.

JSON:

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

      content: `
Create one original Instagram idea.

Keep it short.

English must sound natural.

Persian must sound like natural
modern Persian, not a literal translation.

Return JSON only.
      `.trim()
    }

  ];


  const raw =
    await generateAI(
      env,
      messages
    );


  return extractIdeaJSON(
    raw
  );
}


// ============================================================
// 🧠 EXTRACT POST JSON
// ============================================================

function extractPostJSON(text) {

  const cleaned =
    cleanRaw(text);

  const json =
    extractJSONObject(
      cleaned
    );


  validatePost(json);


  return json;
}


// ============================================================
// 🧠 EXTRACT IDEA JSON
// ============================================================

function extractIdeaJSON(text) {

  const cleaned =
    cleanRaw(text);

  const json =
    extractJSONObject(
      cleaned
    );


  return json;
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
    .trim();
}


// ============================================================
// 📦 EXTRACT OBJECT
// ============================================================

function extractJSONObject(text) {

  const start =
    text.indexOf("{");

  if (start === -1) {

    throw new Error(
      "CONTENT_JSON_NOT_FOUND"
    );
  }


  let depth = 0;
  let inString = false;
  let escaped = false;


  for (
    let i = start;
    i < text.length;
    i++
  ) {

    const char =
      text[i];


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
          text.slice(
            start,
            i + 1
          );


        try {

          return JSON.parse(
            jsonText
          );

        } catch {

          throw new Error(
            "CONTENT_JSON_INVALID"
          );
        }
      }
    }
  }


  throw new Error(
    "CONTENT_JSON_INCOMPLETE"
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
            String(tag).trim();


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
    "",
    `Hook: ${post.hook_en}`,
    "",
    `Caption: ${post.caption_en}`,
    "",
    `CTA: ${post.cta_en}`,
    "",
    "🇮🇷 فارسی",
    "",
    `هوک: ${post.hook_fa}`,
    "",
    `کپشن: ${post.caption_fa}`,
    "",
    `CTA: ${post.cta_fa}`,
    "",
    "🔖 HASHTAGS",
    "",
    hashtags
  ].join("\n");
}
