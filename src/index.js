import { routeUpdate } from "./router.js";
import { handleGameConnect } from "./game-connect.js";
import { GAME_CONNECT_HTML } from "./game-connect-ui.js";
import { handleNetworkStatus } from "./network-status.js";

const SECURITY_HEADERS = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "content-security-policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: https:; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
};

function textResponse(body, status = 200, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      ...SECURITY_HEADERS,
      ...extraHeaders
    }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Serve the Persian mobile UI; security headers apply to HTML responses.
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(GAME_CONNECT_HTML, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          ...SECURITY_HEADERS
        }
      });
    }

    if (url.pathname === "/api/v1/network-status") {
      return handleNetworkStatus(request, env);
    }

    if (url.pathname === "/health" || url.pathname.startsWith("/api/v1/")) {
      return handleGameConnect(request, env);
    }

    // If configured, Telegram's secret header must match before parsing the update.
    // This is backwards-compatible with installations that have not configured it yet.
    if (request.method === "POST" && env?.TELEGRAM_WEBHOOK_SECRET) {
      const suppliedSecret = request.headers.get("x-telegram-bot-api-secret-token") || "";
      if (suppliedSecret !== env.TELEGRAM_WEBHOOK_SECRET) {
        return textResponse("Forbidden", 403);
      }
    }

    if (request.method !== "POST") {
      return textResponse("ATLAS CONTENT FACTORY 🤖\nStatus: ONLINE\nVersion: 2.0.0");
    }

    try {
      const update = await request.json();
      if (!update || typeof update !== "object" || Array.isArray(update)) {
        return textResponse("Bad Request", 400);
      }
      await routeUpdate(update, env);
      return textResponse("OK");
    } catch (error) {
      // Do not log stack traces or request bodies, which may contain user content.
      console.error("ATLAS_WEBHOOK_ERROR", error?.name || "Error");
      // Telegram should not retry malformed or internally failed updates indefinitely.
      return textResponse("OK");
    }
  }
};
