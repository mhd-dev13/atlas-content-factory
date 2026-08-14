export default {
  async fetch(request, env, ctx) {
    return new Response(
      "ATLAS CONTENT FACTORY 🤖\nStatus: ONLINE\nVersion: 1.0.0",
      {
        headers: {
          "content-type": "text/plain; charset=utf-8"
        }
      }
    );
  }
};
