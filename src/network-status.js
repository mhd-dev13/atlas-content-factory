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

function countPayloadRows(payload) {
  if (Array.isArray(payload)) return payload.length;
  if (!payload || typeof payload !== "object") return 0;
  for (const key of ["data", "items", "results", "records", "measurements", "signals", "services", "networks", "sources"]) {
    if (Array.isArray(payload[key])) return payload[key].length;
  }
  return 0;
}

function extractObservedAt(payload, depth = 0) {
  if (!payload || typeof payload !== "object" || depth > 5) return null;
  for (const key of ["observed_at", "timestamp", "updated_at", "last_updated", "generated_at", "fetched_at", "updatedAt"]) {
    const value = payload[key];
    if (typeof value === "string" && Number.isFinite(Date.parse(value))) return value;
  }
  for (const value of Object.values(payload)) {
    if (value && typeof value === "object") {
      const found = extractObservedAt(value, depth + 1);
      if (found) return found;
    }
  }
  return null;
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
    const rows = countPayloadRows(payload);
    if (payload && typeof payload === "object" && (payload.error || payload.errors) && rows === 0) {
      throw new Error("source_error_payload");
    }
    return {
      id: config.id,
      label_fa: config.label_fa,
      category: config.category,
      state: "available",
      item_count: rows,
      observed_at: extractObservedAt(payload),
      interpreted: false,
      note_fa: "داده دریافت شد؛ تا زمان نگاشت اختصاصی ساختار این منبع، از آن نتیجهٔ سلامت یا اختلال ساخته نمی‌شود."
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
      note_fa: "این منبع در این نوبت دادهٔ قابل استفاده نداد."
    };
  }
}

export async function getNetworkStatus(env = {}, options = {}) {
  const nowMs = Date.now();
  const cached = await readCached(env);
  if (cached?.fetched_at && nowMs - Date.parse(cached.fetched_at) < CACHE_TTL_SECONDS * 1000) {
    return { ...cached, cache: "hit" };
  }

  const fetchImpl = options.fetchImpl || fetch;
  const sources = await Promise.all(SOURCE_CONFIG.map((config) => fetchSource(config, fetchImpl)));
  const sourceAvailableCount = sources.filter((source) => source.state === "available").length;
  const allSourcesFailed = sourceAvailableCount === 0;
  const result = {
    provider: "iranblock_multi_source",
    observed_at: new Date().toISOString(),
    fetched_at: new Date().toISOString(),
    status: allSourcesFailed ? "unavailable" : "available",
    overall_fa: allSourcesFailed
      ? "منابع پایش فعلاً دادهٔ قابل دریافت ندادند"
      : "داده از چند منبع مستقل دریافت شد، اما هنوز به شواهد قابل‌تفسیر برای پیشنهاد مسیر اتصال بازی تبدیل نشده است",
    operator_count: 0,
    disrupted_operator_count: 0,
    operators: [],
    source_count: SOURCE_CONFIG.length,
    source_available_count: sourceAvailableCount,
    sources,
    limitations_fa: "این‌ها داده‌های عمومی از چند نقطهٔ پایش مستقل‌اند، نه از سیم‌کارت، مودم یا مسیر واقعی بازی شما. دریافت موفق یک منبع به معنی سالم بودن اینترنت نیست؛ پینگ، جیتر و افت بستهٔ بازی تا وقتی از اتصال بازیکن اندازه‌گیری نشوند، گزارش نمی‌شوند."
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
    ""
  ];
  for (const operator of (data.operators || []).slice(0, 10)) {
    const icon = operator.disrupted_services > 0 ? "🟠 " : operator.status === "دادهٔ محدود" ? "⚪️ " : "🟢 ";
    lines.push(
      icon + operator.operator + ": " + operator.status +
      " (" + operator.disrupted_services + "/" + operator.checked_services + " مقصد دارای نشانهٔ اختلال)"
    );
    const disrupted = operator.services.filter((service) => service.status !== "عادی");
    if (disrupted.length) {
      lines.push("   موارد: " + disrupted.map((service) => service.name + " — " + service.status).join("، "));
    }
  }
  if (data.sources?.length) {
    lines.push("");
    lines.push("منابع مستقل: " + data.source_available_count + "/" + data.source_count + " منبع پاسخ داد");
    for (const source of data.sources.filter((item) => item.state !== "available").slice(0, 3)) {
      lines.push("⚪️ " + source.label_fa + ": داده در دسترس نیست");
    }
  }
  lines.push("");
  if (data.stale) lines.push(data.warning_fa);
  lines.push(data.limitations_fa);
  if (data.fetched_at) lines.push("آخرین به‌روزرسانی: " + data.fetched_at);
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
