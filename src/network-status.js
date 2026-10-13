const SOURCE_CONFIG = [
  { id: "arvancloud", label_fa: "رادار ابرآروان", category: "operator", url: "https://iranblock.com/api/v1/arvancloud/latest" },
  { id: "isp", label_fa: "پایش اپراتورها", category: "operator", url: "https://iranblock.com/api/v1/isp/current" },
  { id: "connectivity", label_fa: "پروب دسترسی سرویس‌ها", category: "service_access", url: "https://iranblock.com/api/v1/connectivity/services" },
  { id: "ooni", label_fa: "اندازه‌گیری‌های داخل ایران (OONI)", category: "censorship", url: "https://iranblock.com/api/v1/ooni/latest" },
  { id: "ioda", label_fa: "سیگنال‌های قطعی (IODA)", category: "outage", url: "https://iranblock.com/api/v1/ioda/summary" },
  { id: "cloudflare", label_fa: "کیفیت شبکه (Cloudflare Radar)", category: "network_quality", url: "https://iranblock.com/api/v1/cloudflare/quality" },
  { id: "routing", label_fa: "مسیریابی اینترنت (RIPE)", category: "routing", url: "https://iranblock.com/api/v1/routing/metrics" },
  { id: "source_freshness", label_fa: "تازگی منابع", category: "metadata", url: "https://iranblock.com/api/v1/status/sources" }
];
const CACHE_KEY = "atlas:network-status:multi-source:v2";
const CACHE_TTL_SECONDS = 300;

const OPERATOR_ALIASES = [
  ["همراه اول", ["همراه اول", "hamrah", "mci", "mobile communication"]],
  ["ایرانسل", ["ایرانسل", "irancell"]],
  ["مخابرات", ["مخابرات", "tci", "telecommunication company of iran"]],
  ["پارس‌آنلاین", ["پارس آنلاین", "پارس‌آنلاین", "pars online", "parsonline"]],
  ["آسیاتک", ["آسیاتک", "asiatech"]],
  ["مبین‌نت", ["مبین نت", "مبین‌نت", "mobinnet", "mobin net"]],
  ["افرانت", ["افرانت", "afranet"]],
  ["هاست‌ایران", ["هاست ایران", "هاست‌ایران", "hostiran", "host iran"]],
  ["های‌وب", ["های وب", "های‌وب", "hiweb"]],
  ["رسپینا", ["رسپینا", "respina"]],
  ["پیشگامان", ["پیشگامان", "pishgaman"]],
  ["برتینا", ["برتینا", "bertina"]],
  ["ابر باران", ["ابرباران", "ابر باران", "abrbaran"]]
];

const SERVICE_ALIASES = [
  ["گوگل", ["google", "گوگل"]],
  ["گیت‌هاب", ["github", "گیت هاب", "گیت‌هاب"]],
  ["ویکی‌پدیا", ["wikipedia", "ویکی پدیا", "ویکی‌پدیا"]],
  ["بینگ", ["bing", "بینگ"]],
  ["پلی‌استیشن", ["playstation", "پلی استیشن", "پلی‌استیشن"]],
  ["آپارات", ["aparat", "آپارات"]],
  ["دیوار", ["divar", "دیوار"]],
  ["دیجی‌کالا", ["digikala", "دیجی کالا", "دیجی‌کالا"]]
];

