// STOREFRONT — the full page.
//
// The other three layouts each answer one question well and stop. That reads
// as thin to an owner who has just been shown a competitor's site with a menu
// tab, a gallery and a booking button: what they see is not "restrained", it
// is "less than the shop down the road got".
//
// So this layout keeps the persistent navigation that every hospitality site
// on a Melbourne high street has, and gives each thing the listing actually
// knows its own section to live in. What it does NOT do is manufacture the
// rest of that structure: no Functions page we have no packages for, no
// What's On we have no events for, no booking form we cannot honour. A nav
// item exists only when its section has real data behind it, so a thin
// listing gets a short bar rather than a page full of empty rooms.
//
// Bilingual by construction: both languages ship in the file and the switch
// is CSS, because the page has to work as a single file with no network.

import { esc, head, mapsHref, telHref, a11yCss } from '../render-utils.js';
import { T, DAYS, HTML_LANG, bi, biText, i18nCss, langScript } from '../i18n.js';

export function render(p, t, opts = {}) {
  const lang = opts.lang === 'zh' ? 'zh' : 'en';
  const draft = !!opts.draft;
  const tel = telHref(p);
  const open = p.hours.some(h => h.open != null);
  const hasMenu = p.dishes.length > 0;
  const hasPhotos = p.photos.length > 1;   // one photo is a hero, not a gallery
  const hasQuotes = p.quotes.length > 0;
  const menuKey = p.isFood ? 'navMenu' : 'navServices';

  // The bar is assembled from what exists. Nothing is stubbed in — except in
  // draft mode, where a marked blank is the point: it is what you and the
  // owner fill in together, sitting at one of their tables.
  const nav = [];
  if (hasMenu || draft) nav.push(['menu', menuKey]);
  if (hasPhotos || draft) nav.push(['gallery', 'navGallery']);
  if (hasQuotes) nav.push(['reviews', 'navReviews']);
  if (open || draft) nav.push(['hours', 'navHours']);
  nav.push(['find', 'navFind']);

  const tbd = (en, zh) => `<span class="tbd">${biText(en, zh)}</span>`;

  const navHtml = nav.map(([id, key]) =>
    `<a class="nl" href="#${id}" data-nav="${id}">${bi(key)}</a>`).join('');

  const dayRows = p.hours.map(h => `<tr data-d="${h.day}">
      <th scope="row">${biText(DAYS.en[h.day], DAYS.zh[h.day])}</th>
      <td>${h.open == null ? bi('closed') : esc(h.text)}</td></tr>`).join('');

  const menuRows = p.dishes.map(d => `<li>
      <span class="nm">${esc(d.title)}</span><span class="led"></span>
      <span class="ct">${p.isFood ? `${d.mentions}&times;` : bi('enquire')}</span></li>`).join('');

  // The first photo is the shopfront if there is one: at the top of the page
  // it does the job the name alone cannot — telling someone walking down the
  // street that this is the door they are looking for.
  const heroShot = p.photos[0];
  const plates = p.photos.slice(1).map((ph, i) => `<figure>
      <img src="${esc(ph.src)}" alt="${esc(p.name)} ${i + 2}" loading="lazy" decoding="async">
      ${ph.author ? `<figcaption>${esc(ph.author)}</figcaption>` : ''}</figure>`).join('');

  const quotes = p.quotes.map(q => `<figure>
      <blockquote>${esc(q.text)}</blockquote>
      <figcaption>${esc(q.author)}, Google</figcaption></figure>`).join('');

  const chips = p.attrs.map(a => `<span class="chip">${esc(a)}</span>`).join('');

  const section = (id, kicker, title, body, aside = '') => `<section id="${id}">
    <div class="shead">
      <div>${bi(kicker, { cls: 'kick', tag: 'div' })}${bi(title, { tag: 'h2' })}</div>
      ${aside ? `<div class="saide">${aside}</div>` : ''}
    </div>
    ${body}
  </section>`;

  return `<!doctype html>
<html lang="${HTML_LANG[lang]}" data-lang="${lang}">
<head>
${head(p, opts)}
<style>
:root{
  --paper:${t.cream}; --ink:${t.ink}; --dim:${t.muted}; --line:${t.ink}22; --hair:${t.ink}12;
  --cool:${t.primary}; --bright:${t.bright}; --hot:${t.accent}; --sand:${t.sand}; --sage:${t.sage};
  --bar:${t.cream}f2;
  --display:"Helvetica Neue",Helvetica,Arial,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif;
  --label:ui-monospace,"SF Mono",Menlo,Consolas,"PingFang SC","Microsoft YaHei",monospace;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --paper:${t.dkBg}; --ink:${t.dkFg}; --dim:#8f9a9f; --line:${t.dkFg}22; --hair:${t.dkFg}12;
  --cool:${t.dkBright}; --sand:${t.dkSand}; --bar:${t.dkBg}f2;
}}
:root[data-theme="dark"]{
  --paper:${t.dkBg}; --ink:${t.dkFg}; --dim:#8f9a9f; --line:${t.dkFg}22; --hair:${t.dkFg}12;
  --cool:${t.dkBright}; --sand:${t.dkSand}; --bar:${t.dkBg}f2;
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--paper);color:var(--ink);font-family:var(--display);
  -webkit-font-smoothing:antialiased;line-height:1.55}
${a11yCss}
${i18nCss}
/* Letterspaced uppercase is a latin device; it makes Chinese look stretched. */
html[data-lang="zh"] .lbl,html[data-lang="zh"] .kick,html[data-lang="zh"] .nl,
html[data-lang="zh"] .btn,html[data-lang="zh"] h2{letter-spacing:.04em}
a{color:inherit;text-decoration:none}
img{max-width:100%}
.lbl,.kick,.nl,.btn{font-family:var(--label);text-transform:uppercase}
.lbl{font-size:.66rem;letter-spacing:.2em}
.kick{font-size:.62rem;letter-spacing:.26em;color:var(--dim);margin-bottom:10px}

/* the bar */
.bar{position:sticky;top:0;z-index:9;background:var(--bar);border-bottom:1px solid transparent;
  backdrop-filter:blur(8px);transition:border-color .2s}
.bar[data-stuck]{border-bottom-color:var(--line)}
.bin{display:flex;align-items:center;justify-content:space-between;gap:24px;
  max-width:1180px;margin:0 auto;padding:0 clamp(18px,4vw,56px)}
.brand{display:flex;align-items:baseline;gap:10px;padding:16px 0;min-width:0}
.brand b{font-size:1.05rem;font-weight:800;letter-spacing:-.02em;text-transform:uppercase;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.brand span{font-family:var(--label);font-size:.58rem;letter-spacing:.16em;text-transform:uppercase;color:var(--dim)}
.links{display:flex;gap:clamp(14px,2vw,30px);align-items:center;overflow-x:auto;scrollbar-width:none}
.links::-webkit-scrollbar{display:none}
.nl{font-size:.66rem;letter-spacing:.2em;color:var(--dim);padding:20px 0;
  border-bottom:2px solid transparent;white-space:nowrap}
.nl:hover{color:var(--ink)}
.nl[data-on]{color:var(--ink);border-bottom-color:var(--hot)}
.right{display:flex;align-items:center;gap:12px}
#status{font-family:var(--label);font-size:.6rem;letter-spacing:.16em;text-transform:uppercase;
  color:var(--dim);white-space:nowrap}
#status[data-open="yes"]{color:var(--sage)}
#status[data-open="no"]{color:var(--hot)}
#lang{font-family:var(--label);font-size:.62rem;letter-spacing:.14em;background:transparent;
  border:1px solid var(--line);color:var(--dim);padding:7px 11px;cursor:pointer;min-height:34px}
#lang:hover{color:var(--ink);border-color:var(--ink)}
.btn{font-size:.66rem;letter-spacing:.18em;padding:11px 20px;border:1px solid var(--ink);display:inline-block}
.btn.hot{background:var(--hot);border-color:var(--hot);color:#fff}
.btn.hot:hover{filter:brightness(1.08)}
.btn:hover{background:var(--ink);color:var(--paper)}
.btn.hot:hover{background:var(--hot);color:#fff}

.wrap{max-width:1180px;margin:0 auto;padding:0 clamp(18px,4vw,56px)}
/* hero */
.hero{padding:clamp(44px,7vw,84px) 0 clamp(38px,6vw,64px);display:flex;flex-direction:column;gap:26px}
h1{font-size:clamp(2.6rem,8.5vw,6.6rem);line-height:.9;font-weight:800;letter-spacing:-.04em;
  text-transform:uppercase;text-wrap:balance;overflow-wrap:break-word}
html[data-lang="zh"] h1{letter-spacing:-.01em;line-height:1.05;font-size:clamp(2.15rem,8vw,6.2rem)}
h1 em{font-style:normal;color:var(--cool)}
.facts{font-family:var(--label);font-size:.68rem;letter-spacing:.16em;text-transform:uppercase;
  color:var(--dim);display:flex;flex-wrap:wrap;gap:6px 22px;align-items:baseline}
.facts .on{color:var(--sage);font-weight:600}
.blurb{font-size:clamp(1.05rem,2vw,1.45rem);line-height:1.5;max-width:38ch;color:var(--dim);text-wrap:pretty}
.acts{display:flex;gap:10px;flex-wrap:wrap;padding-top:2px}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{font-family:var(--label);font-size:.63rem;letter-spacing:.14em;text-transform:uppercase;
  color:var(--dim);border:1px solid var(--line);padding:7px 13px}

.shot{margin-bottom:clamp(30px,5vw,54px);background:var(--sand);overflow:hidden}
.shot img{display:block;width:100%;height:clamp(240px,42vw,520px);object-fit:cover;object-position:center 62%}

/* sections */
section{padding:clamp(38px,6vw,64px) 0;border-top:1px solid var(--line)}
.shead{display:flex;justify-content:space-between;align-items:baseline;gap:24px;margin-bottom:28px;flex-wrap:wrap}
h2{font-size:clamp(1.5rem,3.4vw,2.1rem);font-weight:800;letter-spacing:-.03em;text-transform:uppercase;line-height:1}
.saide{font-family:var(--label);font-size:.64rem;letter-spacing:.16em;text-transform:uppercase;color:var(--dim)}
.note{font-family:var(--label);font-size:.66rem;letter-spacing:.03em;line-height:1.75;color:var(--dim);
  max-width:66ch;margin-top:22px}
ul{list-style:none;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:0 clamp(28px,5vw,56px)}
li{display:flex;align-items:baseline;gap:8px;padding:12px 0;border-bottom:1px solid var(--hair)}
.nm{font-size:1.12rem}
.led{flex:1;border-bottom:1px dotted var(--line);transform:translateY(-.3em)}
.ct{font-family:var(--label);font-size:.66rem;color:var(--dim);font-variant-numeric:tabular-nums;white-space:nowrap}
.grid3{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}
.grid3 figure{margin:0;position:relative;aspect-ratio:4/3;overflow:hidden;background:var(--sand)}
.grid3 img{width:100%;height:100%;object-fit:cover;display:block}
.grid3 figcaption{position:absolute;left:0;right:0;bottom:0;font-family:var(--label);font-size:.53rem;
  letter-spacing:.1em;text-transform:uppercase;color:#fff;padding:16px 8px 6px;
  background:linear-gradient(transparent,rgba(0,0,0,.72));opacity:0;transition:opacity .18s}
.grid3 figure:hover figcaption,.grid3 figure:focus-within figcaption{opacity:1}
.quotes{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:clamp(20px,3vw,32px)}
.quotes figure{margin:0;border-left:2px solid var(--line);padding-left:20px}
.quotes figure:first-child{border-left-color:var(--hot)}
blockquote{font-size:1.06rem;line-height:1.55;text-wrap:pretty}
.quotes figcaption{font-family:var(--label);font-size:.6rem;letter-spacing:.16em;text-transform:uppercase;
  color:var(--dim);margin-top:12px}
.two{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:clamp(28px,5vw,64px)}
table{width:100%;border-collapse:collapse;max-width:420px}
th{text-align:left;font-weight:400;font-family:var(--label);font-size:.66rem;letter-spacing:.14em;
  text-transform:uppercase;color:var(--dim);padding:11px 0;border-bottom:1px solid var(--hair)}
td{text-align:right;padding:11px 0;border-bottom:1px solid var(--hair);font-variant-numeric:tabular-nums}
tr:last-child th,tr:last-child td{border-bottom:0}
tr[data-today] th,tr[data-today] td{color:var(--cool);font-weight:700}
.addr{font-size:clamp(1.35rem,2.6vw,1.9rem);line-height:1.3;letter-spacing:-.02em;max-width:16ch}
.meta{display:flex;flex-direction:column;gap:12px;margin-top:22px}
.meta a{font-family:var(--label);font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:var(--cool)}
.meta .tbd{align-self:flex-start}
footer{border-top:1px solid var(--line);padding:30px 0 40px;display:flex;justify-content:space-between;
  gap:16px;flex-wrap:wrap;font-family:var(--label);font-size:.6rem;letter-spacing:.16em;
  text-transform:uppercase;color:var(--dim)}

/* draft blanks: loud on purpose — they are the agenda for the meeting */
.rule{display:inline-block;height:1.1em;min-width:11em;border-bottom:1px dashed var(--hot);vertical-align:-.15em}
.tbd{font-family:var(--label);font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;
  color:var(--hot);border:1px dashed var(--hot);padding:6px 12px;display:inline-block}
.blank{border:1px dashed var(--line);min-height:64px;display:flex;align-items:center;
  justify-content:center;padding:18px;background:var(--hair)}
.blanks{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}
.blanks .blank{aspect-ratio:16/9;min-height:110px}
/* On paper: no sticky anything, no switch, and sections that do not split
   across a page break. A printed page is what an owner keeps on the counter. */
@media print{
  .bar{position:static;border-bottom:1px solid var(--line)}
  #lang{display:none}
  .btn{background:transparent!important;color:var(--ink)!important;border-color:var(--dim)!important}
  section,.shot,.quotes figure{break-inside:avoid}
  .hero{padding-top:14px}
  .shot img{height:300px}
  footer{border-top:1px solid var(--line)}
}
@media(max-width:760px){
  .bin{flex-wrap:wrap;gap:0;padding-bottom:8px}
  .brand{padding:12px 0 8px}
  .links{order:3;width:100%;gap:8px;padding-bottom:4px}
  .nl{padding:9px 0}
  .acts .btn{flex:1 1 auto;text-align:center}
}
</style>
</head>
<body>

<div class="bar" id="bar">
  <div class="bin">
    <a class="brand" href="#top"><b>${esc(p.name)}</b>${p.suburb ? `<span>${esc(p.suburb)}</span>` : ''}</a>
    <nav class="links">${navHtml}</nav>
    <div class="right">
      ${open ? '<span id="status"></span>' : ''}
      <button type="button" id="lang">中文</button>
      ${tel ? `<a class="btn hot" href="${tel}">${bi('call')}</a>`
            : `<a class="btn" href="${mapsHref(p)}">${bi('directions')}</a>`}
    </div>
  </div>
</div>

<div class="wrap" id="top">
  <div class="hero">
    ${p.categoryZh
      ? biText(esc(p.category) + (p.suburb ? ' &middot; ' + esc(p.suburb) : ''),
               esc(p.categoryZh) + (p.suburb ? ' &middot; ' + esc(p.suburb) : ''),
               { tag: 'div', cls: 'kick' })
      : `<div class="kick">${esc(p.category)}${p.suburb ? ' &middot; ' + esc(p.suburb) : ''}</div>`}
    <h1>${esc(p.name)}</h1>

    <div class="facts">
      ${open ? '<span class="on" id="status2"></span>' : ''}
      ${p.tagline ? `<span>${esc(p.tagline)}</span>` : ''}
      ${p.rating ? biText(`${p.rating} &#9733; &middot; ${p.reviews} Google reviews`,
                          `${p.rating} &#9733; &middot; ${p.reviews} 条 Google 评价`) : ''}
      ${!p.rating && !open ? `<span>${esc(p.shortAddress || p.address)}</span>` : ''}
    </div>

    ${p.summary ? `<p class="blurb">${esc(p.summary)}</p>` : ''}
    ${draft && !p.summary ? `<p class="blurb">${tbd('One sentence about the room, in the owner’s words', '一句话介绍，用店家自己的说法')}</p>` : ''}

    <div class="acts">
      ${tel ? `<a class="btn hot" href="${tel}">${bi('callShop')}</a>`
            : draft ? tbd('Phone number', '电话号码') : ''}
      <a class="btn" href="${mapsHref(p)}">${bi('directions')}</a>
      ${hasMenu ? `<a class="btn" href="#menu">${bi('seeMenu')}</a>` : ''}
    </div>

    ${chips ? `<div class="chips">${chips}</div>` : ''}
  </div>

  ${heroShot ? `<div class="shot">
    <img src="${esc(heroShot.src)}" alt="${esc(p.name)}" decoding="async">
  </div>` : ''}

  ${hasMenu ? section('menu', p.isFood ? 'menuKicker' : 'svcKicker', p.isFood ? 'menuTitle' : 'svcTitle',
      `<ul>${menuRows}</ul>${bi('minedNote', { tag: 'p', cls: 'note blk' })}`,
      p.reviews ? biText(`from ${p.reviews} reviews`, `取自 ${p.reviews} 条评价`) : '')
    : draft ? section('menu', p.isFood ? 'menuKicker' : 'svcKicker', p.isFood ? 'menuTitle' : 'svcTitle',
      `<ul>${[1, 2, 3, 4, 5, 6].map(() => `<li>
           <span class="nm rule"></span><span class="led"></span>
           <span class="ct">${biText('to confirm', '待填')}</span></li>`).join('')}</ul>
       ${biText('The owner supplies the real list — six to ten of the dishes people actually come for. Prices are never guessed here.',
                '菜品清单由店家提供，先列六到十道最招牌的。价格一律不猜，需店家确认。',
                { tag: 'p', cls: 'note blk' })}`) : ''}

  ${hasPhotos ? section('gallery', 'roomKicker', 'roomTitle',
      `<div class="grid3">${plates}</div>${bi(p.photos.some(x => x.local) ? 'photoNoteOwn' : 'photoNote',
        { tag: 'p', cls: 'note blk' })}`)
    : draft ? section('gallery', 'roomKicker', 'roomTitle',
      `<div class="blanks">
         <div class="blank">${tbd('Shopfront', '门头')}</div>
         <div class="blank">${tbd('The room', '店内')}</div>
         <div class="blank">${tbd('Two dishes', '两道菜')}</div>
       </div>${biText('Three shots of the room and two of the food, taken on the owner’s phone, are enough.',
                      '店内两三张、菜品两张，店家手机拍的就够。', { tag: 'p', cls: 'note blk' })}`) : ''}

  ${hasQuotes ? section('reviews', 'saidKicker', 'navReviews',
      `<div class="quotes">${quotes}</div>`,
      p.rating ? `${p.rating} &#9733; &middot; ${p.reviews}` : '') : ''}

  ${open ? section('hours', 'hoursKicker', 'hoursTitle',
      `<div class="two"><table id="hours">${dayRows}</table><div></div></div>`)
    : draft ? section('hours', 'hoursKicker', 'hoursTitle',
      `<div class="two"><table>${DAYS.en.map((en, d) => `<tr>
           <th scope="row">${biText(en, DAYS.zh[d])}</th>
           <td><span class="rule" style="width:9em"></span></td></tr>`).join('')}</table><div></div></div>
       ${biText('Seven rows, filled in once — after that the page works out whether it is open right now, every time someone opens it.',
                '七行填一次即可。之后每次有人打开这个页面，它都会自己算出现在是否营业。',
                { tag: 'p', cls: 'note blk' })}`) : ''}

  ${section('find', 'findKicker', 'findTitle',
    `<div class="two">
       <div>
         <p class="addr">${esc(p.address.replace(/,\s*Australia$/, ''))}</p>
         <div class="meta">
           ${tel ? `<a href="${tel}">${esc(p.phone)}</a>` : draft ? tbd('Phone number', '电话号码') : ''}
           <a href="${mapsHref(p)}">${bi('openMaps')} &rarr;</a>
         </div>
       </div>
       <div class="acts" style="align-items:flex-start">
         ${tel ? `<a class="btn hot" href="${tel}">${bi(p.attrs.includes('Bookings available') ? 'callBook' : 'callShop')}</a>`
               : `<a class="btn" href="${mapsHref(p)}">${bi('directions')}</a>`}
       </div>
     </div>`)}

  <footer>
    <span>${esc(p.name)} &middot; ${esc(p.address)}</span>
    ${draft ? `<span style="color:var(--hot)">${bi('draftNote')}</span>` : ''}
    ${opts.live ? '' : `<span>${bi('demoFooter')}</span>`}
  </footer>
