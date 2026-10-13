export const GAME_CONNECT_HTML = String.raw`<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0b1020">
<title>Atlas Game Connect | بررسی اتصال بازی</title>
<style>
:root{color-scheme:dark;--bg:#0b1020;--panel:#111a2e;--panel2:#17233b;--line:#293954;--text:#f4f7ff;--muted:#a6b4ce;--mint:#70f0c0;--blue:#87a8ff;--danger:#ffb1b1}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(900px 500px at 85% -10%,#203c60 0,transparent 65%),var(--bg);color:var(--text);font-family:Tahoma,"Segoe UI",sans-serif;line-height:1.8;min-height:100vh}
.wrap{width:min(920px,100%);margin:auto;padding:24px 18px 52px}.top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:38px}.brand{display:flex;align-items:center;gap:12px;font-weight:800;letter-spacing:.2px}.logo{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(135deg,var(--mint),#8eb5ff);color:#071320;font-size:23px}.tag{border:1px solid var(--line);border-radius:999px;padding:5px 10px;color:var(--muted);font-size:12px}
.hero{max-width:700px;margin-bottom:28px}.eyebrow{color:var(--mint);font-size:13px;font-weight:700}.hero h1{font-size:clamp(30px,6vw,48px);line-height:1.3;letter-spacing:-1px;margin:8px 0 14px}.hero p{color:var(--muted);font-size:16px;margin:0;max-width:650px}
.layout{display:grid;grid-template-columns:1fr .78fr;gap:16px;align-items:start}.card{border:1px solid var(--line);background:linear-gradient(160deg,rgba(23,35,59,.96),rgba(17,26,46,.96));border-radius:22px;padding:22px;box-shadow:0 18px 50px #0002}.card h2{font-size:18px;margin:0 0 6px}.sub{font-size:13px;color:var(--muted);margin:0 0 18px}
.games{display:grid;gap:10px}.game{width:100%;display:flex;align-items:center;gap:13px;text-align:right;border:1px solid var(--line);background:#0e1729;color:var(--text);border-radius:15px;padding:14px;cursor:pointer;font:inherit;transition:.15s}.game:hover{border-color:#6686bc}.game[aria-pressed=true]{border-color:var(--mint);background:#122c31;box-shadow:inset 0 0 0 1px #70f04420}.gameicon{width:42px;height:42px;border-radius:12px;background:#202e49;display:grid;place-items:center;font-size:21px;flex-shrink:0}.gametext{flex:1}.gametext strong{display:block}.gametext small{display:block;color:var(--muted);font-size:12px}.radio{width:17px;height:17px;border:1px solid #7184a5;border-radius:50%}.game[aria-pressed=true] .radio{border:5px solid var(--mint)}
.primary{width:100%;margin-top:18px;border:0;border-radius:14px;padding:14px 18px;background:var(--mint);color:#071320;font:inherit;font-weight:800;cursor:pointer}.primary:disabled{opacity:.55;cursor:wait}.hint{font-size:12px;color:var(--muted);margin:12px 0 0}
.result{display:none;margin-top:16px}.result.show{display:block}.status{display:flex;gap:10px;align-items:center;font-weight:800;font-size:17px}.dot{width:10px;height:10px;border-radius:50%;background:var(--blue);box-shadow:0 0 0 5px #87a8ff20}.metrics{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:18px 0}.metric{padding:12px;border-radius:13px;background:#0b1425;border:1px solid #253650}.metric span{display:block;color:var(--muted);font-size:12px}.metric strong{font-size:16px}.explain{font-size:13px;color:var(--muted);border-top:1px solid var(--line);padding-top:13px}.error{color:var(--danger);font-size:13px;margin-top:12px;display:none}.error.show{display:block}
.sidecard{background:#0e1729}.sidehead{display:flex;gap:10px;align-items:center;margin-bottom:10px}.shield{font-size:22px}.sidecard p,.sidecard li{font-size:13px;color:var(--muted)}.sidecard ul{padding-right:18px;margin:12px 0}.notice{border:1px solid #695b36;background:#282316;color:#e7d6a3;border-radius:13px;padding:12px;font-size:12px;margin-top:15px}.footer{text-align:center;color:#7788a6;font-size:12px;margin-top:25px}
@media(max-width:700px){.wrap{padding:18px 14px 38px}.top{margin-bottom:28px}.layout{grid-template-columns:1fr}.card{padding:18px}.hero p{font-size:15px}.sidecard{order:2}}
</style>
</head>
<body>
<main class="wrap">
<header class="top"><div class="brand"><div class="logo" aria-hidden="true">⌁</div><span>ATLAS <span style="color:var(--mint)">GAME CONNECT</span></span></div><span class="tag">نسخه آزمایشی · MVP</span></header>
<section class="hero"><div class="eyebrow">برای گیمرها، ساده و شفاف</div><h1>قبل از بازی، وضعیت دسترسی رو بررسی کن.</h1><p>یک سرویس را انتخاب کن تا اطلس دسترسی سرور خودش به وب‌سایت رسمی آن را بررسی کند. این بررسی، پینگ یا کیفیت اینترنت دستگاه تو را اندازه نمی‌گیرد.</p></section>
<div class="layout">
<section class="card" aria-labelledby="choose-title"><h2 id="choose-title">کدام سرویس را بررسی کنیم؟</h2><p class="sub">فعلاً سه مقصد وب‌سایت رسمی در نسخه آزمایشی موجود است.</p>
<div class="games" id="games">
<button class="game" type="button" data-game="steam" aria-pressed="true"><span class="gameicon">🎮</span><span class="gametext"><strong>استیم</strong><small>وب‌سایت فروشگاه استیم</small></span><span class="radio"></span></button>
<button class="game" type="button" data-game="epic-games" aria-pressed="false"><span class="gameicon">🕹️</span><span class="gametext"><strong>اپیک گیمز</strong><small>وب‌سایت فروشگاه اپیک گیمز</small></span><span class="radio"></span></button>
<button class="game" type="button" data-game="riot-games" aria-pressed="false"><span class="gameicon">⚔️</span><span class="gametext"><strong>ریوت گیمز</strong><small>وب‌سایت رسمی ریوت گیمز</small></span><span class="radio"></span></button>
</div>
<button class="primary" id="start" type="button">شروع بررسی ←</button><p class="hint">معمولاً چند ثانیه طول می‌کشد. نتیجه فقط از سمت سرور اطلس است.</p>
<div class="error" id="error" role="alert"></div>
<section class="result" id="result" aria-live="polite"><div class="status"><span class="dot"></span><span id="result-title">نتیجه بررسی</span></div><div class="metrics"><div class="metric"><span>وضعیت وب‌سایت</span><strong id="access">—</strong></div><div class="metric"><span>پاسخ HTTP</span><strong id="http">—</strong></div><div class="metric"><span>زمان پاسخ سرور اطلس</span><strong id="duration">—</strong></div><div class="metric"><span>پینگ بازی</span><strong>اندازه‌گیری نشده</strong></div></div><p class="explain" id="explain"></p></section>
</section>
<aside class="card sidecard"><div class="sidehead"><span class="shield">🛡️</span><h2>نتیجه را درست بخوان</h2></div><p>این نسخه یک بررسی محدود انجام می‌دهد؛ هنوز ابزار تست کامل اتصال بازی نیست.</p><ul><li>«پاسخ دریافت شد» یعنی وب‌سایت از سرور اطلس پاسخ داده؛ حتی خطای HTTP هم پاسخ محسوب می‌شود.</li><li>«نامشخص» یعنی بررسی نتوانسته نتیجه قطعی بدهد.</li><li>پینگ داخل بازی، جیتر و افت بسته فعلاً اندازه‌گیری نمی‌شوند.</li></ul><div class="notice">این نتیجه فیلترینگ در ایران یا اتصال از دستگاه تو را اثبات نمی‌کند. برای چنین نتیجه‌ای باید اندازه‌گیری واقعی از مسیر کاربر انجام شود.</div></aside>
</div>
<footer class="footer">Atlas Game Connect · نسخه اولیه برای بازبینی · بدون ادعای سنجش پینگ بازی</footer>
</main>
<script>
const labels={reachable:"پاسخ دریافت شد",inconclusive:"نتیجه نامشخص",unreachable:"پاسخی دریافت نشد"};
const buttons=[...document.querySelectorAll("[data-game]")];
let selected="steam";
buttons.forEach(button=>button.addEventListener("click",()=>{selected=button.dataset.game;buttons.forEach(item=>item.setAttribute("aria-pressed",String(item===button)));}));
const start=document.getElementById("start"),errorBox=document.getElementById("error"),resultBox=document.getElementById("result");
start.addEventListener("click",async()=>{
  start.disabled=true;start.textContent="در حال بررسی…";errorBox.classList.remove("show");resultBox.classList.remove("show");
  try{
    const response=await fetch("/api/v1/diagnostics",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({game:selected})});
    const data=await response.json();
    if(!response.ok)throw new Error(data.message_fa||"درخواست انجام نشد. کمی بعد دوباره تلاش کن.");
    document.getElementById("result-title").textContent="نتیجه بررسی "+(data.game?.name_fa||"");
    document.getElementById("access").textContent=labels[data.access?.state]||"نتیجه نامشخص";
    document.getElementById("http").textContent=data.access?.http_status??"بدون پاسخ HTTP";
    document.getElementById("duration").textContent=Number.isFinite(data.access?.duration_ms)?data.access.duration_ms+" میلی‌ثانیه":"—";
    document.getElementById("explain").textContent=(data.access?.note_fa||"")+" "+(data.conclusion_fa||"")+" "+(data.quality?.note_fa||"");
    resultBox.classList.add("show");
  }catch(error){errorBox.textContent=error.message||"خطایی رخ داد. دوباره تلاش کن.";errorBox.classList.add("show");}
  finally{start.disabled=false;start.textContent="شروع بررسی ←";}
});
</script>
</body>
</html>`;
