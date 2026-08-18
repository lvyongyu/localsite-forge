// Site renderer. Every value interpolated here originates from an external
// API, so everything goes through esc() — a business name with an ampersand
// or a review containing markup must not be able to break the page.

// JSON embedded in a <script> block is NOT protected by JSON.stringify:
// a business name containing "</script>" would break out of the tag.
// Escaping < > & as \u escapes keeps the JSON semantically identical.
const jsonInScript = obj => JSON.stringify(obj)
  .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');

const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// Three geometric motifs so neighbouring shops don't ship identical pages.
const PATTERNS = {
  tile: `<pattern id="pat" width="72" height="72" patternUnits="userSpaceOnUse">
      <path d="M36 0 72 36 36 72 0 36Z" fill="none" stroke="COL" stroke-width="1.1"/>
      <circle cx="36" cy="36" r="9" fill="none" stroke="COL" stroke-width="1.1"/>
      <path d="M0 0h72v72H0Z" fill="none" stroke="COL" stroke-width=".5"/></pattern>`,
  arches: `<pattern id="pat" width="64" height="64" patternUnits="userSpaceOnUse">
      <path d="M0 64V32a32 32 0 0 1 64 0v32" fill="none" stroke="COL" stroke-width="1.1"/>
      <path d="M16 64V36a16 16 0 0 1 32 0v28" fill="none" stroke="COL" stroke-width=".6"/></pattern>`,
  grid: `<pattern id="pat" width="56" height="56" patternUnits="userSpaceOnUse">
      <path d="M0 0h56v56H0Z" fill="none" stroke="COL" stroke-width=".6"/>
      <circle cx="0" cy="0" r="3" fill="COL" opacity=".6"/>
      <circle cx="56" cy="56" r="3" fill="COL" opacity=".6"/>
      <circle cx="28" cy="28" r="1.6" fill="COL"/></pattern>`,
};

const PATTERN_FOR = { azure:'tile', terracotta:'arches', forest:'grid', plum:'arches', charcoal:'grid', harbour:'tile' };

function stars(r) {
  const full = Math.round(r);
  return '★'.repeat(full) + '☆'.repeat(Math.max(0, 5 - full));
}

