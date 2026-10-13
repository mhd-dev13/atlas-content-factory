export const GAME_CONNECT_HTML = String.raw`<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0b1020">
<title>Atlas | رادار شبکه و بررسی اتصال بازی</title>
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
.live-dashboard{margin:0 0 18px;border:1px solid #2a4562;background:linear-gradient(145deg,rgba(18,39,57,.98),rgba(13,22,39,.98));border-radius:22px;padding:22px;overflow:hidden;position:relative}
.live-dashboard:before{content:"";position:absolute;inset:-80px auto auto -80px;width:220px;height:220px;border-radius:50%;background:#70f0c012;filter:blur(20px);pointer-events:none}
.dash-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;position:relative}
.dash-kicker{color:var(--mint);font-size:12px;font-weight:800;letter-spacing:.3px}.dash-head h2{margin:3px 0 4px;font-size:20px}.dash-head p{margin:0;color:var(--muted);font-size:12px}
.live-pill{display:inline-flex;align-items:center;gap:7px;border:1px solid #28664f;background:#10372f;color:#a8ffdc;border-radius:999px;padding:5px 10px;font-size:11px;white-space:nowrap}
.live-pulse{width:7px;height:7px;border-radius:50%;background:#70f0c0;box-shadow:0 0 0 0 #70f0c080;animation:livePulse 1.8s infinite}
@keyframes livePulse{70%{box-shadow:0 0 0 7px #70f0c000}100%{box-shadow:0 0 0 0 #70f0c000}}
.dash-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:18px 0 12px;position:relative}
.dash-metric{padding:12px 14px;background:#091426b8;border:1px solid #243952;border-radius:14px;min-width:0}.dash-metric span{display:block;color:var(--muted);font-size:11px}.dash-metric strong{display:block;font-size:20px;line-height:1.7;overflow-wrap:anywhere}.dash-metric small{display:block;color:#7f93b3;font-size:10px}
.chart-wrap{border:1px solid #263a55;background:#09142699;border-radius:16px;padding:12px 12px 4px;position:relative}
.chart-title{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;color:#dce7fb}.chart-title small{color:var(--muted);font-size:10px}
.network-chart{width:100%;height:auto;display:block;overflow:visible}.chart-grid{stroke:#293d57;stroke-width:1;stroke-dasharray:4 6}.chart-area{fill:url(#atlasChartFill);opacity:.28}.chart-line{fill:none;stroke:var(--mint);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 5px #70f0c055);stroke-dasharray:1000;stroke-dashoffset:1000;animation:drawLine 1.2s ease forwards}.chart-point{fill:var(--mint);stroke:#0b1829;stroke-width:3}.chart-empty{fill:#8296b5;font-size:13px}
@keyframes drawLine{to{stroke-dashoffset:0}}
.source-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:16px 0 9px}.source-head strong{font-size:13px}.source-head span{font-size:11px;color:var(--muted)}
.source-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.source-tile{min-width:0;border:1px solid #293a54;background:#0a1526;border-radius:12px;padding:10px}.source-tile .source-name{display:block;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.source-tile .source-state{display:flex;align-items:center;gap:6px;font-size:10px;color:var(--muted);margin-top:4px}.source-state i{width:6px;height:6px;border-radius:50%;background:#7e8ca4;flex-shrink:0}.source-tile.ok .source-state i{background:var(--mint);box-shadow:0 0 8px #70f0c060}.source-tile.bad .source-state i{background:#ff9b9b}.source-tile.partial .source-state i{background:#e8c77c}
.dash-analysis{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.analysis-box{padding:13px;border:1px solid #263952;background:#0b1628;border-radius:14px}.analysis-box strong{display:block;font-size:12px;margin-bottom:5px}.analysis-box ul{padding-right:17px;margin:0;color:var(--muted);font-size:11px}.analysis-box li+li{margin-top:4px}.dash-foot{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;color:#8194b1;font-size:10px;margin-top:12px}
@media(prefers-reduced-motion:reduce){.live-pulse,.chart-line{animation:none}.chart-line{stroke-dashoffset:0}}

@media(max-width:700px){.wrap{padding:18px 14px 38px}.top{margin-bottom:28px}.layout{grid-template-columns:1fr}.card{padding:18px}.hero p{font-size:15px}.sidecard{order:2}.live-dashboard{padding:15px}.dash-head h2{font-size:17px}.dash-metrics{grid-template-columns:1fr 1fr}.dash-metric:first-child{grid-column:1/-1}.source-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dash-analysis{grid-template-columns:1fr}.live-pill{font-size:10px;padding:4px 7px}}
</style>
</head>
<body>
<main class="wrap">
<header class="top"><div class="brand"><div class="logo" aria-hidden="true">⌁</div><span>ATLAS <span style="color:var(--mint)">NETWORK</span></span></div><span class="tag">پیش‌نمایش نسخه ۱</span></header>
<section class="hero"><div class="eyebrow">برای گیمرها، ساده و شفاف</div><h1>شبکه را ببین؛ بعد هوشمندانه‌تر بازی کن.</h1><p>اطلس شواهد چند منبع عمومی را جمع‌بندی می‌کند و دسترسی سرور خود را به سرویس‌های منتخب می‌سنجد. این داده‌ها به‌تنهایی پینگ یا کیفیت مسیر اینترنت دستگاه تو را نشان نمی‌دهند.</p></section>
<section class="live-dashboard" aria-labelledby="live-title">
<div class="dash-head"><div><div class="dash-kicker">ATLAS NETWORK RADAR</div><h2 id="live-title">رادار زندهٔ وضعیت شبکه</h2><p>جمع‌بندی منابع عمومی پایش اینترنت، با به‌روزرسانی خودکار</p></div><span class="live-pill"><i class="live-pulse"></i><span id="live-state">در حال اتصال به منابع…</span></span></div>
<div class="dash-metrics">
<div class="dash-metric"><span>منابع پاسخ‌گو</span><strong id="dash-sources">—/—</strong><small>دریافت داده، نه تضمین سلامت شبکه</small></div>
<div class="dash-metric"><span>اپراتورهای قابل‌شناسایی</span><strong id="dash-operators">—</strong><small>فقط از داده‌های قابل تفسیر</small></div>
<div class="dash-metric"><span>نشانه‌های اختلال اپراتوری</span><strong id="dash-disruptions">—</strong><small>بر اساس نمونه‌های عمومی موجود</small></div>
</div>
<div class="chart-wrap"><div class="chart-title"><span>تاریخچهٔ زندهٔ دسترسی به منابع</span><small id="chart-caption">در انتظار اولین نمونه</small></div>
<svg class="network-chart" viewBox="0 0 640 150" role="img" aria-label="نمودار تغییر تعداد منابع پاسخ‌گو در بازه پایش این صفحه">
<defs><linearGradient id="atlasChartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#70f0c0"/><stop offset="100%" stop-color="#70f0c0" stop-opacity="0"/></linearGradient></defs>
<line class="chart-grid" x1="20" y1="25" x2="620" y2="25"/><line class="chart-grid" x1="20" y1="65" x2="620" y2="65"/><line class="chart-grid" x1="20" y1="105" x2="620" y2="105"/>
<text x="8" y="28" fill="#8194b1" font-size="10">۸</text><text x="8" y="68" fill="#8194b1" font-size="10">۴</text><text x="8" y="108" fill="#8194b1" font-size="10">۰</text>
<path id="chart-area" class="chart-area" d=""/><path id="chart-line" class="chart-line" d=""/><circle id="chart-point" class="chart-point" cx="20" cy="105" r="5"/>
<text id="chart-empty" class="chart-empty" x="320" y="75" text-anchor="middle">پس از دریافت اولین داده، نمودار رسم می‌شود</text>
</svg></div>
<div class="source-head"><strong>وضعیت منابع داده</strong><span id="source-updated">در حال دریافت…</span></div><div id="source-grid" class="source-grid" aria-live="polite"></div>
<div class="dash-analysis"><section class="analysis-box"><strong>جمع‌بندی شواهد</strong><ul id="dash-findings"><li>در انتظار دادهٔ معتبر…</li></ul></section><section class="analysis-box"><strong>پیشنهادهای بعدی</strong><ul id="dash-recommendations"><li>پس از تحلیل منابع نمایش داده می‌شود.</li></ul></section></div>
<div class="dash-foot"><span id="analysis-provider">موتور تحلیل: در انتظار پاسخ</span><span>نمودار، تاریخچهٔ همین نشست مرورگر را نشان می‌دهد؛ دادهٔ تاریخی ساختگی نیست.</span></div>
</section>
<div class="layout">
<section class="card" aria-labelledby="choose-title"><h2 id="choose-title">کدام سرویس را بررسی کنیم؟</h2><p class="sub">فعلاً سه مقصد وب‌سایت رسمی در نسخه آزمایشی موجود است.</p>
<div class="games" id="games">
<button class="game" type="button" data-game="steam" aria-pressed="true"><span class="gameicon">🎮</span><span class="gametext"><strong>استیم</strong><small>وب‌سایت فروشگاه استیم</small></span><span class="radio"></span></button>
<button class="game" type="button" data-game="epic-games" aria-pressed="false"><span class="gameicon">🕹️</span><span class="gametext"><strong>اپیک گیمز</strong><small>وب‌سایت فروشگاه اپیک گیمز</small></span><span class="radio"></span></button>
<button class="game" type="button" data-game="riot-games" aria-pressed="false"><span class="gameicon">⚔️</span><span class="gametext"><strong>ریوت گیمز</strong><small>وب‌سایت رسمی ریوت گیمز</small></span><span class="radio"></span></button>
</div>
<button class="primary" id="start" type="button">شروع بررسی ←</button><p class="hint">معمولاً چند ثانیه طول می‌کشد. نتیجه فقط از سمت سرور اطلس است.</p>
<div class="error" id="error" role="alert"></div>
<section class="result" id="result" aria-live="polite"><div class="status"><span class="dot"></span><span id="result-title">نتیجه بررسی</span></div><div class="metrics"><div class="metric"><span>وضعیت وب‌سایت</span><strong id="access">—</strong></div><div class="metric"><span>پاسخ HTTP</span><strong id="http">—</strong></div><div class="metric"><span>زمان پاسخ سرور اطلس</span><strong id="duration">—</strong></div><div class="metric"><span>پینگ بازی</span><strong>اندازه‌گیری نشده</strong></div></div><p class="explain" id="explain"></p><p class="hint">منبع رسمی: <a id="source-link" href="https://store.steampowered.com/" target="_blank" rel="noopener noreferrer" style="color:var(--mint)">مشاهده منبع</a></p></section>
</section>
<aside class="card sidecard"><div class="sidehead"><span class="shield">🛡️</span><h2>نتیجه را درست بخوان</h2></div><p>این نسخه یک بررسی محدود انجام می‌دهد؛ هنوز ابزار تست کامل اتصال بازی نیست.</p><ul><li>«پاسخ موفق» یعنی مقصد پاسخ موفق داده است. خطاهایی مثل 403 جداگانه نمایش داده می‌شوند و علت آن‌ها لزوماً فیلترینگ نیست.</li><li>«نامشخص» یعنی بررسی نتوانسته نتیجه قطعی بدهد.</li><li>پینگ داخل بازی، جیتر و افت بسته فعلاً اندازه‌گیری نمی‌شوند.</li></ul><div class="notice">این نتیجه فیلترینگ در ایران یا اتصال از دستگاه تو را اثبات نمی‌کند. برای چنین نتیجه‌ای باید اندازه‌گیری واقعی از مسیر کاربر انجام شود.</div></aside>
</div>
<footer class="footer">Atlas Game Connect · نسخه اولیه برای بازبینی · بدون ادعای سنجش پینگ بازی</footer>
</main>
<script>
const labels={reachable:"پاسخ موفق دریافت شد",restricted:"دسترسی رد شد (403)",rate_limited:"محدودیت درخواست (429)",http_error:"خطای HTTP مقصد",server_error:"خطای سرور مقصد",inconclusive:"نتیجه نامشخص",unreachable:"پاسخی دریافت نشد"};
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
    const sourceLink=document.getElementById("source-link");
    sourceLink.href=data.source?.url||data.access?.source_url||"https://store.steampowered.com/";
    sourceLink.textContent=data.source?.label_fa||data.access?.source_label_fa||"مشاهده منبع رسمی";
    resultBox.classList.add("show");
  }catch(error){errorBox.textContent=error.message||"خطایی رخ داد. دوباره تلاش کن.";errorBox.classList.add("show");}
  finally{start.disabled=false;start.textContent="شروع بررسی ←";}
});

const dashboardHistory=[];
const sourceNames={arvancloud:"رادار ابرآروان",isp:"پایش اپراتورها",connectivity:"پروب سرویس‌ها",ooni:"اندازه‌گیری OONI",ioda:"سیگنال قطعی IODA",cloudflare:"کیفیت Cloudflare",routing:"مسیریابی RIPE",source_freshness:"تازگی منابع"};
const dashEl=id=>document.getElementById(id);
function setList(id,items,empty){const list=dashEl(id);list.replaceChildren();const values=Array.isArray(items)?items.filter(item=>typeof item==="string"&&item.trim()).slice(0,3):[];if(!values.length)values.push(empty);values.forEach(value=>{const li=document.createElement("li");li.textContent=value;list.appendChild(li);});}
function drawNetworkHistory(total){
  dashboardHistory.push({time:Date.now(),value:Math.max(0,Math.min(8,Number(total)||0))});
  if(dashboardHistory.length>20)dashboardHistory.shift();
  const points=dashboardHistory.map((item,index)=>{const x=20+(dashboardHistory.length===1?0:index*600/(dashboardHistory.length-1));const y=105-(item.value/8)*80;return {x,y};});
  const line=points.map((point,index)=>(index?"L":"M")+point.x.toFixed(1)+" "+point.y.toFixed(1)).join(" ");
  const area=line+" L "+points[points.length-1].x.toFixed(1)+" 105 L "+points[0].x.toFixed(1)+" 105 Z";
  dashEl("chart-line").setAttribute("d",line);dashEl("chart-area").setAttribute("d",area);
  dashEl("chart-point").setAttribute("cx",points[points.length-1].x);dashEl("chart-point").setAttribute("cy",points[points.length-1].y);
  dashEl("chart-empty").style.display=dashboardHistory.length>1?"none":"block";
  dashEl("chart-caption").textContent=dashboardHistory.length+" نمونه · "+new Date().toLocaleTimeString("fa-IR",{hour:"2-digit",minute:"2-digit"});
}
function renderSources(sources){
  const grid=dashEl("source-grid");grid.replaceChildren();
  (Array.isArray(sources)?sources:[]).forEach(source=>{
    const tile=document.createElement("div");tile.className="source-tile "+(source.state==="available"?"ok":"bad");
    const name=document.createElement("span");name.className="source-name";name.textContent=sourceNames[source.id]||source.label_fa||source.id||"منبع ناشناس";
    const state=document.createElement("span");state.className="source-state";const dot=document.createElement("i");dot.setAttribute("aria-hidden","true");const label=document.createElement("span");label.textContent=source.state==="available"?(source.item_count?source.item_count+" ردیف داده":"پاسخ دریافت شد"):"داده دریافت نشد";state.append(dot,label);tile.append(name,state);grid.appendChild(tile);
  });
}
function renderNetworkDashboard(data){
  const sources=Array.isArray(data.sources)?data.sources:[];const total=Number(data.source_count)||sources.length||8;const available=Number(data.source_available_count)||0;
  dashEl("live-state").textContent=data.status==="available"?"پایش فعال":"منابع در دسترس نیستند";
  dashEl("dash-sources").textContent=available+"/"+total;
  dashEl("dash-operators").textContent=Number(data.operator_count)||0;
  dashEl("dash-disruptions").textContent=Number(data.disrupted_operator_count)||0;
  dashEl("source-updated").textContent=data.fetched_at?"آخرین دریافت: "+new Date(data.fetched_at).toLocaleTimeString("fa-IR",{hour:"2-digit",minute:"2-digit"}):"زمان دریافت نامشخص";
  renderSources(sources);setList("dash-findings",data.findings_fa,"هنوز جمع‌بندی کافی برای نمایش وجود ندارد.");setList("dash-recommendations",data.recommendations_fa,"برای پیشنهاد دقیق‌تر به شواهد بیشتری نیاز است.");
  dashEl("analysis-provider").textContent="موتور تحلیل: "+(data.analysis_provider==="cloudflare_workers_ai"?"مدل هوش مصنوعی Cloudflare": "قواعد محلی جایگزین")+" · اطمینان: "+(data.confidence||"کم");
  drawNetworkHistory(available);
  if(data.stale)dashEl("live-state").textContent="نمایش آخرین دادهٔ ذخیره‌شده";
}
async function refreshNetworkDashboard(){
  try{
    const response=await fetch("/api/v1/network-status",{method:"GET",cache:"no-store",headers:{"accept":"application/json"}});
    if(!response.ok)throw new Error("network status unavailable");
    const data=await response.json();renderNetworkDashboard(data);
  }catch(error){
    dashEl("live-state").textContent="اتصال به منابع ناموفق بود";
    dashEl("source-updated").textContent="دریافت بعدی خودکار انجام می‌شود";
    setList("dash-findings",["فعلاً دادهٔ تازه‌ای از سرویس اطلس دریافت نشد."],"فعلاً دادهٔ تازه‌ای از سرویس اطلس دریافت نشد.");
  }
}
refreshNetworkDashboard();
setInterval(refreshNetworkDashboard,60000);
</script>
</body>
</html>`;
