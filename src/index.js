import { routeUpdate } from "./router.js";

export default {
  async fetch(request, env, ctx) {
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
      console.error(
        "ATLAS_ERROR:",
        error?.stack || error
      );

      return new Response("OK");
    }
  }
};
