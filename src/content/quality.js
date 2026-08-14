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

Check ONE social media post.

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

IMPORTANT:

Return ONLY one JSON object.

Do not write anything before JSON.
Do not write anything after JSON.
Do not use markdown.
Do not use code fences.
Do not use <think>.

EXACT JSON STRUCTURE:

{
  "approved": true,
  "score": 85,
  "issues": [],
  "fixes": []
}

Rules:

score must be an integer from 0 to 100.

issues must be an array of short strings.

fixes must be an array of short strings.

approved must be true only when score >= 80.
      `.trim()
    },

    {
      role: "user",

      content: `
Evaluate this post:

${String(post || "")}

Return ONLY JSON.
      `.trim()
    }

  ];


  const raw =
    await generateAI(
      env,
      messages
    );


  console.log(
    "ATLAS_QUALITY_RAW:",
    String(raw || "")
  );


  const result =
    parseQualityResult(raw);


  // ==========================================================
  // 🧹 NORMALIZE RESULT
  // ==========================================================

  let score =
    Number(result.score);


  if (!Number.isFinite(score)) {
    score = 0;
  }


  score =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(score)
      )
    );


  const issues =
    Array.isArray(result.issues)
      ? result.issues
          .map(
            item =>
              String(item || "").trim()
          )
          .filter(Boolean)
      : [];


  const fixes =
    Array.isArray(result.fixes)
      ? result.fixes
          .map(
            item =>
              String(item || "").trim()
          )
          .filter(Boolean)
      : [];


  const approved =
    score >= 80;


  const finalResult = {

    approved,

    score,

    issues,

    fixes

  };


  console.log(
    "ATLAS_QUALITY:",
    JSON.stringify(finalResult)
  );


  return finalResult;
}


// ============================================================
// 🧠 PARSE QUALITY RESULT
// ============================================================

function parseQualityResult(text) {

  const cleaned =
    cleanAIOutput(text);


  // ----------------------------------------------------------
  // DIRECT JSON
  // ----------------------------------------------------------

  try {

    const direct =
      JSON.parse(cleaned);


    return normalizeRawResult(
      direct
    );

  } catch {
    // Continue to extraction.
  }


  // ----------------------------------------------------------
  // EXTRACT JSON OBJECT
  // ----------------------------------------------------------

  const object =
    extractJSONObject(
      cleaned
    );


  if (!object) {

    console.error(
      "QUALITY_JSON_NOT_FOUND:",
      cleaned
    );


    throw new Error(
      "QUALITY_JSON_NOT_FOUND"
    );
  }


  try {

    return normalizeRawResult(
      JSON.parse(object)
    );

  } catch (error) {

    console.error(
      "QUALITY_JSON_INVALID:",
      object
    );


    // --------------------------------------------------------
    // LAST RESORT: TRY REPAIR
    // --------------------------------------------------------

    const repaired =
      repairJSON(object);


    try {

      return normalizeRawResult(
        JSON.parse(repaired)
      );

    } catch {

      throw new Error(
        "QUALITY_JSON_INVALID"
      );
    }
  }
}


// ============================================================
// 🧹 CLEAN AI OUTPUT
// ============================================================

function cleanAIOutput(text) {

  return String(text || "")

    // Remove reasoning blocks.
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

    // Remove markdown code fences.
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
// 📦 EXTRACT FIRST COMPLETE JSON OBJECT
// ============================================================

function extractJSONObject(text) {

  const start =
    text.indexOf("{");


  if (start === -1) {
    return null;
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


    // --------------------------------------------------------
    // STRING ESCAPE
    // --------------------------------------------------------

    if (
      char === "\\" &&
      !escaped
    ) {

      escaped = true;

      continue;
    }


    // --------------------------------------------------------
    // STRING
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // OBJECT DEPTH
    // --------------------------------------------------------

    if (char === "{") {

      depth++;

    }


    if (char === "}") {

      depth--;


      if (depth === 0) {

        return text.slice(
          start,
          i + 1
        );

      }

    }

  }


  return null;
}


// ============================================================
// 🛠️ LIGHT JSON REPAIR
// ============================================================

function repairJSON(text) {

  let repaired =
    String(text || "").trim();


  // Remove trailing commas.
  repaired =
    repaired.replace(
      /,\s*([}\]])/g,
      "$1"
    );


  // Convert smart quotes.
  repaired =
    repaired
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'");


  return repaired;
}


// ============================================================
// 🧩 NORMALIZE RAW RESULT
// ============================================================

function normalizeRawResult(result) {

  if (
    !result ||
    typeof result !== "object" ||
    Array.isArray(result)
  ) {

    throw new Error(
      "QUALITY_JSON_INVALID"
    );
  }


  return {

    approved:
      result.approved === true,

    score:
      result.score,

    issues:
      Array.isArray(result.issues)
        ? result.issues
        : [],

    fixes:
      Array.isArray(result.fixes)
        ? result.fixes
        : []

  };
}
