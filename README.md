# Atlas Smart Connect

Atlas Smart Connect is the Cloudflare Worker API and Telegram bot foundation for connection diagnostics and network-status reporting. The legacy social-content and video-generation features have been removed from this development branch.

## Current scope

- Persian homepage served by the Worker.
- Game/service access checks with an explicit distinction between server-side response time and real in-game ping.
- Network-status endpoint.
- Telegram bot commands for game checks, network status, and service status.
- Basic browser security headers and optional Telegram webhook secret validation.
- Diagnostic rate limiting and short-lived result storage through the configured Cloudflare bindings.

## Architecture direction

- **Cloudflare Worker:** public API and website entry point.
- **Cloudflare D1:** intended canonical structured store for future catalog/source records; not yet wired in this branch.
- **Telegram Serverless:** intended processing/publishing layer; not yet connected or verified in this branch.
- **Private source data:** keep raw/private configs separate from any public catalog. Public endpoints must expose only an explicitly sanitized projection.
- **Privacy:** no user accounts in v1; collect only data needed for the feature and prefer aggregate statistics.

## Local checks

Requirements: Node.js and npm, plus Wrangler for Worker commands.

```sh
npm install
npm test
npm run check
```

These commands have not been executed as part of this repository edit. Run them before merging or deploying.

## Cloudflare setup cautions

1. Review `wrangler.jsonc` and confirm the Worker name, KV namespace ID, and rate-limit configuration match the intended Cloudflare environment.
2. Renaming the Worker in configuration does not migrate an existing deployed Worker or its bindings automatically.
3. Do not deploy until the configuration and target environment have been reviewed.
4. If setting `TELEGRAM_WEBHOOK_SECRET`, configure Telegram's webhook with the matching secret token in the same planned change. The code remains backward-compatible when the secret is absent.
5. Do not paste bot tokens or other secrets into source files, commits, issues, or logs.

## Telegram Serverless migration checklist

- Confirm the Serverless runtime's supported entry point, bindings, update format, and outbound request limits from current Telegram documentation.
- Keep one active webhook/processing path per bot during migration; plan the cutover rather than resetting a live webhook blindly.
- Make update handling idempotent where possible and design retries to avoid duplicate publications.
- Test with a non-production bot or isolated channel first.
- Verify privacy permissions for the private source channel and publishing permissions for the public channel.
- Confirm that tokens and raw/private config content never appear in logs or public API responses.

## Important measurement limitation

A response measured from the Atlas Worker describes the Worker-to-target request. It does not measure the user's local connection, jitter, packet loss, or actual in-game ping. The app must run separate device-side tests before reporting those metrics.
