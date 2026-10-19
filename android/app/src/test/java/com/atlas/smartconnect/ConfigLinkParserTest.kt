package com.atlas.smartconnect

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ConfigLinkParserTest {
    @Test
    fun parsesTrojanWebSocketTlsAndPreservesOriginalParameters() {
        val link = "trojan://secret@example.com:443?path=%2Fws&security=tls&host=example.com&type=ws#sample"
        val parsed = ConfigLinkParser.parse(link)
        assertNotNull(parsed)
        assertEquals("Trojan", parsed?.protocol)
        assertEquals("example.com", parsed?.host)
        assertEquals(443, parsed?.port)
        assertEquals("ws", parsed?.transport)
        assertEquals("tls", parsed?.security)
        assertEquals(link, parsed?.raw)
        assertEquals("sample", parsed?.name)
    }

    @Test
    fun parsesVlessRealityAndWarnsWhenRequiredFieldsAreMissing() {
        val parsed = ConfigLinkParser.parse("vless://id@example.com:443?security=reality&type=tcp#reality")
        assertNotNull(parsed)
        assertEquals("VLESS", parsed?.protocol)
        assertTrue(parsed?.warnings?.any { it.contains("REALITY") } == true)
    }

    @Test
    fun detectsRelaxedTlsVerificationWithoutSilentlyChangingTheLink() {
        val link = "trojan://secret@example.com:443?security=tls&allowInsecure=1"
        val parsed = ConfigLinkParser.parse(link)
        assertEquals(link, parsed?.raw)
        assertTrue(parsed?.warnings?.any { it.contains("TLS") } == true)
    }

    @Test
    fun decodesVmessBase64JsonForBasicClassification() {
        val link = "vmess://eyJhZGQiOiJ2bWVzcy5leGFtcGxlLmNvbSIsInBvcnQiOiI0NDMiLCJwcyI6InRlc3QifQ=="
        val parsed = ConfigLinkParser.parse(link)
        assertNotNull(parsed)
        assertEquals("VMess", parsed?.protocol)
        assertEquals("vmess.example.com", parsed?.host)
        assertEquals(443, parsed?.port)
        assertEquals("test", parsed?.name)
    }

    @Test
    fun parseManyDropsExactDuplicatesButKeepsDistinctLinks() {
        val one = "trojan://secret@one.example:443?security=tls"
        val two = "vless://uuid@two.example:443?security=tls"
        assertEquals(2, ConfigLinkParser.parseMany("$one\n$one\n$two").size)
    }

    @Test
    fun rejectsPlainTextAndDoesNotThrowOnMalformedUris() {
        assertNull(ConfigLinkParser.parse("not a config"))
        assertNotNull(ConfigLinkParser.parse("vless://broken uri"))
    }
}
