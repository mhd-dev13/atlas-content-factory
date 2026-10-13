import { routeUpdate } from "./router.js";
import { handleGameConnect } from "./game-connect.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Keep the legacy Telegram webhook at POST / while routing the new API separately.
    if (
      url.pathname === "/health" ||
      url.pathname.startsWith("/api/v1/") ||
      request.method === "OPTIONS"
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
