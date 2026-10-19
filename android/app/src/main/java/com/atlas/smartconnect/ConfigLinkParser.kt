package com.atlas.smartconnect

import java.net.URI
import java.net.URLDecoder
import java.nio.charset.StandardCharsets
import java.util.Base64

data class ParsedConfig(
    val raw: String,
    val scheme: String,
    val protocol: String,
    val host: String? = null,
    val port: Int? = null,
    val name: String? = null,
    val transport: String? = null,
    val security: String? = null,
    val warnings: List<String> = emptyList()
)

object ConfigLinkParser {
    private val protocolNames = mapOf(
        "vless" to "VLESS", "vmess" to "VMess", "trojan" to "Trojan",
        "ss" to "Shadowsocks", "ssr" to "ShadowsocksR",
        "hysteria" to "Hysteria", "hysteria2" to "Hysteria2", "hy2" to "Hysteria2",
        "tuic" to "TUIC", "wireguard" to "WireGuard", "socks" to "SOCKS",
        "socks5" to "SOCKS5", "http" to "HTTP proxy", "https" to "HTTPS proxy",
        "ssh" to "SSH"
    )

    fun parse(rawValue: String): ParsedConfig? {
        val raw = rawValue.trim().trimEnd(',', ';')
        val delimiter = raw.indexOf("://")
        if (delimiter <= 0) return null

        val scheme = raw.substring(0, delimiter).lowercase()
        val protocol = protocolNames[scheme] ?: "Unsupported ($scheme)"
        val warnings = mutableListOf<String>()

        if (scheme == "vmess") {
            val decoded = decodeVmessPayload(raw.substring(delimiter + 3))
            val host = decoded?.let { field(it, "add") }
            val port = decoded?.let { field(it, "port")?.toIntOrNull() }
            val name = decoded?.let { field(it, "ps") }
            if (decoded == null) warnings += "VMess payload could not be decoded as base64 JSON."
            if (host == null) warnings += "VMess server address was not recognized."
            return ParsedConfig(raw, scheme, protocol, host, port, name, warnings = warnings)
        }

        val uri = runCatching { URI(raw) }.getOrNull()
        if (uri == null) {
            return ParsedConfig(
                raw, scheme, protocol,
                warnings = listOf("URI syntax could not be parsed; original value was preserved.")
            )
        }

        val query = parseQuery(uri.rawQuery)
        val host = uri.host ?: uri.rawAuthority
            ?.substringAfterLast('@')
            ?.substringBefore(':')
            ?.takeIf { it.isNotBlank() }
        val port = uri.port.takeIf { it in 1..65535 }
        val security = query["security"]
        val transport = query["type"] ?: query["network"]
        val name = uri.rawFragment?.let(::decodeComponent)?.takeIf { it.isNotBlank() }

        if (protocol.startsWith("Unsupported")) {
            warnings += "No compatible engine adapter has been confirmed for this scheme."
        }
        if (query["allowInsecure"] == "1" || query["insecure"] == "1" ||
            query["allowInsecure"]?.equals("true", true) == true ||
            query["insecure"]?.equals("true", true) == true
        ) {
            warnings += "This link requests relaxed TLS certificate verification; review before use."
        }
        if (security.equals("reality", true) &&
            (query["pbk"].isNullOrBlank() || query["sni"].isNullOrBlank())
        ) {
            warnings += "REALITY link may be missing required public-key or SNI parameters."
        }
        if (host.isNullOrBlank()) warnings += "Server host could not be recognized."
        if (port == null) warnings += "Server port could not be recognized."

        return ParsedConfig(raw, scheme, protocol, host, port, name, transport, security, warnings)
    }

    fun parseMany(text: String): List<ParsedConfig> {
        val seen = mutableSetOf<String>()
        return text.lineSequence()
            .mapNotNull { parse(it.trim()) }
            .filter { seen.add(it.raw) }
            .toList()
    }

    private fun parseQuery(rawQuery: String?): Map<String, String> {
        if (rawQuery.isNullOrBlank()) return emptyMap()
        return rawQuery.split("&").mapNotNull { item ->
            if (item.isBlank()) return@mapNotNull null
            decodeComponent(item.substringBefore("=")) to decodeComponent(item.substringAfter("=", ""))
        }.toMap()
    }

    private fun decodeComponent(value: String): String =
        runCatching {
            URLDecoder.decode(value.replace("+", "%2B"), StandardCharsets.UTF_8.name())
        }.getOrDefault(value)

    private fun decodeVmessPayload(payload: String): String? {
        val encoded = payload.substringBefore('#').trim()
        val bytes = runCatching { Base64.getDecoder().decode(padBase64(encoded)) }
            .recoverCatching { Base64.getUrlDecoder().decode(padBase64(encoded)) }
            .getOrNull() ?: return null
        return runCatching { bytes.toString(StandardCharsets.UTF_8) }
            .getOrNull()?.takeIf { it.trimStart().startsWith("{") }
    }

    private fun padBase64(value: String): String =
        value + "=".repeat((4 - value.length % 4) % 4)

    private fun field(json: String, key: String): String? {
        val pattern = Regex(
            "\"" + Regex.escape(key) + "\"\\s*:\\s*(?:\"([^\"]*)\"|([0-9]+))",
            RegexOption.IGNORE_CASE
        )
        val match = pattern.find(json) ?: return null
        return match.groupValues.getOrNull(1)?.takeIf { it.isNotEmpty() }
            ?: match.groupValues.getOrNull(2)?.takeIf { it.isNotEmpty() }
    }
}