</div>

${langScript(lang)}
${open ? statusScript(p) : ''}
<script>
(function(){
  var bar=document.getElementById('bar'),top=document.getElementById('top');
  if(!('IntersectionObserver' in window))return;

  // The bar stays quiet until you have left the hero — up there the name is
  // already the biggest thing on the screen, and a rule under it is noise.
  new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(e.isIntersecting&&e.boundingClientRect.top>=0) bar.removeAttribute('data-stuck');
      else bar.setAttribute('data-stuck','');
    });
  },{rootMargin:'-72px 0px 0px 0px'}).observe(top);

  var links={};
  [].forEach.call(document.querySelectorAll('.nl'),function(a){links[a.getAttribute('data-nav')]=a;});
  var spy=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting)return;
      for(var k in links)links[k].removeAttribute('data-on');
      links[e.target.id].setAttribute('data-on','');
    });
  },{rootMargin:'-45% 0px -50% 0px'});
  [].forEach.call(document.querySelectorAll('section[id]'),function(s){ if(links[s.id])spy.observe(s); });
})();
</script>
</body>
</html>`;
}

/**
 * Open/closed, computed in the browser from the real periods, in both
 * languages at once. Built with DOM calls rather than innerHTML so the
 * bilingual spans stay inert markup the switch can hide.
 */
function statusScript(p) {
  const json = JSON.stringify(Object.fromEntries(
    p.hours.map(h => [h.day, h.open == null ? null : [h.open, h.close]])));
  const S = JSON.stringify({
    openNow: T.openNow, closed: T.closed, closedToday: T.closedToday,
    until: T.until, opens: T.opens, today: T.today, tomorrow: T.tomorrow,
  });
  return `<script>