export function renderSite(p, theme, opts = {}) {
  const hasPhone = !!p.phoneHref;
  const hasHours = p.hours.some(h => h.open != null);
  const pat = (PATTERNS[PATTERN_FOR[theme.name] ?? 'tile']).replaceAll('COL', theme.dkBright);
  const lede = p.summary
    || `${p.category} in ${p.suburb || 'the neighbourhood'}.${p.attrs.length ? ' ' + p.attrs.slice(0,3).join(' · ') + '.' : ''}`;

  const blurb = p.isFood ? 'A regular request from the counter.' : 'Booked in regularly by locals.';
  const menuCards = p.dishes.map(d => `
      <div class="item"><h3>${esc(d.title)}</h3>
        <p>${blurb}</p></div>`).join('');

  const attrChips = p.attrs.map(a => `<span class="chip">${esc(a)}</span>`).join('');

  const quoteBlocks = p.quotes.map(q => `
      <blockquote>&ldquo;${esc(q.text)}&rdquo;
        <footer>${esc(q.author)} &middot; Google review</footer></blockquote>`).join('');

  const hourRows = p.hours.map(h =>
    `<tr data-d="${h.day}"><td>${h.label}</td><td>${esc(h.text)}</td></tr>`).join('');

  const hoursJson = JSON.stringify(
    Object.fromEntries(p.hours.map(h => [h.day, h.open == null ? null : [h.open, h.close]])));

  return `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${opts.live ? '' : '<meta name="robots" content="noindex,nofollow">\n'}<title>${esc(p.name)}${p.suburb ? ' — ' + esc(p.suburb) : ''}${p.tagline ? ' | ' + esc(p.tagline) : ''}</title>
<meta name="description" content="${esc(p.name)} — ${esc(lede)} ${esc(p.address)}">
<meta property="og:title" content="${esc(p.name)}">
<meta property="og:description" content="${esc(lede)}">
<meta property="og:type" content="website">
<script type="application/ld+json">${jsonInScript({
  '@context':'https://schema.org','@type':'LocalBusiness',
  name:p.name, address:p.address, telephone:p.phone || undefined,
  ...(p.rating ? {aggregateRating:{'@type':'AggregateRating',ratingValue:p.rating,reviewCount:p.reviews}} : {}),
  ...(p.lat ? {geo:{'@type':'GeoCoordinates',latitude:p.lat,longitude:p.lng}} : {}),
})}</script>
<style>
:root{
  --ink:${theme.ink}; --primary:${theme.primary}; --bright:${theme.bright}; --accent:${theme.accent};
  --sand:${theme.sand}; --cream:${theme.cream}; --sage:${theme.sage};
  --bg:var(--cream); --fg:var(--ink); --muted:${theme.muted};
  --card:#fff; --line:rgba(0,0,0,.12);
  --serif:Georgia,"Iowan Old Style","Times New Roman",serif;
  --sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --bg:${theme.dkBg}; --fg:${theme.dkFg}; --card:${theme.dkCard}; --sand:${theme.dkSand};
  --bright:${theme.dkBright}; --muted:#9fa8ac; --line:rgba(255,255,255,.14);
}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--sans);line-height:1.6;-webkit-font-smoothing:antialiased}
h1,h2,h3{font-family:var(--serif);font-weight:400;line-height:1.15;margin:0}
a{color:inherit}
.wrap{max-width:1080px;margin:0 auto;padding:0 24px}
.tiles{position:absolute;inset:0;opacity:.13;pointer-events:none}
nav{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--bg) 88%,transparent);
  backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.nav{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 24px;max-width:1080px;margin:0 auto}
.brand{font-family:var(--serif);font-size:1.3rem;letter-spacing:.05em}
.navlinks{display:flex;gap:26px;font-size:.9rem}
.navlinks a{text-decoration:none;opacity:.75}
.navlinks a:hover{opacity:1;color:var(--bright)}
.callbtn{background:var(--accent);color:#fff;text-decoration:none;padding:9px 18px;border-radius:999px;font-size:.88rem;font-weight:600;white-space:nowrap}
@media(max-width:760px){.navlinks{display:none}}
header{position:relative;overflow:hidden;background:linear-gradient(160deg,var(--primary) 0%,var(--ink) 100%);color:#f6efe4;padding:88px 0 76px}
.hero{position:relative;z-index:2;display:grid;grid-template-columns:1.25fr .75fr;gap:56px;align-items:center}
@media(max-width:860px){.hero{grid-template-columns:1fr;gap:36px}header{padding:60px 0 54px}}
.eyebrow{font-size:.78rem;letter-spacing:.2em;text-transform:uppercase;color:${theme.dkBright};margin-bottom:18px}
h1{font-size:clamp(2.6rem,7vw,4.4rem);letter-spacing:-.01em}
h1 span{display:block;color:${theme.dkBright};font-size:.42em;letter-spacing:.05em;margin-top:14px;font-family:var(--sans);font-weight:500;text-transform:uppercase}
.lede{font-size:1.1rem;max-width:46ch;margin:24px 0 32px;color:#dcd2c2}
.cta{display:flex;gap:14px;flex-wrap:wrap}
.btn{display:inline-block;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600;font-size:.95rem}
.btn-p{background:var(--accent);color:#fff}
.btn-s{border:1px solid rgba(246,239,228,.4);color:#f6efe4}
.rating{background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.18);border-radius:18px;padding:30px 28px;text-align:center}
.stars{color:#f5c451;font-size:1.45rem;letter-spacing:3px}
.score{font-family:var(--serif);font-size:3.3rem;line-height:1;margin:10px 0 4px}
.rating p{margin:0;font-size:.85rem;opacity:.8}
.rating .src{margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,.15);font-size:.76rem;letter-spacing:.08em;text-transform:uppercase;color:${theme.dkBright}}
.strip{background:var(--sand);border-bottom:1px solid var(--line)}
.strip .wrap{display:flex;align-items:center;justify-content:center;gap:12px;padding:16px 24px;flex-wrap:wrap;font-size:.95rem}
.dot{width:9px;height:9px;border-radius:50%;background:var(--sage);box-shadow:0 0 0 4px color-mix(in srgb,var(--sage) 25%,transparent)}
.dot.shut{background:var(--accent);box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 25%,transparent)}
section{padding:80px 0}
.sec-head{max-width:60ch;margin-bottom:46px}
.sec-head .eyebrow{color:var(--bright)}
.sec-head h2{font-size:clamp(1.85rem,4vw,2.6rem)}
.sec-head p{color:var(--muted);margin:16px 0 0;font-size:1.04rem}
.menu{display:grid;grid-template-columns:repeat(auto-fit,minmax(258px,1fr));gap:20px}
.item{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:26px 24px;transition:.2s}
.item:hover{transform:translateY(-3px);border-color:var(--bright)}
.item h3{font-size:1.2rem;margin-bottom:8px}
.item p{margin:0;color:var(--muted);font-size:.93rem}
.chips{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px}
.chip{font-size:.82rem;border:1px solid var(--line);border-radius:999px;padding:7px 15px;color:var(--muted);background:var(--card)}
.court{background:var(--sand);position:relative;overflow:hidden}
.court-grid{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;position:relative;z-index:2}
@media(max-width:860px){.court-grid{grid-template-columns:1fr;gap:36px}}
.quotes{display:grid;gap:16px}
blockquote{margin:0;background:var(--card);border-left:3px solid var(--accent);border-radius:0 12px 12px 0;padding:20px 22px;font-size:.96rem}
blockquote footer{margin-top:10px;font-size:.79rem;color:var(--muted)}
.visit{display:grid;grid-template-columns:1fr 1fr;gap:56px}
@media(max-width:860px){.visit{grid-template-columns:1fr;gap:40px}}
.hours{width:100%;border-collapse:collapse}
.hours td{padding:13px 4px;border-bottom:1px solid var(--line);font-size:.96rem}
.hours td:last-child{text-align:right;font-variant-numeric:tabular-nums;color:var(--muted)}
.hours tr.today td{color:var(--bright);font-weight:600}
.info .lbl{font-size:.73rem;letter-spacing:.17em;text-transform:uppercase;color:var(--muted);margin-bottom:18px}
.info a{color:var(--bright);text-decoration:none;font-weight:500}
.info p{margin:0 0 6px}
.big{font-family:var(--serif);font-size:1.55rem;line-height:1.35}
footer.f{background:var(--ink);color:rgba(255,255,255,.72);padding:46px 0;font-size:.87rem}
.f .wrap{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;align-items:center}
</style>
</head>
<body>
<nav><div class="nav">
  <div class="brand">${esc(p.name)}</div>
  <div class="navlinks">
    ${p.dishes.length ? `<a href="#menu">${p.isFood ? 'Menu' : 'Services'}</a>` : ''}
    ${p.quotes.length ? '<a href="#about">About</a>' : ''}
    <a href="#visit">Visit</a>
  </div>
  ${hasPhone ? `<a class="callbtn" href="tel:${esc(p.phoneHref)}">Call ${esc(p.phone)}</a>`
             : `<a class="callbtn" href="#visit">Find us</a>`}
</div></nav>

<header>
  <svg class="tiles" aria-hidden="true"><defs>${pat}</defs><rect width="100%" height="100%" fill="url(#pat)"/></svg>
  <div class="wrap hero">
    <div>
      <div class="eyebrow">${esc(p.shortAddress || p.address)}</div>
      <h1>${esc(p.name)}${p.tagline ? `<span>${esc(p.tagline)}</span>` : ''}</h1>
      <p class="lede">${esc(lede)}</p>
      <div class="cta">
        ${hasPhone ? `<a class="btn btn-p" href="tel:${esc(p.phoneHref)}">Call us</a>` : ''}
        <a class="btn btn-s" href="https://www.google.com/maps/search/?api=1&amp;query=${p.mapsQuery}">Get directions</a>
      </div>
    </div>
    ${p.rating ? `<div class="rating">
      <div class="stars">${stars(p.rating)}</div>
      <div class="score">${p.rating}</div>
      <p>from ${p.reviews} reviews</p>
      <div class="src">Rated on Google</div></div>` : ''}
  </div>
</header>

${hasHours ? `<div class="strip"><div class="wrap">
  <span class="dot" id="dot"></span><span id="status">Hours below</span>
  ${p.attrs.length ? `<span style="color:var(--muted)">&middot; ${esc(p.attrs.slice(0,3).join(' · '))}</span>` : ''}
</div></div>` : ''}

${p.dishes.length ? `<section id="menu"><div class="wrap">
  <div class="sec-head"><div class="eyebrow">What we're known for</div>
    <h2>${p.isFood ? 'On the menu' : 'What we do'}</h2>
    <p>${p.isFood ? "Ask the team about today's specials." : 'Get in touch to book a time that suits.'}</p></div>
  <div class="menu">${menuCards}</div>
</div></section>` : ''}

${(p.quotes.length || attrChips) ? `<section id="about" class="court">
  <svg class="tiles" aria-hidden="true" style="opacity:.07"><defs>${pat.replace('id="pat"','id="pat2"')}</defs><rect width="100%" height="100%" fill="url(#pat2)"/></svg>
  <div class="wrap court-grid">
    <div class="sec-head" style="margin:0">
      <div class="eyebrow">About us</div>
      <h2>Why people come back</h2>
      ${attrChips ? `<div class="chips">${attrChips}</div>` : ''}
    </div>
    <div class="quotes">${quoteBlocks}</div>
  </div></section>` : ''}

<section id="visit"><div class="wrap">
  <div class="sec-head"><div class="eyebrow">Visit us</div><h2>Find us</h2></div>
  <div class="visit">
    ${hasHours ? `<div><table class="hours" id="hours">${hourRows}</table></div>` : '<div></div>'}
    <div class="info">
      <div class="lbl">Address</div>
      <p class="big">${esc(p.address).replace(/, /g, '<br>')}</p>
      <p style="margin-top:10px"><a href="https://www.google.com/maps/search/?api=1&amp;query=${p.mapsQuery}">Open in Google Maps &rarr;</a></p>
      ${hasPhone ? `<div class="lbl" style="margin-top:32px">Phone</div>
      <p class="big"><a href="tel:${esc(p.phoneHref)}">${esc(p.phone)}</a></p>` : ''}
      ${p.attrs.length ? `<div class="lbl" style="margin-top:32px">Good to know</div>
      <p style="color:var(--muted)">${esc(p.attrs.join(' · '))}</p>` : ''}
    </div>
  </div>
</div></section>

<footer class="f"><div class="wrap">
  <div class="brand" style="color:#fff">${esc(p.name)}</div>
  <div>${esc(p.address)}${hasPhone ? ` &middot; <a href="tel:${esc(p.phoneHref)}" style="color:${theme.dkBright}">${esc(p.phone)}</a>` : ''}</div>
  ${p.tagline ? `<div>${esc(p.tagline)}</div>` : ''}
</div></footer>

${hasHours ? `<script>
(function(){
  var h=${hoursJson};
  var f=function(x){var m=Math.round((x%1)*60),H=Math.floor(x)%24,ap=H<12?'am':'pm',d=H%12||12;
    return d+':'+String(m).padStart(2,'0')+ap;};
  var n=new Date(),d=n.getDay(),cur=n.getHours()+n.getMinutes()/60,t=h[d];
  var el=document.getElementById('status');
  if(!t){el.innerHTML='<b>Closed today</b>';document.getElementById('dot').classList.add('shut');}
  else{
    var open=cur>=t[0]&&cur<t[1];
    el.innerHTML=open?'<b>Open now</b> &middot; until '+f(t[1])
      :'<b>Closed now</b> &middot; opens '+f(t[0])+(cur>=t[1]?' tomorrow':' today');
    if(!open)document.getElementById('dot').classList.add('shut');
  }
  var r=document.querySelector('#hours tr[data-d="'+d+'"]');if(r)r.classList.add('today');
})();
</script>` : ''}
</body>
</html>`;
}
