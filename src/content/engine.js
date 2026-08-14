// ============================================================
// 🏭 ATLAS CONTENT ENGINE
// ============================================================

import { generateAI } from "../ai/engine.js";


// ============================================================
// 📝 GENERATE POST
// ============================================================

export async function generatePost(env) {

  const messages = [

    {
      role: "system",

      content: `
You are Atlas Content Factory.

Create social media content for a bilingual
English + Persian Instagram page.

Topic:
calmness, relaxation, ASMR, peaceful moments.

IMPORTANT:

Return ONLY ONE valid JSON object.

Do not write anything before the JSON.
Do not write anything after the JSON.
Do not explain.
Do not reason.
Do not use markdown.
Do not use <think>.
Do not output multiple versions.

The Persian must sound like natural modern Persian.
Never translate English word-by-word.

Avoid medical claims.
Avoid treatment claims.
Avoid guaranteed results.

Use this exact JSON structure:

{
  "hook_en": "",
  "caption_en": "",
  "cta_en": "",
  "hook_fa": "",
  "caption_fa": "",
  "cta_fa": "",
  "hashtags": []
}

Keep the content short.
      `.trim()
    },

    {
      role: "user",

      content: `
Create ONE Instagram post.

English:
- natural
- emotional
- short
- suitable for Instagram

Persian:
- natural
- conversational
- NOT literal translation
- grammatically correct

Use 5 to 8 hashtags.

Return JSON only.
      `.trim()
    }

  ];


  const raw = await generateAI(
    env,
    messages
  );

  return formatPost(
    extractJSON(raw)
  );
}


// ============================================================
// 🧠 EXTRACT FIRST VALID JSON
// ============================================================

function extractJSON(text) {

  if (!text) {
    throw new Error(
      "POST_EMPTY_RESPONSE"
    );
  }

  let cleaned =
    String(text)
      .trim()
      .replace(
        /<think>[\s\S]*?<\/think>/gi,
        ""
      )
      .trim();


  // ----------------------------------------------------------
  // Find first JSON object
  // ----------------------------------------------------------

  const start =
    cleaned.indexOf("{");

  if (start === -1) {
    throw new Error(
      "POST_JSON_NOT_FOUND"
    );
  }


  // ----------------------------------------------------------
  // Find matching closing brace
  // ----------------------------------------------------------

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

        } catch (error) {

          console.error(
            "POST_JSON_PARSE_ERROR:",
            jsonText
          );

          throw new Error(
            "POST_INVALID_JSON"
          );
        }
      }
    }
  }


  throw new Error(
    "POST_JSON_INCOMPLETE"
  );
}


// ============================================================
// 🧹 VALIDATE CONTENT
// ============================================================

function validatePost(post) {

  const required = [
    "hook_en",
    "caption_en",
    "cta_en",
    "hook_fa",
    "caption_fa",
    "cta_fa"
  ];


  for (
    const field of required
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


  return post;
}


// ============================================================
// 📦 FORMAT TELEGRAM POST
// ============================================================

function formatPost(post) {

  post =
    validatePost(post);


  const hashtags =
    post.hashtags
      .map(tag => {

        let value =
          String(tag)
            .trim();

        if (
          value &&
          !value.startsWith("#")
        ) {

          value =
            "#" + value;
        }

        return value;

      })
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
