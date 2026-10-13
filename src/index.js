import { routeUpdate } from "./router.js";
import { handleGameConnect } from "./game-connect.js";
import { GAME_CONNECT_HTML } from "./game-connect-ui.js";

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
          "referrer-policy": "strict-origin-when-cross-origin"
        }
      });
    }

    // Keep preflight handling scoped to the Game Connect API.
    if (
      url.pathname === "/health" ||
      url.pathname.startsWith("/api/v1/") 
    ) {
      return handleGameConnect(request, env);
    }

    if (request.method === "OPTIONS" && url.pathname.startsWith("/api/v1/")) {
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
