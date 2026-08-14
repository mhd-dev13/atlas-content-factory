// ============================================================
// 🏭 ATLAS CONTENT ENGINE
// Central content generation layer
// ============================================================

import { generateAI } from "../ai/engine.js";


// ============================================================
// 🎯 GENERATE POST
// ============================================================

export async function generatePost(env, idea = "") {

  const ideaText = idea?.trim() || "Create a fresh idea.";

  const messages = [

    {
      role: "system",

      content: `
You are Atlas Content Factory.

You create short, engaging social media content
for an Instagram page focused on:

calmness
relaxation
ASMR
peaceful moments
mindfulness

The audience is bilingual:
English + Persian.

IMPORTANT RULES:

- Return ONLY the final content.
- Never show reasoning.
- Never show analysis.
- Never use <think>.
- Never write "Okay".
- Never write "The user wants".
- Never write "Answer:".
- Do not make medical claims.
- Do not promise treatment.
- Do not promise guaranteed results.
- Keep English natural.
- Keep Persian natural and conversational.
- Do not translate word-for-word.
- English and Persian must be separated.
- Keep the result concise.
      `.trim()
    },

    {
      role: "user",

      content: `
Create ONE Instagram post based on this idea:

${ideaText}

Return EXACTLY this structure:

📦 ATLAS POST

🇬🇧 ENGLISH

Hook:
[one short hook]

Caption:
[2 short sentences]

CTA:
[one short sentence]


🇮🇷 فارسی

هوک:
[یک هوک کوتاه و طبیعی]

کپشن:
[۲ جمله کوتاه]

CTA:
[یک جمله کوتاه]


#️⃣ HASHTAGS

[5 to 8 relevant hashtags]

Maximum 130 words.
      `.trim()
    }

  ];


  return await generateAI(
    env,
    messages
  );
}


// ============================================================
// 💡 GENERATE IDEA
// Future shared idea engine
// ============================================================

export async function generateIdea(env) {

  const messages = [

    {
      role: "system",

      content: `
You are Atlas Content Factory.

Create short bilingual Instagram ideas
about calmness, relaxation, ASMR and peaceful content.

Return ONLY the final content.
No reasoning.
No analysis.
No <think>.
No medical claims.
No guaranteed results.

English and Persian must sound natural.
      `.trim()
    },

    {
      role: "user",

      content: `
Create ONE short Instagram idea.

Use exactly:

💡 IDEA

🇬🇧 Hook:
[short English hook]

🇮🇷 هوک:
[short Persian hook]

🎬 Concept:
[one short sentence]

🎨 Visual:
[one short sentence]

📝 CTA:
[one short sentence]

Maximum 50 words.
      `.trim()
    }

  ];

  return await generateAI(
    env,
    messages
  );
}
