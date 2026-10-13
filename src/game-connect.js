const GAMES = Object.freeze([
  { id: "steam", nameFa: "استیم", platform: ["pc"], endpoint: "https://store.steampowered.com/", endpointLabelFa: "وب‌سایت فروشگاه استیم" },
  { id: "epic-games", nameFa: "اپیک گیمز", platform: ["pc"], endpoint: "https://store.epicgames.com/", endpointLabelFa: "وب‌سایت فروشگاه اپیک گیمز" },
  { id: "riot-games", nameFa: "ریوت گیمز", platform: ["pc"], endpoint: "https://www.riotgames.com/", endpointLabelFa: "وب‌سایت رسمی ریوت گیمز" }
]);

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function round(value) {
  return Math.round(value * 100) / 100;
}

async function readBodyLimited(request, maxBytes) {
  const contentLength = request.headers.get("content-length");
  if (/^\d+$/.test(contentLength || "") && Number(contentLength) > maxBytes) {
    return { tooLarge: true };
  }
  if (!request.body) return { text: "" };

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let byteLength = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > maxBytes) {
        try { await reader.cancel(); } catch {}
        return { tooLarge: true };
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return { text };
  } catch (error) {
    try { await reader.cancel(); } catch {}
    throw error;
  }
}

async function enforceDiagnosticRateLimit(request, env, bucket) {
  const limiter = env.DIAGNOSTIC_LIMITER;
  if (!limiter || typeof limiter.limit !== "function") {
    return json({
      error: "rate_limit_unavailable",
      message_fa: "سرویس محافظت از درخواست‌ها پیکربندی نشده است."
    }, 503);
  }

  const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
  try {
    const result = await limiter.limit({ key: bucket + ":" + clientIp });
    if (result?.success !== true) {
      const response = json({
        error: "rate_limited",
        message_fa: "تعداد درخواست‌ها بیش از حد مجاز است؛ کمی بعد دوباره تلاش کنید."
      }, 429);
      response.headers.set("retry-after", "60");
      return response;
    }
    return null;
  } catch (error) {
    console.error("ATLAS_GAME_CONNECT_RATE_LIMIT_FAILED", error?.name || "Error");
    return json({
      error: "rate_limit_unavailable",
      message_fa: "سرویس محافظت از درخواست‌ها موقتاً در دسترس نیست."
    }, 503);
  }
}

export function calculateQuality(samples = []) {
  const valid = samples.filter((value) => typeof value === "number" && Number.isFinite(value) && value >= 0);
  if (valid.length < 2) {
    return { state: "insufficient_data", sample_count: valid.length, latency_ms: valid.length === 1 ? round(valid[0]) : null, jitter_ms: null, packet_loss_pct: null };
  }
  const sorted = [...valid].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  const differences = valid.slice(1).map((value, index) => Math.abs(value - valid[index]));
  const jitter = differences.reduce((sum, value) => sum + value, 0) / differences.length;
  return { state: "measured", sample_count: valid.length, latency_ms: round(median), jitter_ms: round(jitter), packet_loss_pct: null };
}

export function classifyAccess(check) {
  if (check?.ok === true) return "reachable";
  if (check?.timedOut === true) return "inconclusive";
  if (check?.ok === false) return "unreachable";
  return "inconclusive";
}

async function checkEndpoint(game, fetchImpl = fetch) {
  const started = Date.now();
  try {
    const response = await fetchImpl(game.endpoint, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(4000)
    });
    return {
      state: classifyAccess({ ok: true }),
      http_status: response.status,
      duration_ms: Date.now() - started,
      observer: "cloudflare_worker",
      note_fa: "این بررسی از سرور اطلس انجام شده و وضعیت اتصال دستگاه شما در ایران را ثابت نمی‌کند."
    };
  } catch (error) {
    const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
    return {
      state: classifyAccess({ ok: false, timedOut }),
      http_status: null,
      duration_ms: Date.now() - started,
      observer: "cloudflare_worker",
      error_type: timedOut ? "timeout" : "network_error",
      note_fa: "خطای اتصال از سمت سرور اطلس مشاهده شد؛ این نتیجه به‌تنهایی فیلترینگ یا علت مشکل را ثابت نمی‌کند."
    };
  }
}

