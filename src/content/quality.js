// ============================================================
// 🛡️ ATLAS CONTENT QUALITY ENGINE
// ============================================================

import { generateAI } from "../ai/engine.js";


// ============================================================
// 🔍 CHECK CONTENT
// ============================================================

export async function checkContent(env, post) {

  const messages = [

    {
      role: "system",

      content: `
You are Atlas Content Quality Controller.

Your job is to check social media content
before it is published.

Check:

1. Natural English
2. Natural Persian
3. No literal translation
4. No medical claims
5. No treatment claims
6. No guaranteed results
7. Short and engaging
8. Relevant to calmness, relaxation or ASMR
9. Good CTA
10. Useful hashtags
11. No duplicated sections
12. No <think>
13. No reasoning
14. No markdown

Return ONLY valid JSON.

Use exactly:

{
  "approved": true,
  "score": 0,
  "issues": [],
  "fixes": []
}

Score from 0 to 100.

Approve only if score >= 80.
      `.trim()
    },

    {
      role: "user",

      content: `
Check this post:

${JSON.stringify(post)}

Return JSON only.
      `.trim()
    }

  ];


  const raw =
    await generateAI(
      env,
      messages
    );


  const result =
    extractQualityJSON(raw);


  if (
    typeof result.score !== "number"
  ) {

    result.score = 0;
  }


  if (
    !Array.isArray(result.issues)
  ) {

    result.issues = [];
  }


  if (
    !Array.isArray(result.fixes)
  ) {

    result.fixes = [];
  }


  result.approved =
    result.score >= 80;


  console.log(
    "ATLAS_QUALITY:",
    JSON.stringify(result)
  );


  return result;
}


// ============================================================
// 🧠 EXTRACT JSON
// ============================================================

function extractQualityJSON(text) {

  const cleaned =
    String(text || "")
      .replace(
        /<think>[\s\S]*?<\/think>/gi,
        ""
      )
      .replace(
        /<\/think>/gi,
        ""
      )
      .trim();


  const start =
    cleaned.indexOf("{");


  const end =
    cleaned.lastIndexOf("}");


  if (
    start === -1 ||
    end === -1 ||
    end <= start
  ) {

    throw new Error(
      "QUALITY_JSON_NOT_FOUND"
    );
  }


  const jsonText =
    cleaned.slice(
      start,
      end + 1
    );


  try {

    return JSON.parse(
      jsonText
    );

  } catch (error) {

    console.error(
      "QUALITY_JSON_ERROR:",
      jsonText
    );

    throw new Error(
      "QUALITY_JSON_INVALID"
    );
  }
}
