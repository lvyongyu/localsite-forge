// CARD — for appointment trades: barbers, salons, physio, dentists, mechanics.
//
// Nobody browses a physio's website. They arrive knowing what they want and
// need one thing: to book. So the page is a service list with the call action
// pinned in view at all times, and the hours table sits high rather than in a
// footer, because "can I get in today" is the actual question.
// Quiet, functional, no decoration — trust is the aesthetic here.

import { esc, head, hoursScript, mapsHref, telHref, a11yCss } from '../render-utils.js';

export function render(p, t, opts = {}) {
  const tel = telHref(p);
  const open = p.hours.some(h => h.open != null);

  const services = p.dishes.map(d =>
    `<li><span>${esc(d.title)}</span><em>Enquire</em></li>`).join('');

  // A narrow band under the header: enough to show the room, not so much
  // that it delays the booking button.
  const band = p.photos.length ? `<div class="band">${p.photos.map((ph, i) => `
    <figure><img src="${esc(ph.src)}" alt="${esc(p.name)} ${i + 1}" loading="lazy" decoding="async">
      <figcaption>${esc(ph.author)}</figcaption></figure>`).join('')}</div>` : '';

  const hourRows = p.hours.map(h =>
    `<tr data-d="${h.day}"><th scope="row">${h.label}</th><td>${esc(h.text)}</td></tr>`).join('');

  return `<!doctype html>
<html lang="en-AU">
<head>
${head(p, opts)}
<style>
:root{
  --bg:${t.cream}; --card:#fff; --ink:${t.ink}; --dim:${t.muted};
  --line:${t.ink}1f; --brand:${t.primary}; --act:${t.accent}; --ok:${t.sage};
  --sans:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",sans-serif;
  --label:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --bg:${t.dkBg}; --card:${t.dkCard}; --ink:${t.dkFg}; --dim:#98a1a5;
  --line:${t.dkFg}1f; --brand:${t.dkBright};
}}
:root[data-theme="dark"]{
  --bg:${t.dkBg}; --card:${t.dkCard}; --ink:${t.dkFg}; --dim:#98a1a5;
  --line:${t.dkFg}1f; --brand:${t.dkBright};
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font-family:var(--sans);line-height:1.55;
  -webkit-font-smoothing:antialiased;padding-bottom:76px}
${a11yCss}
a{color:inherit}
.top{border-bottom:1px solid var(--line);background:var(--card)}
.top .in{max-width:940px;margin:0 auto;padding:20px 24px;display:flex;
  align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap}
.name{font-size:1.32rem;font-weight:650;letter-spacing:-.015em}
.where{font-size:.83rem;color:var(--dim)}
.pill{font-family:var(--label);font-size:.63rem;letter-spacing:.14em;text-transform:uppercase;
  padding:6px 12px;border-radius:2px;border:1px solid var(--line);color:var(--dim)}
.pill[data-open="yes"]{color:var(--ok);border-color:currentColor}
.pill[data-open="no"]{color:var(--act);border-color:currentColor}
.wrap{max-width:940px;margin:0 auto;padding:clamp(30px,5vw,58px) 24px}
.lead{font-size:clamp(1.35rem,3vw,1.95rem);font-weight:600;letter-spacing:-.02em;
  max-width:22ch;text-wrap:balance;line-height:1.2}
.sub{color:var(--dim);margin-top:12px;max-width:52ch}
.band{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-top:26px}
.band figure{margin:0;position:relative;aspect-ratio:3/2;overflow:hidden;border-radius:4px;background:var(--line)}
.band img{width:100%;height:100%;object-fit:cover;display:block}
.band figcaption{position:absolute;left:0;right:0;bottom:0;font-family:var(--label);font-size:.55rem;
  letter-spacing:.08em;text-transform:uppercase;color:#fff;padding:15px 8px 5px;
  background:linear-gradient(transparent,rgba(0,0,0,.72));opacity:0;transition:opacity .18s}
.band figure:hover figcaption{opacity:1}
.cols{display:grid;grid-template-columns:1.35fr 1fr;gap:clamp(26px,4vw,54px);margin-top:44px;align-items:start}
@media(max-width:780px){.cols{grid-template-columns:1fr;gap:34px}}
h2{font-family:var(--label);font-size:.65rem;letter-spacing:.2em;text-transform:uppercase;
  color:var(--dim);font-weight:400;margin-bottom:14px}
.panel{background:var(--card);border:1px solid var(--line);border-radius:3px}
ul{list-style:none}
li{display:flex;justify-content:space-between;align-items:center;gap:16px;
  padding:15px 20px;border-bottom:1px solid var(--line);font-size:1rem}
li:last-child{border-bottom:0}
li em{font-style:normal;font-family:var(--label);font-size:.62rem;letter-spacing:.13em;
  text-transform:uppercase;color:var(--dim)}
table{width:100%;border-collapse:collapse}
th,td{padding:11px 20px;font-size:.93rem;border-bottom:1px solid var(--line)}
th{text-align:left;font-weight:400;color:var(--dim)}
td{text-align:right;font-variant-numeric:tabular-nums}
tr:last-child th,tr:last-child td{border-bottom:0}
tr[data-today] th,tr[data-today] td{color:var(--brand);font-weight:650}
.facts{padding:18px 20px;font-size:.92rem;color:var(--dim);display:grid;gap:9px}
.facts a{color:var(--brand);text-decoration:none;font-weight:550}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.chip{font-size:.78rem;color:var(--dim);border:1px solid var(--line);border-radius:2px;padding:5px 11px}
.dock{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1px solid var(--line);
  padding:11px 24px;display:flex;gap:12px;align-items:center;justify-content:center;z-index:9}
.dock a{flex:0 1 260px;text-align:center;text-decoration:none;padding:13px 20px;border-radius:3px;
  font-size:.92rem;font-weight:600;letter-spacing:.01em}
.dock .go{background:var(--act);color:#fff}
.dock .alt{border:1px solid var(--line);color:var(--ink)}
</style>
</head>
<body>
<header class="top"><div class="in">
  <div>
    <div class="name">${esc(p.name)}</div>
    <div class="where">${esc(p.category)}${p.suburb ? ' in ' + esc(p.suburb) : ''}</div>
  </div>
  ${open ? '<span class="pill" id="status"></span>' : ''}
</div></header>

<div class="wrap">
  <p class="lead">${esc(p.summary || `${p.category} in ${p.suburb || 'the neighbourhood'}.`)}</p>
  ${p.rating ? `<p class="sub">Rated ${p.rating} out of 5 across ${p.reviews} Google reviews.</p>` : ''}

  ${band}

  <div class="cols">
    <div>
      ${services ? `<h2>What we do</h2>
      <div class="panel"><ul>${services}</ul></div>
      <div class="chips">${p.attrs.map(a => `<span class="chip">${esc(a)}</span>`).join('')}</div>` : ''}
    </div>
    <div>
      ${open ? `<h2>Opening hours</h2>
      <div class="panel"><table id="hours">${hourRows}</table></div>` : ''}
      <h2 style="margin-top:30px">Find us</h2>
      <div class="panel facts">
        <span>${esc(p.address)}</span>
        <a href="${mapsHref(p)}">Open in Google Maps &rarr;</a>
        ${tel ? `<a href="${tel}">${esc(p.phone)}</a>` : ''}
      </div>
    </div>
  </div>
</div>

<nav class="dock">
  ${tel ? `<a class="go" href="${tel}">Call ${esc(p.phone)}</a>` : ''}
  <a class="alt" href="${mapsHref(p)}">Directions</a>
</nav>
${hoursScript(p, { statusId: 'status', tableId: 'hours' })}
</body>
</html>`;
}
