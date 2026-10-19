package com.atlas.smartconnect

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { MaterialTheme { AtlasSmartConnectScreen() } }
    }
}

private enum class ConnectionMode(val label: String, val description: String) {
    VPN("VPN", "انتخاب و اتصال خودکار به بهترین مسیر"),
    DNS("DNS", "بررسی سرویس DNS مناسب"),
    MTPROXY("MTProxy", "پروکسی مخصوص تلگرام با امکان کپی")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AtlasSmartConnectScreen() {
    var selectedMode by remember { mutableStateOf(ConnectionMode.VPN) }
    var status by remember { mutableStateOf("پوسته اولیه آماده است؛ موتور اتصال هنوز متصل نشده.") }

    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        Scaffold(topBar = {
            TopAppBar(title = {
                Column {
                    Text("Atlas Smart Connect", fontWeight = FontWeight.Bold)
                    Text("اتصال هوشمند", fontSize = 12.sp)
                }
            })
        }) { innerPadding ->
            Column(
                modifier = Modifier.fillMaxSize().padding(innerPadding)
                    .padding(horizontal = 20.dp, vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(22.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("اتصال هوشمند", fontSize = 24.sp, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(6.dp))
                        Text("کانفیگ‌های تازه را بررسی کن و بهترین گزینه را انتخاب کن", fontSize = 14.sp)
                        Spacer(Modifier.height(18.dp))
                        Surface(
                            shape = RoundedCornerShape(50),
                            color = MaterialTheme.colorScheme.surface
                        ) {
                            Text(
                                "آزمایشی · بدون اتصال واقعی در این نسخه",
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                                fontSize = 12.sp
                            )
                        }
                    }
                }

                Text("نوع سرویس", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                ConnectionMode.entries.forEach { mode ->
                    ModeCard(mode, selectedMode == mode) {
                        selectedMode = mode
                        status = when (mode) {
                            ConnectionMode.VPN -> "موتور VPN هنوز یکپارچه نشده است."
                            ConnectionMode.DNS -> "آزمایش DNS در مرحله بعد اضافه می‌شود."
                            ConnectionMode.MTPROXY -> "دریافت خودکار MTProxy هنوز فعال نشده است."
                        }
                    }
                }

                Button(
                    onClick = {
                        status = when (selectedMode) {
                            ConnectionMode.VPN -> "اتصال برقرار نشد: موتور VPN هنوز نصب و پیکربندی نشده است."
                            ConnectionMode.DNS -> "هنوز آزمایش زنده DNS انجام نشده است."
                            ConnectionMode.MTPROXY -> "هنوز پروکسی از مرکز اطلس دریافت نشده است."
                        }
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(if (selectedMode == ConnectionMode.MTPROXY) "دریافت پروکسی تلگرام" else "شروع بررسی")
                }

                Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) {
                    Column(Modifier.padding(16.dp)) {
                        Text("وضعیت", fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(6.dp))
                        Text(status, fontSize = 14.sp)
                    }
                }
                Spacer(Modifier.weight(1f))
                Text(
                    "نسخه 0.1.0 · هیچ کانفیگی بدون بررسی معتبر فرض نمی‌شود.",
                    modifier = Modifier.align(Alignment.CenterHorizontally),
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun ModeCard(mode: ConnectionMode, selected: Boolean, onClick: () -> Unit) {
    val content: @Composable () -> Unit = {
        Row(
            modifier = Modifier.fillMaxWidth().padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(Modifier.weight(1f)) {
                Text(mode.label, fontWeight = FontWeight.Bold, fontSize = 17.sp)
                Spacer(Modifier.height(3.dp))
                Text(mode.description, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Spacer(Modifier.width(12.dp))
            Text(if (selected) "انتخاب‌شده" else "انتخاب", fontSize = 12.sp)
        }
    }
    if (selected) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
            onClick = onClick
        ) { content() }
    } else {
        OutlinedButton(onClick = onClick, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(18.dp)) {
            content()
        }
    }
}
