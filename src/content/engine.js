// ============================================================
// 🏭 ATLAS CONTENT ENGINE
// ============================================================

import { generateAI } from "../ai/engine.js";


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

Create ONE short bilingual Instagram post.

TOPIC:
calmness, relaxation, ASMR, peaceful moments,
mindfulness and calming sensory content.

IMPORTANT:

Return ONLY ONE valid JSON object.

Do NOT return:
- explanations
- reasoning
- analysis
- <think>
- markdown
- multiple versions
- introductions

The content must be concise.

ENGLISH:
Write natural, modern Instagram English.

PERSIAN:
Write natural modern Persian as a real Persian-speaking
Instagram creator would write.

IMPORTANT FOR PERSIAN:

Never translate English word-by-word.

Do not use unnatural formal phrases such as:
"به آرامش خود بپردازید"
"تجربه‌ای از آرامش"
"ذهن خود را آزاد کنید"
"در این سفر آرامش‌بخش"
unless they genuinely fit the context.

Prefer short, conversational Persian.

Use natural expressions such as:
"چند دقیقه فقط گوش بده."
"چشم‌هات رو ببند."
"بذار صدای بارون پخش بشه."
"چند لحظه از شلوغی فاصله بگیر."

Do not overuse emojis.

SAFETY:

Do not make medical claims.

Do not claim to treat anxiety, depression,
insomnia or any medical condition.

Do not promise guaranteed results.

Do not use phrases like:
"instantly cures"
"guaranteed relaxation"
"treats anxiety"
"درمان اضطراب"
"رفع قطعی استرس"

CONTENT:

Keep the post short enough for Instagram.

Create one coherent idea.

Hashtags must be relevant.

Use 5 to 8 hashtags.

JSON STRUCTURE:

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
Create ONE Instagram post based specifically
on this idea:

${idea}

Do not change the main topic.

English:
Natural, short and engaging.

Persian:
Natural, conversational and native-sounding.
Do not translate literally.

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

