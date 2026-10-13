# Atlas Game Connect MVP

A Persian-language diagnostic API isolated behind `/health` and `/api/v1/*`. The existing Telegram/content handler remains available for requests outside these routes.

## Endpoints

- `GET /health` — health and version.
- `GET /api/v1/games` — supported service catalog; probe URLs are not returned.
- `POST /api/v1/diagnostics` — accepts `{"game":"steam"}`, `{"game":"epic-games"}`, or `{"game":"riot-games"}`.

Diagnostic sessions are stored in the existing `ATLAS_KV` binding for 30 minutes. Creation fails with `503 storage_unavailable` if the binding is missing or the write fails; the API never returns `201` for a result it could not persist.

## Request limits and abuse protection

- Diagnostic request bodies are capped at 2,048 bytes. The handler reads the stream incrementally and cancels it as soon as the limit is crossed; `Content-Length` is only an early-rejection hint, not the enforcement mechanism.
- `DIAGNOSTIC_LIMITER` is a Cloudflare Workers Rate Limiting binding configured in `wrangler.jsonc`: 10 requests per 60 seconds per client IP, with separate buckets for creation and retrieval. If the binding is missing or errors, diagnostic requests fail closed with `503`; over-limit requests receive `429` and `Retry-After: 60`.
- The Worker binding is location-local / approximate, not a globally exact quota. For a public production launch, add a Cloudflare WAF rate-limiting rule at the zone/hostname edge as a second layer, and tune thresholds against real traffic. Do not trust client-supplied forwarding headers; the Worker uses Cloudflare's `CF-Connecting-IP` header.
- If managing bindings in the Cloudflare dashboard instead of deploying the checked-in Wrangler config, add a Workers Rate Limiting binding named `DIAGNOSTIC_LIMITER`, with limit `10`, period `60` seconds, and a namespace ID unique in the account. The checked-in `wrangler.jsonc` already declares this binding for Wrangler-based deployments.

## Important measurement limits

The current access check is an HTTP request from the Cloudflare Worker to an allowlisted official website. It is **not** a check from the user's device or Iranian ISP. HTTP 403 means the endpoint responded; it is not proof of reachability to game servers and not proof of government blocking. A timeout is reported as inconclusive.

The API deliberately reports in-game latency, jitter, and packet loss as unavailable. Worker-to-website request duration is not presented as player ping. Accurate user-path measurements require a client-side or dedicated probe design that handles CORS, supported protocols, endpoint ownership, and measurement integrity.

## Development checks

- `npm test` — unit tests using Node's built-in test runner.
- `npm run check` — existing Wrangler dry-run deployment validation.

No deployment, production secret, or Wrangler binding changes are included.