export async function handleGameConnect(request, env = {}, options = {}) {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();
  if (method === "OPTIONS") return new Response(null, { status: 204, headers: JSON_HEADERS });

  if (url.pathname === "/health" && method === "GET") {
    return json({ status: "ok", service: "atlas-game-connect", version: "0.1.0" });
  }
  if (url.pathname === "/api/v1/games" && method === "GET") {
    return json({ games: GAMES.map(({ id, nameFa, platform, endpointLabelFa }) => ({
      id, name_fa: nameFa, platforms: platform, endpoint_label_fa: endpointLabelFa
    })) });
  }
  const diagnosticMatch = url.pathname.match(/^\/api\/v1\/diagnostics\/([0-9a-f-]{36})$/i);
  if (diagnosticMatch && method === "GET") {
    const rateLimitResponse = await enforceDiagnosticRateLimit(request, env, "read");
    if (rateLimitResponse) return rateLimitResponse;
    if (!env.ATLAS_KV || typeof env.ATLAS_KV.get !== "function") {
      return json({ error: "storage_unavailable", message_fa: "بازیابی نتیجه در حال حاضر در دسترس نیست." }, 503);
    }
    try {
      const saved = await env.ATLAS_KV.get("atlas:game-connect:diagnostic:" + diagnosticMatch[1], "json");
      if (!saved) return json({ error: "diagnostic_not_found", message_fa: "نتیجه‌ای با این شناسه پیدا نشد یا منقضی شده است." }, 404);
      return json(saved);
    } catch (error) {
      console.error("ATLAS_GAME_CONNECT_KV_READ_FAILED", error?.name || "Error");
      return json({ error: "storage_unavailable", message_fa: "بازیابی نتیجه در حال حاضر در دسترس نیست." }, 503);
    }
  }

  if (url.pathname !== "/api/v1/diagnostics") {
    return json({ error: "not_found", message_fa: "مسیر موردنظر پیدا نشد." }, 404);
  }
  if (method !== "POST") {
    return json({ error: "method_not_allowed", message_fa: "این روش درخواست پشتیبانی نمی‌شود." }, 405);
  }

  const rateLimitResponse = await enforceDiagnosticRateLimit(request, env, "create");
  if (rateLimitResponse) return rateLimitResponse;

  let body;
  try {
    const limitedBody = await readBodyLimited(request, 2048);
    if (limitedBody.tooLarge) {
      return json({ error: "payload_too_large", message_fa: "حجم درخواست بیش از حد مجاز است." }, 413);
    }
    body = JSON.parse(limitedBody.text);
  } catch {
    return json({ error: "invalid_json", message_fa: "بدنه درخواست باید JSON معتبر باشد." }, 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body) || typeof body.game !== "string" || body.game.length > 80) {
    return json({ error: "invalid_request", message_fa: "شناسه بازی معتبر نیست." }, 400);
  }
  const game = GAMES.find((item) => item.id === body.game);
  if (!game) return json({ error: "unsupported_game", message_fa: "این بازی هنوز در فهرست پشتیبانی نیست." }, 422);

  if (!env.ATLAS_KV || typeof env.ATLAS_KV.put !== "function") {
    return json({
      error: "storage_unavailable",
      message_fa: "ذخیره نتیجه در حال حاضر در دسترس نیست؛ بررسی انجام نشد."
    }, 503);
  }

  const check = await checkEndpoint(game, options.fetchImpl || fetch);
  const id = crypto.randomUUID();
  const result = {
    id,
    created_at: new Date().toISOString(),
    game: { id: game.id, name_fa: game.nameFa },
    access: {
      state: check.state,
      tested_endpoint_fa: game.endpointLabelFa,
      observer: check.observer,
      http_status: check.http_status,
      duration_ms: check.duration_ms,
      note_fa: check.note_fa
    },
    quality: {
      state: "not_measured",
      latency_ms: null,
      jitter_ms: null,
      packet_loss_pct: null,
      note_fa: "پینگ داخل بازی، جیتر و افت بسته از این بررسی HTTP قابل اندازه‌گیری نیست."
    },
    conclusion_fa: "این نسخه فقط دسترسی وب‌سایت رسمی را از سرور اطلس بررسی می‌کند؛ نتیجه، تشخیص قطعی اتصال بازی از دستگاه شما نیست."
  };

  try {
    await env.ATLAS_KV.put("atlas:game-connect:diagnostic:" + id, JSON.stringify(result), { expirationTtl: 1800 });
  } catch (error) {
    console.error("ATLAS_GAME_CONNECT_KV_WRITE_FAILED", error?.name || "Error");
    return json({
      error: "storage_unavailable",
      message_fa: "ذخیره نتیجه ناموفق بود؛ نتیجه‌ای برای بازیابی ثبت نشد."
    }, 503);
  }
  return json(result, 201);
}