export async function generateIdea(
  env
) {

  const messages = [

    {
      role: "system",

      content: `
You are Atlas Content Factory.

Create ONE original short Instagram content idea.

MAIN TOPICS:

calmness
relaxation
ASMR
peaceful moments
mindfulness
nature sounds
ambient sounds

Return ONLY valid JSON.

Do NOT return:
- reasoning
- analysis
- explanations
- <think>
- markdown
- multiple ideas

Keep the idea concise.

English must sound natural.

Persian must sound like natural modern Persian.

Never translate English word-by-word.

Do not make medical claims.

Do not promise guaranteed results.

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
Create ONE original Instagram idea.

Make it visually interesting and easy
to turn into a short Reel.

Keep everything concise.

English should sound natural.

Persian should sound conversational
and native.

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
// 🎬 GENERATE REEL
// ============================================================

export async function generateReel(
  env,
  sourceIdea = ""
) {

  const idea =
    sourceIdea?.trim() ||
    "Create a short calming ASMR Reel.";


  const messages = [

    {
      role: "system",

      content: `
You are Atlas Content Factory's Reel Engine.

Create ONE short Instagram Reel concept.

MAIN TOPICS:

calmness
relaxation
ASMR
peaceful moments
mindfulness
nature
ambient sounds

The Reel must be simple enough
to produce using AI video tools
or stock footage.

IMPORTANT:

Return ONLY ONE valid JSON object.

No explanation.
No reasoning.
No analysis.
No <think>.
No markdown.
No multiple versions.

REEL LENGTH:

20 to 35 seconds.

STRUCTURE:

1. Strong hook.
2. Calm visual sequence.
3. Short voiceover or on-screen text.
4. Natural CTA.

PERSIAN:

Persian must sound like natural modern
Instagram Persian.

Never translate English word-by-word.

Keep Persian short and conversational.

Avoid robotic phrases.

Avoid excessive poetic language.

SAFETY:

Do not make medical claims.

Do not claim to treat anxiety,
depression, insomnia or any medical condition.

Do not promise guaranteed results.

A Reel about calmness is allowed,
but it must not present itself as medical treatment.

VISUALS:

Describe simple scenes that can be generated
or found as stock footage.

AUDIO:

Suggest calming ASMR or ambient sounds.

VOICEOVER:

Keep it short.

The Reel should work even without voiceover,
using on-screen text.

HASHTAGS:

Use 5 to 8 relevant hashtags.

JSON STRUCTURE:

{
  "title": "",
  "duration": "",
  "hook_en": "",
  "hook_fa": "",
  "voiceover_en": "",
  "voiceover_fa": "",
  "scenes": [
    {
      "time": "",
      "visual": "",
      "text_en": "",
      "text_fa": "",
      "sound": ""
    }
  ],
  "cta_en": "",
  "cta_fa": "",
  "caption_en": "",
  "caption_fa": "",
  "hashtags": []
}
      `.trim()
    },


    {
      role: "user",

      content: `
Create ONE Reel based specifically
on this idea:

${idea}

Make the concept visually simple,
calming and suitable for Instagram.

Keep the total Reel between
20 and 35 seconds.

Keep voiceover and on-screen text short.

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
    extractReelJSON(
      raw
    );


  return formatReel(
    reel
  );
}


// ============================================================
// 🧠 EXTRACT POST JSON
// ============================================================

function extractPostJSON(
  text
) {

  const cleaned =
    cleanRaw(text);


  const json =
    extractJSONObject(
      cleaned
    );


  validatePost(
    json
  );


  return json;
}


// ============================================================
// 🧠 EXTRACT IDEA JSON
// ============================================================

function extractIdeaJSON(
  text
) {

  const cleaned =
    cleanRaw(text);


  const json =
    extractJSONObject(
      cleaned
    );


  validateIdea(
    json
  );


  return json;
}


// ============================================================
// 🧠 EXTRACT REEL JSON
// ============================================================

function extractReelJSON(
  text
) {

  const cleaned =
    cleanRaw(text);


  const json =
    extractJSONObject(
      cleaned
    );


  validateReel(
    json
  );


  return json;
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
      /<think>[\s\S]*/gi,
      ""
    )

    .replace(
      /<\/think>/gi,
      ""
    )

    .trim();
}


// ============================================================
// 📦 EXTRACT JSON OBJECT
// ============================================================

function extractJSONObject(
  text
) {

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
// 🛡️ VALIDATE IDEA
// ============================================================

function validateIdea(
  idea
) {

  const fields = [

    "hook_en",
    "hook_fa",
    "concept",
    "visual",
    "cta"

  ];


  for (
    const field of fields
  ) {

    if (
      typeof idea[field] !== "string" ||
      !idea[field].trim()
    ) {

      throw new Error(
        `IDEA_FIELD_MISSING:${field}`
      );

    }

  }

}


// ============================================================
// 🛡️ VALIDATE REEL
// ============================================================

function validateReel(
  reel
) {

  const fields = [

    "title",
    "duration",
    "hook_en",
    "hook_fa",
    "voiceover_en",
    "voiceover_fa",
    "cta_en",
    "cta_fa",
    "caption_en",
    "caption_fa"

  ];


  for (
    const field of fields
  ) {

    if (
      typeof reel[field] !== "string" ||
      !reel[field].trim()
    ) {

      throw new Error(
        `REEL_FIELD_MISSING:${field}`
      );

    }

  }


  if (
    !Array.isArray(
      reel.scenes
    ) ||
    reel.scenes.length === 0
  ) {

    throw new Error(
      "REEL_SCENES_MISSING"
    );

  }


  if (
    !Array.isArray(
      reel.hashtags
    )
  ) {

    reel.hashtags = [];

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


// ============================================================
// 🎬 FORMAT REEL
// ============================================================

function formatReel(
  reel
) {

  const hashtags =
    reel.hashtags

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


  const scenes =
    reel.scenes

      .map(
        (scene, index) => {

          return [

            `🎥 Scene ${index + 1}`,

            `⏱️ ${scene.time}`,

            `🎨 Visual: ${scene.visual}`,

            `🇬🇧 Text: ${scene.text_en}`,

            `🇮🇷 متن: ${scene.text_fa}`,

            `🔊 Sound: ${scene.sound}`

          ].join("\n");

        }
      )

      .join("\n\n");


  return [

    "🎬 ATLAS REEL",

    "",

    `🎞️ Title: ${reel.title}`,

    `⏱️ Duration: ${reel.duration}`,

    "",

    "🔥 HOOK",

    `🇬🇧 ${reel.hook_en}`,

    `🇮🇷 ${reel.hook_fa}`,

    "",

    "🎙️ VOICEOVER",

    `🇬🇧 ${reel.voiceover_en}`,

    `🇮🇷 ${reel.voiceover_fa}`,

    "",

    "🎥 SCENES",

    "",

    scenes,

    "",

    "📝 CTA",

    `🇬🇧 ${reel.cta_en}`,

    `🇮🇷 ${reel.cta_fa}`,

    "",

    "📦 CAPTION",

    `🇬🇧 ${reel.caption_en}`,

    "",

    `🇮🇷 ${reel.caption_fa}`,

    "",

    "🔖 HASHTAGS",

    "",

    hashtags

  ].join("\n");
}
