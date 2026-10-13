# Atlas Game Connect MVP

A Persian-language diagnostic API isolated behind `/health` and `/api/v1/*`. The existing Telegram/content handler remains available for requests outside these routes.

## Endpoints

- `GET /health` — health and version.
- `GET /api/v1/games` — supported service catalog; probe URLs are not returned.
- `POST /api/v1/diagnostics` — accepts `{"game":"steam"}`, `{"game":"epic-games"}`, or `{"game":"riot-games"}`.

Diagnostic sessions are stored in the existing `ATLAS_KV` binding for 30 minutes when it is available. A KV write failure is logged without exposing details to clients.

## Important measurement limits

The current access check is an HTTP request from the Cloudflare Worker to an allowlisted official website. It is **not** a check from the user's device or Iranian ISP. HTTP 403 means the endpoint responded; it is not proof of reachability to game servers and not proof of government blocking. A timeout is reported as inconclusive.

The API deliberately reports in-game latency, jitter, and packet loss as unavailable. Worker-to-website request duration is not presented as player ping. Accurate user-path measurements require a client-side or dedicated probe design that handles CORS, supported protocols, endpoint ownership, and measurement integrity.

## Development checks

- `npm test` — unit tests using Node's built-in test runner.
- `npm run check` — existing Wrangler dry-run deployment validation.

No deployment, production secret, or Wrangler binding changes are included.
