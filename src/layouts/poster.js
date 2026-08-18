// POSTER — for counter-trade shops: cafes, bakeries, espresso bars.
//
// Melbourne's independent cafes don't run brochure sites. The good ones are
// a single screen that answers "where, when, still open?" and stops. So this
// is one viewport, no cards, no gradients, type doing the work.
//
// The one real device is the day-bar: today's trading hours drawn to scale
// with a marker at the current time. A cafe's most-asked question is whether
// it's still open and for how long — worth a diagram, not a sentence.

import { esc, head, hoursScript, mapsHref, telHref, a11yCss } from '../render-utils.js';

export function render(p, t, opts = {}) {
  const tel = telHref(p);
  const today = new Date().getDay();
  const open = p.hours.some(h => h.open != null);
  // Scale the bar across the widest trading window, so an early start reads long.
  const spans = p.hours.filter(h => h.open != null);
  const lo = spans.length ? Math.floor(Math.min(...spans.map(h => h.open))) : 6;
  const hi = spans.length ? Math.ceil(Math.max(...spans.map(h => h.close))) : 18;

  const ticks = [];
  for (let h = lo; h <= hi; h += (hi - lo > 10 ? 3 : 2)) {
    ticks.push(`<span class="tick" style="left:${((h - lo) / (hi - lo) * 100).toFixed(2)}%">
      <i></i><b>${h % 12 || 12}${h < 12 ? 'a' : 'p'}</b></span>`);
  }

  const bars = p.hours.map(h => {
    const on = h.open != null;
    const l = on ? (h.open - lo) / (hi - lo) * 100 : 0;
    const w = on ? (Math.min(h.close, hi) - h.open) / (hi - lo) * 100 : 0;
    return `<tr data-d="${h.day}">
      <th scope="row">${h.label.slice(0, 3)}</th>
      <td><span class="track">${on ? `<span class="fill" style="left:${l.toFixed(2)}%;width:${w.toFixed(2)}%"></span>` : ''}</span></td>
      <td class="tm">${esc(h.text)}</td></tr>`;
  }).join('');

  // Offerings as a single run of text, the way a shopfront lists them.
  const run = p.dishes.map(d => `<span>${esc(d.title)}</span>`).join('<i>/</i>');

  return `<!doctype html>
<html lang="en-AU">
<head>
${head(p, opts)}
<style>
:root{
  --ground:${t.cream}; --ink:${t.ink}; --dim:${t.muted}; --line:${t.ink}22;
  --hot:${t.accent}; --cool:${t.primary};
  --display:"Helvetica Neue",Helvetica,Arial,system-ui,sans-serif;
  --label:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --ground:${t.dkBg}; --ink:${t.dkFg}; --dim:#8c979c; --line:${t.dkFg}22; --cool:${t.dkBright};
}}
:root[data-theme="dark"]{
  --ground:${t.dkBg}; --ink:${t.dkFg}; --dim:#8c979c; --line:${t.dkFg}22; --cool:${t.dkBright};
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--ground);color:var(--ink);font-family:var(--display);
  min-height:100vh;display:flex;flex-direction:column;padding:clamp(20px,4vw,44px);
  -webkit-font-smoothing:antialiased}
${a11yCss}
a{color:inherit}
.rail{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;
  font-family:var(--label);font-size:.66rem;letter-spacing:.2em;text-transform:uppercase;color:var(--dim)}
.rail a{text-decoration:none}
.rail a:hover{color:var(--hot)}
main{flex:1;display:flex;flex-direction:column;justify-content:center;
  padding:clamp(28px,7vh,72px) 0;gap:clamp(22px,4vh,40px)}
h1{font-size:clamp(3.1rem,15vw,11rem);line-height:.82;font-weight:800;
  letter-spacing:-.045em;text-transform:uppercase;text-wrap:balance;
  overflow-wrap:break-word;hyphens:none}
h1 em{font-style:normal;color:var(--cool)}
.sub{font-family:var(--label);font-size:clamp(.7rem,1.5vw,.84rem);letter-spacing:.24em;
  text-transform:uppercase;color:var(--dim);display:flex;flex-wrap:wrap;gap:6px 18px;align-items:baseline}
.sub .now{color:var(--ink);font-weight:600}
.sub .now[data-open="yes"]{color:var(--cool)}
.sub .now[data-open="no"]{color:var(--hot)}

/* the day-bar */
.bar{border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:16px 0}
table{width:100%;border-collapse:collapse;font-family:var(--label);font-size:.7rem}
th{width:2.6em;text-align:left;font-weight:400;color:var(--dim);letter-spacing:.12em;text-transform:uppercase;padding:3px 0}
td{padding:3px 0}
.tm{width:11em;text-align:right;color:var(--dim);letter-spacing:.04em;font-variant-numeric:tabular-nums}
.track{position:relative;display:block;height:7px;margin:0 14px;background:var(--line);border-radius:1px}
.fill{position:absolute;top:0;bottom:0;background:var(--dim);border-radius:1px}
tr[data-today] th{color:var(--ink);font-weight:700}
tr[data-today] .fill{background:var(--cool)}
tr[data-today] .tm{color:var(--ink)}
.axis{position:relative;height:1.1em;margin:8px 2.6em 0 2.6em}
.tick{position:absolute;transform:translateX(-50%);font-family:var(--label);font-size:.6rem;color:var(--dim)}
.tick i{display:block;width:1px;height:4px;background:var(--line);margin:0 auto 3px}
#nowline{position:absolute;top:-4px;bottom:0;width:1px;background:var(--hot)}
#nowline::before{content:"";position:absolute;top:-3px;left:-2.5px;width:6px;height:6px;
  border-radius:50%;background:var(--hot)}

.run{font-size:clamp(.95rem,2.2vw,1.35rem);line-height:1.5;color:var(--dim);
  max-width:44ch;text-wrap:pretty}
.run span{white-space:nowrap}
.run i{font-style:normal;color:var(--hot);padding:0 .5em}
.acts{display:flex;gap:12px;flex-wrap:wrap;padding-top:4px}
.acts a{font-family:var(--label);font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;
  text-decoration:none;padding:14px 26px;border:1px solid var(--ink);transition:.15s}
.acts a:hover{background:var(--ink);color:var(--ground)}
.acts a.hot{background:var(--hot);border-color:var(--hot);color:#fff}
.acts a.hot:hover{filter:brightness(1.1)}
footer{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;
  font-family:var(--label);font-size:.62rem;letter-spacing:.18em;text-transform:uppercase;color:var(--dim)}
@media(max-width:560px){.tm{display:none}.track{margin-right:0}}
</style>
</head>
<body>
<div class="rail">
  <span>${esc(p.shortAddress || p.address)}</span>
  ${tel ? `<a href="${tel}">${esc(p.phone)}</a>` : ''}
</div>

<main>
  <h1>${esc(p.name).replace(/\s+(\S+)$/, ' <em>$1</em>')}</h1>

  <div class="sub">
    ${open ? '<span class="now" id="status"></span>' : ''}
    ${p.tagline ? `<span>${esc(p.tagline)}</span>` : ''}
    ${p.rating ? `<span>${p.rating} &#9733; &middot; ${p.reviews} reviews</span>` : ''}
  </div>

  ${open ? `<div class="bar">
    <table id="hours">${bars}</table>
    <div class="axis">${ticks.join('')}<span id="nowline" hidden></span></div>
  </div>` : ''}

  ${run ? `<p class="run">${run}</p>` : ''}

  <div class="acts">
    ${tel ? `<a class="hot" href="${tel}">Call the shop</a>` : ''}
    <a href="${mapsHref(p)}">Directions</a>
  </div>
</main>

<footer>
  <span>${esc(p.address)}</span>
  <span>${esc(p.attrs.slice(0, 3).join(' / '))}</span>
</footer>

${hoursScript(p, { statusId: 'status', tableId: 'hours' })}
${open ? `<script>
(function(){
  var lo=${lo},hi=${hi},n=new Date(),c=n.getHours()+n.getMinutes()/60;
  if(c<lo||c>hi)return;
  var el=document.getElementById('nowline');
  el.style.left=((c-lo)/(hi-lo)*100).toFixed(2)+'%';
  el.hidden=false;
})();
</script>` : ''}
</body>
</html>`;
}
