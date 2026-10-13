const SOURCE_URLS = [
  "https://iranblock.com/api/v1/isp/current",
  "https://iranblock.com/api/v1/connectivity/isp-site-matrix",
  "https://iranblock.com/api/v1/arvancloud/latest"
];
const CACHE_KEY = "atlas:network-status:arvancloud:v1";
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
    const status = average < 0.5 ? "عادی" : average < 1.5 ? "اختلال جزئی" : average < 2.5 ? "اختلال متوسط" : average < 3.5 ? "اختلال زیاد" : "اختلال شدید";
    return {
      operator: name,
      status,
      severity: Math.round(average * 100) / 100,
      checked_services: items.length,
      disrupted_services: disrupted,
      services: items.map(({ service, status: serviceStatus }) => ({ name: service, status: serviceStatus }))
    };
  }).sort((a, b) => a.operator.localeCompare(b.operator, "fa"));

  const disruptedOperators = operators.filter((item) => item.disrupted_services > 0).length;
  const overall = operators.length === 0
    ? "دادهٔ کافی دریافت نشد"
    : disruptedOperators === 0
      ? "در نمونه‌های موجود اختلال ثبت نشده"
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

export async function getNetworkStatus(env = {}, options = {}) {
  const nowMs = Date.now();
  const cached = await readCached(env);
  if (cached?.fetched_at && nowMs - Date.parse(cached.fetched_at) < CACHE_TTL_SECONDS * 1000) {
    return { ...cached, cache: "hit" };
  }

  const fetchImpl = options.fetchImpl || fetch;
  let lastSourceError = "no_source_attempted";
  for (const sourceUrl of SOURCE_URLS) {
    try {
      const response = await fetchImpl(sourceUrl, {
        method: "GET",
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(5000)
      });
      if (!response.ok) throw new Error("upstream_http_" + response.status);
      const contentType = response.headers.get("content-type") || "";
      if (contentType && !contentType.toLowerCase().includes("json")) throw new Error("upstream_not_json");
      const payload = await response.json();
      const normalized = normalizeArvanRadar(payload);
      if (normalized.status !== "available") throw new Error("upstream_schema_unrecognized");

      const result = {
        ...normalized,
        provider: sourceUrl.includes("/isp/current")
          ? "iranblock_isp_current"
          : sourceUrl.includes("/connectivity/isp-site-matrix")
            ? "iranblock_connectivity_isp_site_matrix"
            : "iranblock_arvancloud",
        fetched_at: new Date().toISOString(),
        cache: "miss"
      };
      if (env.ATLAS_KV && typeof env.ATLAS_KV.put === "function") {
        try {
          await env.ATLAS_KV.put(CACHE_KEY, JSON.stringify(result), { expirationTtl: 3600 });
        } catch (error) {
          console.error("ATLAS_NETWORK_STATUS_CACHE_WRITE_FAILED", error?.name || "Error");
        }
      }
      return result;
    } catch (error) {
      lastSourceError = error?.message || error?.name || "unknown_error";
      console.error("ATLAS_NETWORK_STATUS_SOURCE_FAILED", sourceUrl.split("/api/v1/")[1] || "unknown_source", lastSourceError);
    }
  }
  try {
    throw new Error(lastSourceError);
  } catch (error) {
    if (cached?.status === "available") {
      return {
        ...cached,
        cache: "stale",
        stale: true,
        warning_fa: "دریافت تازه انجام نشد؛ آخرین دادهٔ ذخیره‌شده نمایش داده می‌شود."
      };
    }
    return {
      provider: "iranblock_arvancloud",
      observed_at: new Date().toISOString(),
      fetched_at: null,
      status: "unavailable",
      overall_fa: "وضعیت فعلی قابل دریافت نیست",
      operator_count: 0,
      disrupted_operator_count: 0,
      operators: [],
      limitations_fa: "منبع داده پاسخ قابل استفاده نداد؛ این وضعیت به معنی قطعی یا سالم بودن اینترنت نیست."
    };
  }
}

export function formatNetworkStatusFa(data) {
  if (!data || data.status !== "available" || !data.operators?.length) {
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
  for (const operator of data.operators.slice(0, 10)) {
    lines.push(
      (operator.disrupted_services > 0 ? "🟠 " : "🟢 ") +
      operator.operator + ": " + operator.status +
      " (" + operator.disrupted_services + "/" + operator.checked_services + " مقصد دارای نشانهٔ اختلال)"
    );
    const disrupted = operator.services.filter((service) => service.status !== "عادی");
    if (disrupted.length) {
      lines.push("   موارد: " + disrupted.map((service) => service.name + " — " + service.status).join("، "));
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
