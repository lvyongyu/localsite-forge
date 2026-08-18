// BILL OF FARE — for places you sit down in: restaurants, trattorias, wine bars.
//
// A sit-down venue is chosen the night before, on a phone, by someone deciding
// where to book. So the page splits: a fixed panel that never scrolls away with
// the three things they need to act (where, when, the phone number), and a
// scrolling column set like an actual printed bill of fare — dot leaders, ruled
// courses, serif throughout. Price columns are left ruled but empty on purpose.

import { esc, head, hoursScript, mapsHref, telHref, a11yCss } from '../render-utils.js';

export function render(p, t, opts = {}) {
  const tel = telHref(p);
  const open = p.hours.some(h => h.open != null);

  const rows = p.dishes.map(d =>
    `<li><span class="nm">${esc(d.title)}</span><span class="led"></span><span class="pr">&mdash;</span></li>`).join('');

  const hourRows = p.hours.map(h =>
    `<tr data-d="${h.day}"><th scope="row">${h.label.slice(0,3)}</th><td>${esc(h.text)}</td></tr>`).join('');

  // The fixed panel carries the room's atmosphere; the menu column stays
  // clean. Gradient is heavy on purpose — the panel's text must stay legible
  // over whatever photo the listing happens to have.
  const hero = p.photos[0];
  const asideStyle = hero
    ? ` style="background-image:linear-gradient(180deg,rgba(0,0,0,.82),rgba(0,0,0,.93)),url('${esc(hero.src)}');background-size:cover;background-position:center"`
    : '';
  const rest = p.photos.slice(1);
  const plates = rest.length ? `<div class="plates">${rest.map((ph, i) => `
    <figure><img src="${esc(ph.src)}" alt="${esc(p.name)} ${i + 2}" loading="lazy" decoding="async">
      ${ph.author ? `<figcaption>${esc(ph.author)} &middot; Google</figcaption>` : ''}</figure>`).join('')}</div>` : '';

  const quotes = p.quotes.map(q =>
    `<figure><blockquote>${esc(q.text)}</blockquote>
     <figcaption>${esc(q.author)}, Google</figcaption></figure>`).join('');

  return `<!doctype html>
<html lang="en-AU">
<head>
${head(p, opts)}
<style>
:root{
  --paper:${t.cream}; --ink:${t.ink}; --dim:${t.muted}; --rule:${t.ink}2e;
  --panel:${t.ink}; --panelink:${t.sand}; --gold:${t.accent}; --cool:${t.primary};
  --serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;
  --label:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --paper:${t.dkBg}; --ink:${t.dkFg}; --dim:#98a3a0; --rule:${t.dkFg}26;
  --panel:#000; --panelink:${t.dkFg}; --cool:${t.dkBright};
}}
:root[data-theme="dark"]{
  --paper:${t.dkBg}; --ink:${t.dkFg}; --dim:#98a3a0; --rule:${t.dkFg}26;
  --panel:#000; --panelink:${t.dkFg}; --cool:${t.dkBright};
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--paper);color:var(--ink);font-family:var(--serif);
  -webkit-font-smoothing:antialiased;line-height:1.55}
${a11yCss}
a{color:inherit}
.split{display:grid;grid-template-columns:minmax(300px,34%) 1fr;min-height:100vh}
aside{background:var(--panel);color:var(--panelink);padding:clamp(30px,4vw,56px);
  position:sticky;top:0;height:100vh;display:flex;flex-direction:column;justify-content:space-between;gap:32px}
aside h1{font-size:clamp(2.1rem,3.4vw,3.3rem);line-height:1.02;font-weight:400;letter-spacing:-.015em;text-wrap:balance}
.kicker{font-family:var(--label);font-size:.63rem;letter-spacing:.26em;text-transform:uppercase;
  color:var(--gold);margin-bottom:18px}
.blurb{font-size:1rem;color:${t.sand}b8;max-width:34ch;margin-top:16px}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .blurb{color:#a9b2b0}}
.state{font-family:var(--label);font-size:.68rem;letter-spacing:.16em;text-transform:uppercase;
  padding:9px 0;border-top:1px solid ${t.sand}30;border-bottom:1px solid ${t.sand}30}
.state[data-open="yes"]{color:${t.sage}}
.state[data-open="no"]{color:var(--gold)}
.meta{display:grid;gap:14px;font-family:var(--label);font-size:.72rem;letter-spacing:.06em}
.meta a{text-decoration:none;border-bottom:1px solid ${t.sand}44;padding-bottom:2px}
.meta a:hover{border-color:var(--gold);color:var(--gold)}
.meta .big{font-family:var(--serif);font-size:1.45rem;letter-spacing:0;border:0}

main{padding:clamp(40px,6vw,96px) clamp(26px,5vw,80px);max-width:760px}
h2{font-size:clamp(1.5rem,2.6vw,2.05rem);font-weight:400;margin-bottom:6px}
.course{font-family:var(--label);font-size:.62rem;letter-spacing:.26em;text-transform:uppercase;
  color:var(--dim);padding-bottom:26px;border-bottom:1px solid var(--rule);margin-bottom:26px}
ul{list-style:none}
li{display:flex;align-items:baseline;gap:6px;padding:11px 0;font-size:1.14rem}
.led{flex:1;border-bottom:1px dotted var(--rule);transform:translateY(-.28em)}
.pr{font-family:var(--label);font-size:.78rem;color:var(--dim);min-width:2.4em;text-align:right}
.note{font-family:var(--label);font-size:.68rem;letter-spacing:.05em;color:var(--dim);
  margin-top:22px;padding-top:16px;border-top:1px solid var(--rule)}
.hrs{margin-top:64px}
table{border-collapse:collapse;font-size:1rem;width:100%;max-width:340px}
th{text-align:left;font-weight:400;color:var(--dim);padding:8px 22px 8px 0;
  font-family:var(--label);font-size:.66rem;letter-spacing:.16em;text-transform:uppercase}
td{padding:8px 0;font-variant-numeric:tabular-nums;text-align:right}
tr[data-today] th,tr[data-today] td{color:var(--cool);font-weight:600}
figure{margin:26px 0 0}
.plates{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin:34px 0 0}
.plates figure{margin:0;aspect-ratio:1;overflow:hidden;position:relative;border-radius:2px}
.plates img{width:100%;height:100%;object-fit:cover;display:block}
.plates figcaption{position:absolute;left:0;right:0;bottom:0;font-family:var(--label);font-size:.54rem;
  letter-spacing:.09em;text-transform:uppercase;color:#fff;padding:16px 8px 6px;margin:0;
  background:linear-gradient(transparent,rgba(0,0,0,.75));opacity:0;transition:opacity .18s}
.plates figure:hover figcaption{opacity:1}
blockquote{font-size:1.16rem;line-height:1.5;text-wrap:pretty}
blockquote::before{content:"\\201C"}
blockquote::after{content:"\\201D"}
figcaption{font-family:var(--label);font-size:.63rem;letter-spacing:.16em;
  text-transform:uppercase;color:var(--dim);margin-top:9px}
.book{display:inline-block;margin-top:34px;font-family:var(--label);font-size:.7rem;
  letter-spacing:.2em;text-transform:uppercase;text-decoration:none;
  padding:15px 30px;background:var(--gold);color:#fff}
.book:hover{filter:brightness(1.08)}
@media(max-width:820px){
  .split{grid-template-columns:1fr}
  aside{position:static;height:auto}
  main{padding:44px 26px 64px}
}
</style>
</head>
<body>
<div class="split">
  <aside${asideStyle}>
    <div>
      <div class="kicker">${esc(p.category)}${p.suburb ? ' &middot; ' + esc(p.suburb) : ''}</div>
      <h1>${esc(p.name)}</h1>
      ${p.summary ? `<p class="blurb">${esc(p.summary)}</p>` : ''}
    </div>
    <div class="meta">
      ${open ? '<div class="state" id="status"></div>' : ''}
      ${tel ? `<a class="big" href="${tel}">${esc(p.phone)}</a>` : ''}
      <a href="${mapsHref(p)}">${esc(p.address)}</a>
      ${p.rating ? `<span>${p.rating} &#9733; from ${p.reviews} Google reviews</span>` : ''}
    </div>
  </aside>

  <main>
    ${rows ? `<h2>Bill of fare</h2>
    <div class="course">What regulars order</div>
    <ul>${rows}</ul>
    <p class="note">Prices confirmed in house. Ask the floor about today's specials.</p>` : ''}

    ${plates}

    ${p.attrs.length ? `<p class="note" style="border:0;padding-top:26px">${p.attrs.map(esc).join(' &middot; ')}</p>` : ''}

    ${quotes ? `<div class="hrs"><h2>In the room</h2><div class="course">Recent guests</div>${quotes}</div>` : ''}

    ${open ? `<div class="hrs"><h2>Hours</h2><div class="course">Kitchen &amp; floor</div>
      <table id="hours">${hourRows}</table></div>` : ''}

    ${tel ? `<a class="book" href="${tel}">Call to book</a>` : `<a class="book" href="${mapsHref(p)}">Find us</a>`}
  </main>
</div>
${hoursScript(p, { statusId: 'status', tableId: 'hours' })}
</body>
</html>`;
}