(function(){
  var h=${json},S=${S};
  var f=function(x){var m=Math.round((x%1)*60),H=Math.floor(x)%24,ap=H<12?'am':'pm',d=H%12||12;
    return d+':'+String(m).padStart(2,'0')+ap;};
  var n=new Date(),d=n.getDay(),c=n.getHours()+n.getMinutes()/60,t=h[d];
  var open=!!t&&c>=t[0]&&c<t[1];
  var say=function(i){
    if(!t)return S.closedToday[i];
    if(open)return S.openNow[i]+' · '+S.until[i]+' '+f(t[1]);
    return S.closed[i]+' · '+S.opens[i]+' '+f(t[0])+' '+(c>=t[1]?S.tomorrow[i]:S.today[i]);
  };
  ['status','status2'].forEach(function(id){
    var el=document.getElementById(id);
    if(!el)return;
    el.className=(el.className?el.className+' ':'')+'i18n';
    el.setAttribute('data-open',open?'yes':'no');
    [['en',0],['zh',1]].forEach(function(pair){
      var s=document.createElement('span');
      s.setAttribute('data-l',pair[0]);
      s.textContent=say(pair[1]);
      el.appendChild(s);
    });
  });
  var r=document.querySelector('#hours [data-d="'+d+'"]');if(r)r.setAttribute('data-today','');
})();
</script>`;
}
