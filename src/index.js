import { routeUpdate } from "./router.js";
import { handleGameConnect } from "./game-connect.js";
import { GAME_CONNECT_HTML } from "./game-connect-ui.js";
import { handleNetworkStatus } from "./network-status.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Serve the Persian mobile UI on GET /; preserve Telegram's POST / webhook.
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(GAME_CONNECT_HTML, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
          "x-frame-options": "DENY",
          "referrer-policy": "strict-origin-when-cross-origin",
          "permissions-policy": "camera=(), microphone=(), geolocation=()",
          "content-security-policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: https:; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
        }
      });
    }

    // Keep network status as a separate adapter while sharing the same API host.
    if (url.pathname === "/api/v1/network-status") {
      return handleNetworkStatus(request, env);
    }

    // Route Game Connect endpoints and their preflight requests to the API.
    if (
      url.pathname === "/health" ||
      url.pathname.startsWith("/api/v1/")
    ) {
      return handleGameConnect(request, env);
    }

    if (request.method !== "POST") {
      return new Response(
        "ATLAS CONTENT FACTORY 🤖\nStatus: ONLINE\nVersion: 2.0.0",
        {
          headers: {
            "content-type": "text/plain; charset=utf-8"
          }
        }
      );
    }

    // If a Telegram webhook secret is configured, reject forged POSTs before parsing.
    // Keeping this conditional preserves existing installations until the secret is set.
    if (request.method === "POST" && env?.TELEGRAM_WEBHOOK_SECRET) {
      const suppliedSecret = request.headers.get("x-telegram-bot-api-secret-token") || "";
      if (suppliedSecret !== env.TELEGRAM_WEBHOOK_SECRET) {
        return new Response("Forbidden", {
          status: 403,
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "no-store",
            "x-content-type-options": "nosniff"
          }
        });
      }
    }

    try {
      const update = await request.json();
      await routeUpdate(update, env);
      return new Response("OK");
    } catch (error) {
      console.error("ATLAS_ERROR:", error?.stack || error);
      return new Response("OK");
    }
  }
};