function textValue(value) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function firstString(object, keys) {
  for (const key of keys) {
    const value = object?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function matchAlias(value, aliases) {
  const normalized = value.toLocaleLowerCase("fa").replace(/[\u200c\s_-]+/g, " ");
  for (const [label, variants] of aliases) {
    if (variants.some((variant) => normalized.includes(variant.toLocaleLowerCase("fa")))) return label;
  }
  return "";
}

function statusFromObject(object) {
  const status = firstString(object, ["status", "status_text", "health_status", "state", "health", "availability", "availability_status", "connectivity", "reachability", "result", "condition", "classification", "level"]);
  const statusLower = status.toLocaleLowerCase("fa");
  if (/offline|unavailable|down|blocked|failed|error|غیرفعال|قطع|اختلال شدید|مسدود/.test(statusLower)) return { severity: 3, label: "اختلال زیاد" };
  if (/degraded|partial|unstable|impaired|ناپایدار|اختلال متوسط|اختلال جزئی/.test(statusLower)) return { severity: 2, label: "اختلال نسبی" };
  if (/online|available|reachable|healthy|normal|ok|active|در دسترس|بدون اختلال|فعال/.test(statusLower)) return { severity: 0, label: "عادی" };

  for (const key of ["score", "severity", "level", "disruption", "value"]) {
    const value = object?.[key];
    if (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 4) {
      const severity = value;
      return { severity, label: severity < 0.5 ? "عادی" : severity < 1.5 ? "اختلال جزئی" : severity < 2.5 ? "اختلال متوسط" : severity < 3.5 ? "اختلال زیاد" : "اختلال شدید" };
    }
  }

  for (const key of ["reachable", "is_reachable", "available", "is_available", "is_up", "success", "ok"]) {
    if (typeof object?.[key] === "boolean") {
      return object[key] ? { severity: 0, label: "عادی" } : { severity: 3, label: "اختلال زیاد" };
    }
  }
  return null;
}

function collectRecords(value, records = [], depth = 0) {
  if (!value || typeof value !== "object" || depth > 10) return records;
  if (Array.isArray(value)) {
    for (const item of value) collectRecords(item, records, depth + 1);
    return records;
  }

  const label = firstString(value, [
    "operator", "isp", "isp_name", "ispName", "carrier", "carrier_name", "carrierName", "provider", "provider_name", "network_name", "networkName", "asn_name", "datacenter", "data_center", "site", "point", "name", "title", "label", "location", "probe"
  ]);
  const serviceRaw = firstString(value, [
    "service", "target", "destination", "domain", "service_name", "target_name", "destination_name"
  ]);
  const status = statusFromObject(value);
  const operator = matchAlias(label, OPERATOR_ALIASES);
  const service = matchAlias(serviceRaw, SERVICE_ALIASES);

  if (operator && status) {
    records.push({
      operator,
      service: service || "سرویس نامشخص",
      severity: status.severity,
      status: status.label,
      observed_at: firstString(value, ["observed_at", "timestamp", "updated_at", "created_at", "time", "date"]) || null
    });
  }

  for (const [key, child] of Object.entries(value)) {
    if (child && typeof child === "object") collectRecords(child, records, depth + 1);
  }
  return records;
}

export function normalizeArvanRadar(payload, now = new Date().toISOString()) {
  const records = collectRecords(payload);
  const unique = new Map();
  for (const record of records) {
    const key = [record.operator, record.service, record.observed_at || "", record.status].join("|");
    if (!unique.has(key)) unique.set(key, record);
  }
  const rows = [...unique.values()];
  const byOperator = new Map();
  for (const row of rows) {
    const bucket = byOperator.get(row.operator) || [];
    bucket.push(row);
    byOperator.set(row.operator, bucket);
  }

  const operators = [...byOperator.entries()].map(([name, items]) => {
    const average = items.reduce((sum, item) => sum + item.severity, 0) / items.length;
    const disrupted = items.filter((item) => item.severity >= 1).length;
    const knownServiceCount = new Set(items.filter((item) => item.service !== "سرویس نامشخص").map((item) => item.service)).size;
    const status = disrupted > 0
      ? average < 1.5 ? "اختلال جزئی" : average < 2.5 ? "اختلال متوسط" : average < 3.5 ? "اختلال زیاد" : "اختلال شدید"
      : knownServiceCount < 3
        ? "دادهٔ محدود"
        : "عادی";
    return {
      operator: name,
      status,
      severity: Math.round(average * 100) / 100,
      checked_services: items.length,
      known_service_count: knownServiceCount,
      disrupted_services: disrupted,
      services: items.map(({ service, status: serviceStatus }) => ({ name: service, status: serviceStatus }))
    };
  }).sort((a, b) => a.operator.localeCompare(b.operator, "fa"));

  const disruptedOperators = operators.filter((item) => item.disrupted_services > 0).length;
  const limitedOperators = operators.filter((item) => item.status === "دادهٔ محدود").length;
  const overall = operators.length === 0
    ? "دادهٔ کافی دریافت نشد"
    : disruptedOperators === 0 && limitedOperators > 0
      ? "نمونه‌های موجود برای تأیید سلامت اینترنت کافی نیستند"
      : disruptedOperators === 0
        ? "در نمونه‌های کافی و قابل‌تفسیر نشانهٔ اختلال ثبت نشده"
        : disruptedOperators === operators.length
          ? "در همهٔ اپراتورهای دارای داده نشانهٔ اختلال دیده شد"
          : "اختلال در بخشی از اپراتورهای پایش‌شده";

  return {
    provider: "iranblock_arvancloud",
    observed_at: now,
    status: operators.length ? "available" : "unavailable",
    overall_fa: overall,
    operator_count: operators.length,
    disrupted_operator_count: disruptedOperators,
    operators,
    limitations_fa: "این داده‌ها از نقاط پایش رادار ابرآروان‌اند، نه از سیم‌کارت یا مودم شخص شما. نبود داده به معنی سالم بودن اینترنت نیست."
  };
}

async function readCached(env) {
  if (!env.ATLAS_KV || typeof env.ATLAS_KV.get !== "function") return null;
  try {
    return await env.ATLAS_KV.get(CACHE_KEY, "json");
  } catch (error) {
    console.error("ATLAS_NETWORK_STATUS_CACHE_READ_FAILED", error?.name || "Error");
    return null;
  }
}

function findArrays(value, output = [], depth = 0) {
  if (!value || typeof value !== "object" || depth > 7) return output;
  if (Array.isArray(value)) {
    output.push(value);
    for (const item of value.slice(0, 30)) findArrays(item, output, depth + 1);
    return output;
  }
  for (const child of Object.values(value)) findArrays(child, output, depth + 1);
  return output;
}

function countPayloadRows(payload) {
  if (Array.isArray(payload)) return payload.length;
  const arrays = findArrays(payload).filter((item) => item.length > 0);
  return arrays.length ? Math.max(...arrays.map((item) => item.length)) : 0;
}

function extractObservedAt(payload, depth = 0) {
  if (!payload || typeof payload !== "object" || depth > 6) return null;
  for (const key of ["observed_at", "timestamp", "updated_at", "last_updated", "generated_at", "fetched_at", "updatedAt", "checked_at", "measurement_start_time"]) {
    const value = payload[key];
    if (typeof value === "string" && Number.isFinite(Date.parse(value))) return value;
    if (typeof value === "number" && value > 1_000_000_000) {
      const date = new Date(value > 10_000_000_000 ? value : value * 1000);
      if (Number.isFinite(date.getTime())) return date.toISOString();
    }
  }
  for (const value of Object.values(payload)) {
    if (value && typeof value === "object") {
      const found = extractObservedAt(value, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function compactPayloadFacts(payload) {
  const arrays = findArrays(payload).filter((item) => item.length > 0);
  const rows = arrays.sort((a, b) => b.length - a.length)[0] || [];
  const objects = [];
  const visit = (value, depth = 0) => {
    if (!value || typeof value !== "object" || depth > 7 || objects.length >= 80) return;
    if (Array.isArray(value)) {
      for (const item of value.slice(0, 30)) visit(item, depth + 1);
      return;
    }
    objects.push(value);
    for (const child of Object.values(value)) if (child && typeof child === "object") visit(child, depth + 1);
  };
  visit(payload);
  const fieldNames = [...new Set(objects.flatMap((item) => Object.keys(item)))].slice(0, 40);
  const interesting = [];
  const seen = new Set();
  const keyPattern = /status|state|health|availability|reachable|success|error|failure|blocked|censor|anomal|outage|incident|disrupt|latency|response.?time|rtt|ping|jitter|loss|packet|speed|download|upload|asn|prefix|route|withdraw|timestamp|updated|observed|service|domain|operator|isp|network|score|count|total|severity|signal|confidence|category|test|probe|measurement/i;
  for (const object of objects) {
    for (const [key, value] of Object.entries(object)) {
      if (!keyPattern.test(key) || value === null || typeof value === "object") continue;
      const rendered = String(value).trim();
      if (!rendered || rendered.length > 140) continue;
      const item = key + "=" + rendered;
      if (!seen.has(item)) {
        seen.add(item);
        interesting.push(item);
        if (interesting.length >= 35) break;
      }
    }
    if (interesting.length >= 35) break;
  }
  return {
    row_count: rows.length,
    field_names: fieldNames,
    key_facts: interesting,
    observed_at: extractObservedAt(payload)
  };
}

async function fetchSource(config, fetchImpl) {
  try {
    const response = await fetchImpl(config.url, {
      method: "GET",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) throw new Error("http_" + response.status);
    const contentType = response.headers.get("content-type") || "";
    if (contentType && !contentType.toLowerCase().includes("json")) throw new Error("not_json");
    const payload = await response.json();
    if (payload && typeof payload === "object" && (payload.error || payload.errors) && countPayloadRows(payload) === 0) {
      throw new Error("source_error_payload");
    }
    const facts = compactPayloadFacts(payload);
    return {
      id: config.id,
      label_fa: config.label_fa,
      category: config.category,
      state: "available",
      item_count: facts.row_count,
      observed_at: facts.observed_at,
      interpreted: false,
      facts,
      payload
    };
  } catch (error) {
    console.error("ATLAS_NETWORK_STATUS_SOURCE_FAILED", config.id, error?.name || "Error");
    return {
      id: config.id,
      label_fa: config.label_fa,
      category: config.category,
      state: "unavailable",
      item_count: 0,
      observed_at: null,
      interpreted: false,
      facts: { row_count: 0, field_names: [], key_facts: [], observed_at: null },
      error_code: String(error?.message || "source_failed").slice(0, 80)
    };
  }
}

function buildEvidenceSummary(sources, operators) {
  const findings = [];
  const arvan = sources.find((source) => source.id === "arvancloud");
  if (operators.length) {
    const affected = operators.filter((operator) => operator.disrupted_services > 0);
    if (affected.length) {
      findings.push("رادار ابرآروان برای " + affected.length + " اپراتور نشانهٔ اختلال ثبت کرده؛ این داده، مسیر شخصی بازیکن را اندازه نمی‌گیرد.");
    } else {
      findings.push("رادار ابرآروان " + operators.length + " اپراتور قابل شناسایی دارد؛ وضعیت سلامت فقط با پوشش کافی مقصدها قابل ارزیابی است.");
    }
  } else if (arvan?.state === "available") {
    findings.push("دادهٔ ابرآروان دریافت شد، اما رکورد قابل‌تفسیر برای اپراتور و مقصد از آن استخراج نشد.");
  }
  const access = sources.find((source) => source.id === "connectivity");
  if (access?.state === "available") {
    findings.push("پروب‌های دسترسی سرویس‌ها " + access.item_count + " ردیف داده برگرداندند؛ برای اعلام اختلال باید فیلدهای واقعی موفقیت/شکست و زمان سنجش تفسیر شوند.");
  }
  const outage = sources.find((source) => source.id === "ioda");
  if (outage?.state === "available") {
    findings.push("سیگنال‌های IODA دریافت شدند؛ صرف دریافت آن‌ها به معنی وجود یا نبود قطعی نیست.");
  }
  const ooni = sources.find((source) => source.id === "ooni");
  if (ooni?.state === "available") {
    findings.push("اندازه‌گیری‌های OONI دریافت شدند؛ نتیجه‌گیری دربارهٔ مسدودسازی باید به آزمون، دامنه، زمان و نمونه‌های داخل کشور وابسته باشد.");
  }
  if (!findings.length) findings.push("دادهٔ خام دریافت شد، اما هنوز هیچ سیگنال قابل اتکایی برای تشخیص قطعی یا پیشنهاد مسیر از آن استخراج نشده است.");
  return findings.slice(0, 4);
}

function buildRuleBasedRecommendations(sources, operators) {
  const recommendations = [];
  const unavailable = sources.filter((source) => source.state !== "available");
  if (unavailable.length) {
    recommendations.push("نتیجه‌گیری را تا بازیابی منابع ناقص قطعی نکن؛ " + unavailable.map((source) => source.label_fa).slice(0, 2).join(" و ") + " فعلاً داده ندادند.");
  }
  const affected = operators.filter((operator) => operator.disrupted_services > 0);
  if (affected.length) {
    recommendations.push("اگر بازی مشکل دارد، همان مقصد را یک بار با اینترنت اپراتور دیگر مقایسه کن؛ این مقایسه کمک می‌کند مشکل عمومی یا وابسته به مسیر اپراتور را جدا کنیم.");
  } else {
    recommendations.push("برای پیشنهاد مسیر واقعی، از همان دستگاه یک آزمون بازی/سرور انجام بده و نتیجه را با یک اتصال مستقل (مثلاً اینترنت موبایل در برابر ثابت) مقایسه کن.");
  }
  recommendations.push("فعلاً DNS یا VPN را خودکار تغییر نده؛ قبل از توصیهٔ آن‌ها باید شواهد مشخصی از DNS، مسدودسازی یا تفاوت مسیر داشته باشیم.");
  return recommendations.slice(0, 3);
}

async function summarizeWithWorkersAI(env, evidence) {
  if (!env?.AI || typeof env.AI.run !== "function") return null;
  const model = "@cf/qwen/qwen3-30b-a3b-fp8";
  const prompt = [
    "نقش: تحلیل‌گر شواهد شبکه برای سامانهٔ اطلس، پاسخ فقط فارسی و دقیق.",
    "فقط از JSON شواهد داده‌شده استفاده کن. هرگز عدد، وضعیت، علت یا اندازه‌گیری نساز.",
    "دریافت موفق HTTP/JSON مساوی سلامت شبکه نیست. دادهٔ قدیمی، خالی یا با schema ناشناخته را به عنوان سلامت تفسیر نکن.",
    "منابع از نقاط دید متفاوت‌اند و هیچ‌کدام به‌تنهایی پینگ/جیتر/افت بستهٔ دستگاه بازیکن را اندازه نمی‌گیرند.",
    "خروجی فقط JSON معتبر با کلیدهای summary (رشته کوتاه)، findings (آرایه حداکثر 3 رشته)، recommendations (آرایه حداکثر 3 رشته)، confidence (یکی از کم، متوسط، بالا) باشد.",
    "پیشنهادها باید کم‌خطر و مبتنی بر شواهد باشند. اگر شواهد کافی نیست، دقیقاً بگو چه آزمونی لازم است؛ DNS/VPN را بدون شاهد تجویز نکن.",
    "شواهد:",
    JSON.stringify(evidence)
  ].join("\n\n");
  try {
    const result = await env.AI.run(model, {
      prompt,
      max_tokens: 650,
      temperature: 0.15,
      top_p: 0.8,
      enable_thinking: false
    });
    const text = String(result?.response || result?.result?.response || "").trim();
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart < 0 || jsonEnd <= jsonStart) return null;
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    if (typeof parsed.summary !== "string" || !parsed.summary.trim()) return null;
    const validConfidence = ["کم", "متوسط", "بالا"].includes(parsed.confidence) ? parsed.confidence : "کم";
    return {
      summary: parsed.summary.trim().slice(0, 500),
      findings: Array.isArray(parsed.findings) ? parsed.findings.filter((item) => typeof item === "string").slice(0, 3).map((item) => item.slice(0, 280)) : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.filter((item) => typeof item === "string").slice(0, 3).map((item) => item.slice(0, 280)) : [],
      confidence: validConfidence,
      model
    };
  } catch (error) {
    console.error("ATLAS_NETWORK_AI_SUMMARY_FAILED", error?.name || "Error");
    return null;
  }
}

export async function getNetworkStatus(env = {}, options = {}) {
  const nowMs = Date.now();
  const cached = await readCached(env);
  if (cached?.fetched_at && nowMs - Date.parse(cached.fetched_at) < CACHE_TTL_SECONDS * 1000) {
    return { ...cached, cache: "hit" };
  }

  const fetchImpl = options.fetchImpl || fetch;
  const fetchedSources = await Promise.all(SOURCE_CONFIG.map((config) => fetchSource(config, fetchImpl)));
  const sourceAvailableCount = fetchedSources.filter((source) => source.state === "available").length;
  const allSourcesFailed = sourceAvailableCount === 0;
  const arvanPayload = fetchedSources.find((source) => source.id === "arvancloud")?.payload;
  const interpreted = arvanPayload ? normalizeArvanRadar(arvanPayload) : null;
  const operators = interpreted?.operators || [];
  const sourceEvidence = fetchedSources.map(({ payload, ...source }) => source);
  const sources = sourceEvidence.map((source) => source.id === "arvancloud" && (interpreted?.operator_count || 0) > 0
    ? { ...source, interpreted: true, note_fa: "ساختار دادهٔ ابرآروان تفسیر شد؛ اعتبار نتیجه به تازگی و تعداد مقصدهای شناخته‌شده وابسته است." }
    : source);
  const findings = buildEvidenceSummary(sources, operators);
  const recommendations = buildRuleBasedRecommendations(sources, operators);
  const evidence = {
    generated_at: new Date().toISOString(),
    available_sources: sourceAvailableCount,
    total_sources: SOURCE_CONFIG.length,
    sources: sources.map((source) => ({
      id: source.id,
      name: source.label_fa,
      category: source.category,
      state: source.state,
      row_count: source.item_count,
      observed_at: source.observed_at,
      fields: source.facts.field_names,
      facts: source.facts.key_facts
    })),
    operators: operators.map((operator) => ({
      name: operator.operator,
      status: operator.status,
      checked_services: operator.checked_services,
      known_service_count: operator.known_service_count,
      disrupted_services: operator.disrupted_services,
      services: operator.services.slice(0, 8)
    })),
    findings,
    recommendations,
    limits: [
      "این داده‌ها عمومی‌اند و از چند نقطهٔ پایش مستقل می‌آیند.",
      "پینگ، جیتر و افت بستهٔ دستگاه بازیکن هنوز از خود دستگاه اندازه‌گیری نشده‌اند.",
      "دریافت موفق یک منبع، سلامت شبکه را ثابت نمی‌کند."
    ]
  };
  const aiSummary = await summarizeWithWorkersAI(env, evidence);
  const result = {
    provider: "iranblock_multi_source",
    observed_at: new Date().toISOString(),
    fetched_at: new Date().toISOString(),
    status: allSourcesFailed ? "unavailable" : "available",
    overall_fa: aiSummary?.summary || (allSourcesFailed
      ? "منابع پایش فعلاً دادهٔ قابل دریافت ندادند"
      : interpreted?.status === "available" && operators.length
        ? interpreted.overall_fa
        : "داده‌ها جمع‌آوری و بررسی اولیه شدند؛ برای انتخاب مسیر واقعی بازی، هنوز اندازه‌گیری از اتصال خود بازیکن لازم است."),
    analysis_provider: aiSummary ? "cloudflare_workers_ai" : "rule_based_fallback",
    analysis_model: aiSummary?.model || null,
    confidence: aiSummary?.confidence || "کم",
    findings_fa: aiSummary?.findings?.length ? aiSummary.findings : findings,
    recommendations_fa: aiSummary?.recommendations?.length ? aiSummary.recommendations : recommendations,
    operator_count: operators.length,
    disrupted_operator_count: operators.filter((item) => item.disrupted_services > 0).length,
    operators,
    source_count: SOURCE_CONFIG.length,
    source_available_count: sourceAvailableCount,
    sources,
    limitations_fa: "این‌ها داده‌های عمومی از چند نقطهٔ پایش مستقل‌اند، نه از سیم‌کارت، مودم یا مسیر واقعی بازی شما. پینگ، جیتر و افت بستهٔ بازی تا وقتی از اتصال بازیکن اندازه‌گیری نشوند، گزارش نمی‌شوند."
  };

  if (allSourcesFailed && cached?.status === "available") {
    return {
      ...cached,
      cache: "stale",
      stale: true,
      warning_fa: "دریافت تازه از هیچ منبعی موفق نشد؛ آخرین دادهٔ ذخیره‌شده نمایش داده می‌شود."
    };
  }
  if (env.ATLAS_KV && typeof env.ATLAS_KV.put === "function") {
    try {
      await env.ATLAS_KV.put(CACHE_KEY, JSON.stringify(result), { expirationTtl: 3600 });
    } catch (error) {
      console.error("ATLAS_NETWORK_STATUS_CACHE_WRITE_FAILED", error?.name || "Error");
    }
  }
  return { ...result, cache: "miss" };
}

export function formatNetworkStatusFa(data) {
  if (!data || data.status !== "available") {
    return [
      "🌐 وضعیت اینترنت",
      "",
      data?.overall_fa || "وضعیت فعلی قابل دریافت نیست",
      data?.limitations_fa || "دادهٔ معتبر فعلاً در دسترس نیست.",
      data?.fetched_at ? "آخرین دریافت: " + data.fetched_at : ""
    ].filter(Boolean).join("\n");
  }

  const lines = [
    "🌐 وضعیت اینترنت",
    "",
    data.overall_fa,
    "",
    "🔎 جمع‌بندی شواهد"
  ];
  for (const finding of (data.findings_fa || []).slice(0, 3)) lines.push("• " + finding);
  lines.push("", "🧭 پیشنهادهای بعدی");
  for (const recommendation of (data.recommendations_fa || []).slice(0, 3)) lines.push("• " + recommendation);
  if (data.operators?.length) {
    lines.push("", "📶 اپراتورهای قابل‌شناسایی");
    for (const operator of data.operators.slice(0, 8)) {
      const icon = operator.disrupted_services > 0 ? "🟠" : operator.status === "دادهٔ محدود" ? "⚪️" : "🟢";
      lines.push(icon + " " + operator.operator + ": " + operator.status +
        " (" + operator.disrupted_services + "/" + operator.checked_services + " مقصد دارای نشانهٔ اختلال)");
    }
  }
  if (data.sources?.length) lines.push("", "📡 منابع (" + data.source_available_count + "/" + data.source_count + ")");
  for (const source of data.sources || []) {
    const icon = source.state === "available" ? "🟢" : "⚪️";
    const detail = source.state === "available"
      ? (source.item_count ? source.item_count + " ردیف" : "پاسخ دریافت شد؛ دادهٔ ردیفی شناسایی نشد") +
        (source.observed_at ? "؛ زمان داده: " + source.observed_at : "")
      : "داده در دسترس نیست";
    lines.push(icon + " " + source.label_fa + ": " + detail);
  }
  lines.push("");
  lines.push("اطمینان تحلیل: " + (data.confidence || "کم") + "؛ موتور تحلیل: " + (data.analysis_provider === "cloudflare_workers_ai" ? "مدل رایگان Cloudflare Workers AI" : "قواعد محلی"));
  if (data.stale) lines.push(data.warning_fa);
  lines.push(data.limitations_fa);
  if (data.fetched_at) lines.push("آخرین دریافت: " + data.fetched_at);
  return lines.join("\n");
}

export async function handleNetworkStatus(request, env = {}, options = {}) {
  const url = new URL(request.url);
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "x-content-type-options": "nosniff"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...headers,
        "access-control-allow-methods": "GET, OPTIONS",
        "access-control-allow-headers": "content-type"
      }
    });
  }
  if (url.pathname !== "/api/v1/network-status") {
    return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers });
  }
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...headers, allow: "GET, OPTIONS" }
    });
  }
  const result = await getNetworkStatus(env, options);
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...headers, "cache-control": "public, max-age=60" }
  });
}
