import { routeUpdate } from "./router.js";
import { handleGameConnect } from "./game-connect.js";
import { GAME_CONNECT_HTML } from "./game-connect-ui.js";
import { handleNetworkStatus } from "./network-status.js";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff"
};

function jsonError(error, status) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: JSON_HEADERS
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Serve the Persian mobile UI; never expose secrets in public responses.
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(GAME_CONNECT_HTML, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
          "referrer-policy": "strict-origin-when-cross-origin"
        }
      });
    }

    if (url.pathname === "/api/v1/network-status") {
      return handleNetworkStatus(request, env);
    }

    if (url.pathname === "/health" || url.pathname.startsWith("/api/v1/")) {
      return handleGameConnect(request, env);
    }

    // Telegram webhook is the only accepted write route.
    if (url.pathname !== "/" || request.method !== "POST") {
      return jsonError("not_found", 404);
    }

    // Configure TELEGRAM_WEBHOOK_SECRET in Worker secrets before deployment
    // and set the same value as Telegram's webhook secret_token.
    const expectedSecret = env?.TELEGRAM_WEBHOOK_SECRET;
    if (typeof expectedSecret !== "string" || expectedSecret.length < 1) {
      console.error("ATLAS_WEBHOOK_SECRET_NOT_CONFIGURED");
      return jsonError("webhook_not_configured", 503);
    }

    const providedSecret = request.headers.get("x-telegram-bot-api-secret-token");
    if (typeof providedSecret !== "string" || providedSecret !== expectedSecret) {
      return jsonError("unauthorized", 401);
    }

    let update;
    try {
      update = await request.json();
    } catch {
      return jsonError("invalid_json", 400);
    }

    try {
      await routeUpdate(update, env);
      return new Response("OK", {
        headers: { "cache-control": "no-store" }
      });
    } catch (error) {
      // Do not log exception messages/stacks: they can contain request or provider data.
      console.error("ATLAS_WEBHOOK_PROCESSING_FAILED", error?.name || "Error");
      // Acknowledge the update to avoid an uncontrolled retry storm. Failed updates
      // are observable by a stable code only; durable retry handling is a follow-up.
      return new Response("OK", {
        headers: { "cache-control": "no-store" }
      });
    }
  }
};
