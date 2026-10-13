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
          "referrer-policy": "strict-origin-when-cross-origin"
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
