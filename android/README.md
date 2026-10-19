# Atlas Smart Connect — Android prototype

This is the first native Android scaffold for Atlas Smart Connect. It is separate from the existing Cloudflare Worker at the repository root.

## Included in this first slice

- Persian right-to-left Android UI with VPN, DNS, and MTProxy modes.
- Local parser/classifier for common URI schemes: VLESS, VMess, Trojan, Shadowsocks, Hysteria/Hysteria2, TUIC, WireGuard, SOCKS, HTTP(S), and SSH.
- Best-effort extraction of host, port, transport, TLS security, and display name while preserving the original link unchanged.
- Warnings for relaxed TLS verification and potentially incomplete REALITY links.
- Unit tests for representative links and duplicate removal.
- GitHub Actions workflow to run Android unit tests and build a debug APK.

## Important limitations

This is a scaffold, not a working VPN product yet. It does **not** establish a VPN tunnel, alter system DNS, automatically read Telegram channels, run real latency/throughput tests, or fetch MTProxy entries. The UI explicitly reports these limitations rather than showing fake successful connections.

Parsing a URI does not prove that the protocol variant or all extension parameters are supported by the eventual engine. Unknown parameters must not be silently discarded during conversion. Full protocol support requires choosing and licensing an engine, normalizing supported formats, and integration tests against that exact engine version.

## Build

With JDK 17 and Gradle 8.13 available:

```sh
gradle -p android testDebugUnitTest assembleDebug
```

The debug APK is produced at `android/app/build/outputs/apk/debug/app-debug.apk`.

## Planned sequence

1. Verify engine/version/license compatibility and build a format matrix from real, redacted samples.
2. Implement a secure manifest/feed API and Telegram source collection using an access method actually available for each channel.
3. Integrate the selected engine behind Android's user-consented `VpnService`.
4. Add bounded parallel testing of up to ten fresh compatible candidates and rank successful tunnels by latency, stability, and transfer quality.
5. Add DNS mode and MTProxy copy/open-in-Telegram flow separately.
6. Test leaks, reconnection, permission revocation, battery/data overhead, invalid manifests, and source outages.

No Worker deployment or production secret changes are part of this Android scaffold.
