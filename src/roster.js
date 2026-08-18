// The door-knock roster. Thirty sites in thirty folders is not a usable
// thing to walk a suburb with — this is the one page you actually open:
// sorted by who to hit first, phone numbers tappable, and a visit state
// per shop that survives a reload.

import { esc, slug, dirFor } from './render-utils.js';

const WEB_LABEL = {
  none: 'no website',
  social: 'social only',
  platform: 'platform only',
};

export function renderRoster(leads, { suburb = '', price = 1000, flat = false } = {}) {
  const rows = leads.map((l, i) => {
    const base = dirFor({ name: l.name, id: l.id });
    // flat: one self-contained <shop>.html you can send straight to an owner.
    const dir = flat ? `${base}.html` : `${base}/index.html`;
    const pitch = flat ? `pitch/${base}.md` : `${base}/pitch.md`;
    const tel = (l.phone || '').replace(/[^\d+]/g, '');
    return `<tr data-id="${esc(l.id)}">
      <td class="n">${i + 1}</td>
      <td class="s">${l.score}</td>
      <td class="nm">
        <a href="${esc(dir)}">${esc(l.name)}</a>
        <span class="cat">${esc(l.category || '')}</span>
      </td>
      <td class="rt"><b>${l.rating}</b><span>${l.reviews}</span></td>
      <td><span class="tag t-${esc(l.web)}">${esc(WEB_LABEL[l.web] || l.web)}</span></td>
      <td class="ph">${tel ? `<a href="tel:${esc(tel)}">${esc(l.phone)}</a>` : '<i>none</i>'}</td>
      <td class="ad">${esc(l.address.replace(/, Australia$/, ''))}</td>
      <td class="dc"><a href="${esc(pitch)}">pitch</a></td>
      <td class="st"><button type="button" data-state="0">to do</button></td>
    </tr>`;
  }).join('');

  const tally = leads.reduce((a, l) => (a[l.web] = (a[l.web] || 0) + 1, a), {});
  const withPhone = leads.filter(l => l.phone).length;

  return `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${esc(suburb || 'Door-knock')} roster</title>
<style>
:root{
  --bg:#fbfaf8; --card:#fff; --ink:#1d2124; --dim:#69737a; --line:#1d212418;
  --go:#2f6b4f; --warn:#b5762c; --hot:#a8432c; --accent:#1f4d70;
  --sans:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --bg:#14181b; --card:#1b2126; --ink:#e7e9ea; --dim:#98a3a9; --line:#e7e9ea1f;
  --go:#6bbd90; --warn:#e0a75f; --hot:#e08268; --accent:#6fb2dd;
}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);
  font-size:14.5px;line-height:1.5;-webkit-font-smoothing:antialiased}
.wrap{max-width:1180px;margin:0 auto;padding:34px 22px 70px}
h1{font-size:1.6rem;font-weight:650;letter-spacing:-.02em;margin:0 0 6px}
.sub{color:var(--dim);margin:0 0 26px}
.stats{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:26px}
.stat{background:var(--card);border:1px solid var(--line);border-radius:4px;padding:11px 16px}
.stat b{display:block;font-size:1.5rem;font-weight:650;line-height:1.1;font-variant-numeric:tabular-nums}
.stat span{font-size:.74rem;letter-spacing:.09em;text-transform:uppercase;color:var(--dim)}
.tblwrap{overflow-x:auto;background:var(--card);border:1px solid var(--line);border-radius:5px}
table{width:100%;border-collapse:collapse;min-width:900px}
th{text-align:left;font-size:.68rem;letter-spacing:.13em;text-transform:uppercase;color:var(--dim);
  font-weight:500;padding:12px 12px;border-bottom:1px solid var(--line);white-space:nowrap}
td{padding:11px 12px;border-bottom:1px solid var(--line);vertical-align:middle}
tr:last-child td{border-bottom:0}
tr[data-done="1"]{opacity:.42}
tr[data-done="2"] .nm a{color:var(--go)}
.n,.s{font-family:var(--mono);font-size:.8rem;color:var(--dim);text-align:right;
  font-variant-numeric:tabular-nums;width:1%}
.nm a{color:inherit;text-decoration:none;font-weight:600}
.nm a:hover{color:var(--accent);text-decoration:underline}
.cat{display:block;font-size:.75rem;color:var(--dim)}
.rt{white-space:nowrap;font-variant-numeric:tabular-nums}
.rt b{font-weight:650}
.rt span{color:var(--dim);font-size:.8rem;margin-left:5px}
.tag{font-size:.7rem;letter-spacing:.05em;padding:3px 9px;border-radius:2px;white-space:nowrap;
  border:1px solid currentColor}
.t-none{color:var(--hot)}
.t-social{color:var(--warn)}
.t-platform{color:var(--dim)}
.ph a{color:var(--accent);text-decoration:none;font-variant-numeric:tabular-nums;white-space:nowrap}
.ph i{color:var(--dim);font-style:normal;font-size:.8rem}
.ad{color:var(--dim);font-size:.85rem;max-width:230px}
.dc a{color:var(--dim);font-size:.78rem;text-decoration:none;border-bottom:1px solid var(--line)}
.dc a:hover{color:var(--accent)}
.st button{font:inherit;font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;
  padding:5px 11px;border-radius:3px;border:1px solid var(--line);background:transparent;
  color:var(--dim);cursor:pointer;white-space:nowrap;min-width:74px}
.st button[data-state="1"]{color:var(--warn);border-color:currentColor}
.st button[data-state="2"]{color:var(--go);border-color:currentColor;font-weight:650}
.note{margin-top:22px;color:var(--dim);font-size:.85rem;max-width:70ch}
*:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@media print{
  body{background:#fff}
  .st,.dc{display:none}
  .tblwrap{border:0}
}
</style>
</head>
<body>
<div class="wrap">
  <h1>${esc(suburb || 'Door-knock')} roster</h1>
  <p class="sub">${leads.length} businesses, ranked by who to approach first. Click a name to open the site built for them.</p>

  <div class="stats">
    <div class="stat"><b>${leads.length}</b><span>leads</span></div>
    <div class="stat"><b>${tally.none || 0}</b><span>no website</span></div>
    <div class="stat"><b>${tally.social || 0}</b><span>social only</span></div>
    <div class="stat"><b>${withPhone}</b><span>reachable by phone</span></div>
    <div class="stat"><b>A$${(leads.length * price).toLocaleString('en-AU')}</b><span>if all close at A$${price}</span></div>
  </div>

  <div class="tblwrap"><table>
    <thead><tr>
      <th>#</th><th>score</th><th>business</th><th>rating</th>
      <th>web</th><th>phone</th><th>address</th><th></th><th>status</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table></div>

  <p class="note">Status cycles to do &rarr; visited &rarr; closed, and is kept in this browser only.
  Best window for hospitality is a weekday between 1:30 and 2:30pm; salons are quietest mid-morning
  midweek. Show the site before you mention a price.</p>
</div>
<script>
(function(){
  var KEY='roster-state';
  var st={};
  try{st=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
  var LABEL=['to do','visited','closed'];
  document.querySelectorAll('tr[data-id]').forEach(function(tr){
    var id=tr.getAttribute('data-id'),b=tr.querySelector('.st button'),v=st[id]||0;
    var paint=function(){b.setAttribute('data-state',v);b.textContent=LABEL[v];
      tr.setAttribute('data-done',v);};
    paint();
    b.addEventListener('click',function(){
      v=(v+1)%3;st[id]=v;
      try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}
      paint();
    });
  });
})();
</script>
</body>
</html>`;
}
