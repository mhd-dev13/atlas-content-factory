# Atlas Game Connect MVP

A Persian-language diagnostic API isolated behind `/health` and `/api/v1/*`. The existing Telegram/content handler remains available for requests outside these routes.

## Shared bot + website integration

The Telegram bot and Persian website use the same game catalog (`getGameCatalog`) and diagnostic function (`createGameDiagnostic`) in `src/game-connect.js`. The bot menu adds **🎮 بررسی اتصال بازی**, and `/connect` or `/games` opens the same supported-service list. Both surfaces return the same source-aware result schema and save diagnostic records to the same `ATLAS_KV` namespace. Existing content-generation commands remain intact.

Each catalog entry exposes an official source URL, a Persian source label, and an explicit measurement-scope note. Steam's probe is documented by Valve's Steamworks Web API docs; Epic Games and Riot Games checks target their official public sites. These checks only measure the Worker-to-endpoint HTTP response, not in-game connectivity or the user's ISP route.

## Multi-source internet evidence in Telegram

The Telegram bot includes **🌐 وضعیت اینترنت** and supports `/network` and `/internet`. The shared endpoint `GET /api/v1/network-status` checks eight representative public IranBlock API paths in parallel: ArvanCloud Radar, ISP monitoring, direct service-connectivity probes, OONI, IODA, Cloudflare Radar quality, RIPE routing, and source-freshness metadata. Results are cached in the existing `ATLAS_KV` under a versioned multi-source key for up to five minutes. The Telegram summary shows which source endpoints returned data without exposing URLs.

These are eight representative data paths across multiple evidence families, not every one of the 93 documented API endpoints or every raw collector. Each response is reduced to a bounded set of row counts, field names, timestamps, and network-related facts. The ArvanCloud response has a dedicated operator/service normalizer; other families are summarized from their observed fields without pretending that an unverified schema proves connectivity health. A successful HTTP/JSON response is not a healthy-network verdict. No-data, stale data, small samples, and unrecognized schemas must not be interpreted as normal service.

The analysis uses the existing `AI` Cloudflare Workers AI binding and the configured `@cf/qwen/qwen3-30b-a3b-fp8` model when available; no new provider secret is required by this feature. The model receives compact evidence, not full unbounded upstream payloads, and is instructed not to invent measurements. If the AI binding fails or is unavailable, deterministic Persian findings and conservative recommendations are produced instead. The result includes the analysis provider, confidence label, findings, recommendations, source row counts, and any discoverable observation timestamps.

The sources observe different things from different vantage points. OONI includes volunteer measurements from inside Iran; direct connectivity probes can run from outside Iran; IODA and RIPE observe outage and routing signals; Cloudflare quality metrics are not the player's own game path. These evidence families remain distinct. The system does not yet calculate a best route for an individual player; that requires real device-side game/server measurements and validation of each upstream schema.

User-reported DNS/VPN results are deliberately a separate follow-up feature. They should use explicit opt-in reports and/or public, documented measurement datasets with sample counts and freshness, rather than silently scraping arbitrary Google reviews or Telegram conversations.

## Endpoints

- `GET /health` — health and version.
- `GET /api/v1/games` — supported service catalog with official source URLs and measurement scope; internal probe URLs are not returned.
- `POST /api/v1/diagnostics` — accepts `{"game":"steam"}`, `{"game":"epic-games"}`, or `{"game":"riot-games"}`.

Diagnostic sessions are stored in the existing `ATLAS_KV` binding for 30 minutes. Creation fails with `503 storage_unavailable` if the binding is missing or the write fails; the API never returns `201` for a result it could not persist.

## Request limits and abuse protection

- Diagnostic request bodies are capped at 2,048 bytes. The handler reads the stream incrementally and cancels it as soon as the limit is crossed; `Content-Length` is only an early-rejection hint, not the enforcement mechanism.
- `DIAGNOSTIC_LIMITER` is a Cloudflare Workers Rate Limiting binding configured in `wrangler.jsonc`: 10 requests per 60 seconds per client IP, with separate buckets for creation and retrieval. If the binding is missing or errors, diagnostic requests fail closed with `503`; over-limit requests receive `429` and `Retry-After: 60`.
- The Worker binding is location-local / approximate, not a globally exact quota. It keys anonymous traffic by client IP, which can group multiple users behind a mobile-carrier NAT or shared VPN; tune thresholds if legitimate users are affected. Do not trust client-supplied forwarding headers; the Worker uses Cloudflare's `CF-Connecting-IP` header.
- Before deploying, verify that namespace ID `20261013` is unique within the target Cloudflare account; change it in `wrangler.jsonc` if it is already used. Deploy the binding through Wrangler. Cloudflare's Workers Rate Limiting binding is not currently managed from the dashboard; for a second layer, configure a Cloudflare WAF rate-limiting rule for the public hostname in the dashboard.

## Important measurement limits

The current access check is an HTTP request from the Cloudflare Worker to an allowlisted official endpoint. Steam uses Valve's documented public `ISteamWebAPIUtil/GetServerInfo` endpoint rather than the storefront homepage, which may reject automated probes. It is **not** a check from the user's device or Iranian ISP. HTTP 403 is classified as a destination rejection (for example, anti-bot or access policy), not successful access; it is not proof of government blocking. HTTP 429 and 5xx responses are also distinguished from success. A timeout is reported as inconclusive.

The API deliberately reports in-game latency, jitter, and packet loss as unavailable. Worker-to-website request duration is not presented as player ping. Accurate user-path measurements require a client-side or dedicated probe design that handles CORS, supported protocols, endpoint ownership, and measurement integrity.

## Development checks

- `npm test` — unit tests using Node's built-in test runner.
- `npm run check` — existing Wrangler dry-run deployment validation.

No deployment, production secret, or Wrangler binding changes are included.
