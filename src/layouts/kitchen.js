// KITCHEN — the layout a restaurant that has paid you gets.
//
// Direction C from the client's own pick, with A's signature-dish device:
// a red masthead, a split hero where the photograph takes half the screen
// and the two things a hungry person wants take the other half (a phone
// number and a way to get here), one full-bleed feature for the dish the
// kitchen is known for, dish cards with prices where the owner supplied
// them, and a practical strip that answers when / where / how to book.
//
// Rules that do not change with the money: prices appear only where the
// owner supplied one, dish names stay marked until they confirm them, and
// nothing about the food is invented by this file.

import { esc, head, mapsHref, telHref, a11yCss } from '../render-utils.js';
import { T, DAYS, HTML_LANG, ATTR_ZH, bi, biText, i18nCss, langScript } from '../i18n.js';

export function render(p, t, opts = {}) {
  const lang = opts.lang === 'zh' ? 'zh' : 'en';
  const draft = !!opts.draft;
  const tel = telHref(p);
  const open = p.hours.some(h => h.open != null);
  const byFile = new Map(p.photos.filter(x => x.file).map(x => [x.file, x]));

  const feature = p.dishes.find(d => d.feature) ?? p.dishes[0] ?? null;
  const featureShot = feature ? byFile.get(feature.photo) : null;
  const heroShot = p.photos.find(x => x !== featureShot) ?? p.photos[0] ?? null;
  const cards = p.dishes.filter(d => d !== feature);

  const price = d => d.price
    ? `<span class="pr">${esc(d.price)}</span>`
    : draft ? `<span class="pr tbd">${bi('priceTbd')}</span>` : '';

  const nav = [
    ['menu', p.isFood ? 'navMenu' : 'navServices'],
    ...(feature ? [['signature', 'featureKick']] : []),
    ...(open ? [['hours', 'navHours']] : []),
    ['find', 'navFind'],
  ];

  const pills = [
    ...(p.categoryZh || p.category ? [[esc(p.category), esc(p.categoryZh || p.category)]] : []),
    ...p.awards.map(a => [esc(a.en), esc(a.zh)]),
  ].map(([en, zh]) => biText(en, zh, { tag: 'span', cls: 'pill' })).join('');

  const cardHtml = cards.map(d => {
    const ph = byFile.get(d.photo);
    return `<figure class="card">
      ${ph ? `<span class="ph"><img src="${esc(ph.src)}" alt="${esc(d.title)}" decoding="async"${
        ph.src.startsWith('data:') ? '' : ' loading="lazy"'}></span>` : '<span class="ph none"></span>'}
      <figcaption>
        <span class="nm">${d.titleEn ? biText(esc(d.titleEn), esc(d.title)) : esc(d.title)}
          ${d.titleEn ? biText(esc(d.title), esc(d.titleEn), { tag: 'i', cls: 'en' }) : ''}</span>
        ${price(d)}
      </figcaption>
    </figure>`;
  }).join('');

  const weekRows = p.hours.map(h => `<div class="wrow" data-d="${h.day}">
      <span class="d">${biText(DAYS.en[h.day], DAYS.zh[h.day])}</span>
      <span class="t">${h.open == null ? bi('closed') : esc(h.text)}</span></div>`).join('');

  const chips = p.attrs.map(a => ATTR_ZH[a]
    ? biText(esc(a), esc(ATTR_ZH[a]), { tag: 'span', cls: 'chip' })
    : `<span class="chip">${esc(a)}</span>`).join('');

  const lede = p.lede || p.ledeZh
    ? biText(esc(p.lede || p.ledeZh), esc(p.ledeZh || p.lede), { tag: 'p', cls: 'lede blk' })
    : draft ? `<p class="lede"><span class="tbd">${bi('ledeTbd')}</span></p>` : '';

  return `<!doctype html>
<html lang="${HTML_LANG[lang]}" data-lang="${lang}">
<head>
${head(p, opts)}
<style>
:root{
  --red:${t.primary}; --deep:${t.ink}; --hot:${t.bright}; --gold:${t.accent};
  --paper:#fff; --wash:${t.cream}; --sand:${t.sand}; --ink:${t.ink}; --dim:${t.muted};
  --line:${t.ink}1f; --hair:${t.ink}12;
  --sans:system-ui,-apple-system,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Segoe UI",Roboto,sans-serif;
  --label:ui-monospace,"SF Mono",Menlo,Consolas,"PingFang SC",monospace;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --paper:${t.dkCard}; --wash:${t.dkBg}; --sand:${t.dkSand}; --ink:${t.dkFg}; --dim:#9aa3a6;
  --line:${t.dkFg}1f; --hair:${t.dkFg}12; --deep:#140b09;
}}
:root[data-theme="dark"]{
  --paper:${t.dkCard}; --wash:${t.dkBg}; --sand:${t.dkSand}; --ink:${t.dkFg}; --dim:#9aa3a6;
  --line:${t.dkFg}1f; --hair:${t.dkFg}12; --deep:#140b09;
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--paper);color:var(--ink);font-family:var(--sans);line-height:1.6;
  -webkit-font-smoothing:antialiased}
${a11yCss}
${i18nCss}
a{color:inherit;text-decoration:none}
img{max-width:100%}
.lbl{font-family:var(--label);font-size:.62rem;letter-spacing:.18em;text-transform:uppercase}
html[data-lang="zh"] .lbl{letter-spacing:.06em}
.wrap{max-width:1240px;margin:0 auto;padding:0 clamp(18px,3.5vw,44px)}

/* masthead */
.mast{background:var(--red);color:#fff;position:sticky;top:0;z-index:9}
.mast .in{max-width:1240px;margin:0 auto;padding:12px clamp(18px,3.5vw,44px);
  display:flex;align-items:center;justify-content:space-between;gap:20px}
.brand{display:flex;align-items:baseline;gap:11px;min-width:0}
.brand b{font-size:1.3rem;font-weight:900;letter-spacing:.04em;white-space:nowrap;
  overflow:hidden;text-overflow:ellipsis}
.brand span{opacity:.72}
.nav{display:flex;gap:clamp(12px,1.8vw,26px);align-items:center;overflow-x:auto;scrollbar-width:none}
.nav::-webkit-scrollbar{display:none}
.nav a{font-size:.93rem;font-weight:500;white-space:nowrap;opacity:.92;padding:6px 0;
  border-bottom:2px solid transparent}
.nav a:hover{opacity:1}
.nav a[data-on]{opacity:1;border-bottom-color:#fff}
#lang{font:inherit;font-size:.72rem;letter-spacing:.1em;background:transparent;color:#fff;
  border:1px solid #ffffff66;border-radius:6px;padding:6px 10px;cursor:pointer;min-height:32px}
#lang:hover{background:#ffffff1f}

/* hero: photograph one side, the two useful things the other */
.hero{display:grid;grid-template-columns:1.05fr .95fr;background:var(--deep);color:#fff}
.hero>img{width:100%;height:100%;min-height:340px;max-height:520px;object-fit:cover;display:block}
.pitch{padding:clamp(28px,3.6vw,50px) clamp(20px,3.4vw,46px);display:flex;flex-direction:column;
  justify-content:center;gap:16px}
.pills{display:flex;flex-wrap:wrap;gap:8px}
.pill{display:inline-flex;align-items:center;background:#ffffff1f;border:1px solid #ffffff40;
  color:#fff;padding:6px 13px;border-radius:999px;font-size:.8rem;line-height:1.4}
h1{font-size:clamp(1.9rem,3.4vw,2.9rem);font-weight:900;line-height:1.22;letter-spacing:.01em}
.lede{font-size:clamp(.98rem,1.3vw,1.06rem);line-height:1.75;color:#ffffffd4;max-width:34ch}
.acts{display:flex;gap:11px;flex-wrap:wrap;margin-top:4px}
.go{background:#fff;color:var(--red);font-weight:700;padding:14px 24px;border-radius:8px;display:inline-block}
.go:hover{filter:brightness(.95)}
.ghost{border:1.5px solid #ffffffb3;color:#fff;font-weight:700;padding:14px 24px;border-radius:8px;display:inline-block}
.ghost:hover{background:#ffffff1a}
#status{font-family:var(--label);font-size:.66rem;letter-spacing:.14em;text-transform:uppercase;color:#ffffffb8}
#status[data-open="yes"]{color:#c9e7c6}

/* signature: one dish, full bleed */
.feature{position:relative;background:var(--deep);color:#fff;overflow:hidden}
.feature img{width:100%;height:clamp(300px,42vw,470px);object-fit:cover;display:block;filter:brightness(.52)}
.feature .txt{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;
  padding:clamp(24px,4vw,52px);gap:12px;
  background:linear-gradient(transparent 30%,rgba(0,0,0,.82))}
.feature .kick{font-family:var(--label);font-size:.64rem;letter-spacing:.24em;text-transform:uppercase;color:var(--gold)}
.feature h2{font-size:clamp(2rem,5vw,3.6rem);font-weight:900;letter-spacing:.03em;line-height:1.1}
.feature .en{font-family:var(--label);font-size:.68rem;letter-spacing:.16em;text-transform:uppercase;color:#ffffffb0}
.feature p{max-width:38ch;color:#ffffffd6;font-size:1.02rem}
.feature .pr{font-weight:700}

/* sections */
.sec{padding:clamp(34px,4.5vw,60px) 0}
.shead{display:flex;justify-content:space-between;align-items:baseline;gap:20px;margin-bottom:22px;flex-wrap:wrap}
h2.t{font-size:clamp(1.5rem,2.6vw,2rem);font-weight:900;letter-spacing:.01em}
.more{color:var(--red);font-weight:600;font-size:.9rem}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:clamp(12px,1.6vw,18px)}
.card{margin:0;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--paper)}
.card .ph{display:block;aspect-ratio:4/3;overflow:hidden;background:var(--sand)}
.card .ph img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .45s ease}
.card:hover .ph img{transform:scale(1.045)}
.card figcaption{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:14px 16px 16px}
.card .nm{font-size:1.08rem;font-weight:700}
.card .en{display:block;font-style:normal;font-size:.72rem;font-weight:400;color:var(--dim);margin-top:2px}
html[data-lang="en"] .card .en [data-l="en"],
html[data-lang="zh"] .card .en [data-l="zh"]{display:block}
.card .pr{font-weight:700;color:var(--red);white-space:nowrap}
.card .pr.tbd{color:var(--dim);font-weight:400;font-size:.72rem;border:1px dashed var(--dim);
  padding:4px 8px;border-radius:6px}
.note{font-family:var(--label);font-size:.66rem;line-height:1.75;color:var(--dim);max-width:64ch;margin-top:20px}

/* practical strip */
.strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:clamp(12px,1.6vw,18px)}
.box{background:var(--wash);border-radius:10px;padding:22px 24px}
.box .k{font-family:var(--label);font-size:.62rem;letter-spacing:.16em;text-transform:uppercase;color:var(--dim)}
.box .v{font-size:1.12rem;font-weight:700;margin-top:8px;line-height:1.6}
.box .v.tel{font-size:1.35rem;color:var(--red)}
.wrow{display:flex;justify-content:space-between;gap:14px;padding:7px 0;border-bottom:1px solid var(--hair);font-size:.92rem}
.wrow .d{white-space:nowrap;min-width:2.8em}
.wrow .t{text-align:right;line-height:1.45}
.wrow:last-child{border-bottom:0}
.wrow .d{color:var(--dim);white-space:nowrap}
.wrow .t{font-variant-numeric:tabular-nums}
.wrow[data-today] .d,.wrow[data-today] .t{color:var(--red);font-weight:700}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.chip{font-size:.8rem;color:var(--dim);border:1px solid var(--line);border-radius:999px;padding:5px 12px}
.tbd{font-family:var(--label);font-size:.68rem;letter-spacing:.1em;color:var(--gold);
  border:1px dashed var(--gold);padding:5px 10px;border-radius:6px;display:inline-block}

footer{background:var(--wash);margin-top:clamp(30px,4vw,54px)}
footer .in{max-width:1240px;margin:0 auto;padding:26px clamp(18px,3.5vw,44px) 34px;display:flex;
  justify-content:space-between;gap:14px;flex-wrap:wrap;font-size:.82rem;color:var(--dim)}

/* thumb bar */
.dock{display:none}
@media(max-width:560px){
  .brand b{font-size:1.06rem}
  .brand span{display:none}
}
@media(max-width:820px){
  .hero{grid-template-columns:1fr}
  .hero>img{max-height:300px}
  body{padding-bottom:74px}
  .dock{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:10;gap:9px;padding:10px 14px;
    background:var(--paper);border-top:1px solid var(--line)}
  .dock a{flex:1;text-align:center;padding:14px 10px;border-radius:8px;font-weight:700;font-size:.95rem}
  .dock .go{background:var(--red);color:#fff}
  .dock .alt{border:1px solid var(--line);color:var(--ink)}
}
@media print{
  .mast{position:static}
  #lang,.dock{display:none}
  .go,.ghost{border:1px solid #999!important;background:transparent!important;color:#000!important}
  .card,.box,.feature,.hero{break-inside:avoid}
}
</style>
</head>
<body>

<header class="mast">
  <div class="in">
    <a class="brand" href="#top"><b>${esc(p.name)}</b>${p.suburb ? `<span class="lbl">${esc(p.suburb)}</span>` : ''}</a>
    <nav class="nav">${nav.map(([id, key]) => `<a href="#${id}" data-nav="${id}">${bi(key)}</a>`).join('')}</nav>
    <button type="button" id="lang">中文</button>
  </div>
</header>

<section class="hero" id="top">
  ${heroShot ? `<img src="${esc(heroShot.src)}" alt="${esc(p.name)}" decoding="async">` : '<div></div>'}
  <div class="pitch">
    ${pills ? `<div class="pills">${pills}</div>` : ''}
    <h1>${esc(p.name)}</h1>
    ${lede}
    <div class="acts">
      ${tel ? `<a class="go" href="${tel}">${bi('callBook')} ${esc(p.phone)}</a>`
            : draft ? `<span class="tbd">${biText('Phone number', '电话号码')}</span>` : ''}
      <a class="ghost" href="${mapsHref(p)}">${bi('directions')}</a>
    </div>
    ${open ? '<div id="status"></div>' : ''}
  </div>
</section>

${feature ? `<section class="feature" id="signature">
  ${featureShot ? `<img src="${esc(featureShot.src)}" alt="${esc(feature.title)}" decoding="async">`
    : '<div style="height:320px;background:var(--deep)"></div>'}
  <div class="txt">
    ${bi('featureKick', { tag: 'div', cls: 'kick' })}
    <h2>${esc(feature.title)}</h2>
    ${feature.titleEn ? `<div class="en">${esc(feature.titleEn)}</div>` : ''}
    ${feature.blurb || feature.blurbEn
      ? biText(esc(feature.blurbEn || feature.blurb), esc(feature.blurb || feature.blurbEn), { tag: 'p', cls: 'blk' })
      : ''}
    ${feature.price ? `<div class="pr">${esc(feature.price)}</div>` : ''}
    <div class="acts"><a class="go" href="#menu">${bi('allDishes')}</a></div>
  </div>
</section>` : ''}

<div class="wrap">
  <section class="sec" id="menu">
    <div class="shead">
      <h2 class="t">${bi(p.isFood ? 'menuTitle' : 'svcTitle')}</h2>
      <span class="more">${biText(`${p.dishes.length} dishes`, `共 ${p.dishes.length} 道`)}</span>
    </div>
    ${cardHtml ? `<div class="cards">${cardHtml}</div>` : ''}
    ${bi(p.dishes.some(d => d.supplied) ? 'suppliedMenu' : 'minedNote', { tag: 'p', cls: 'note blk' })}
  </section>

  <section class="sec strip" id="hours">
    <div class="box">
      <div class="k">${bi('thisWeek')}</div>
      ${open ? weekRows : `<div class="v">${draft ? `<span class="tbd">${biText('Opening hours', '营业时间')}</span>` : ''}</div>`}
      ${draft && open ? bi('sampleHours', { tag: 'p', cls: 'note blk' }) : ''}
    </div>
    <div class="box" id="find">
      <div class="k">${bi('findTitle')}</div>
      <div class="v">${esc(p.address.replace(/,\s*Australia$/, ''))}</div>
      <a class="more" style="display:inline-block;margin-top:10px" href="${mapsHref(p)}">${bi('openMaps')} &rarr;</a>
      ${chips ? `<div class="chips">${chips}</div>` : ''}
    </div>
    <div class="box">
      <div class="k">${bi('bookTakeaway')}</div>
      ${tel ? `<div class="v tel">${esc(p.phone)}</div>
        <a class="go" style="margin-top:14px;display:block;text-align:center" href="${tel}">${bi('call')}</a>`
        : `<div class="v">${draft ? `<span class="tbd">${biText('Phone number', '电话号码')}</span>` : ''}</div>`}
      ${draft && p.demoPhone ? `<div style="margin-top:10px"><span class="tbd">${biText('Example number', '示例号码')}</span></div>` : ''}
    </div>
  </section>
</div>

<footer><div class="in">
  <span>${esc(p.name)} &middot; ${esc(p.address.replace(/,\s*Australia$/, ''))}</span>
  ${draft ? `<span style="color:var(--gold)">${bi('draftNote')}</span>` : ''}
  ${opts.live ? '' : `<span>${bi('demoFooter')}</span>`}
</div></footer>

<nav class="dock">
  ${tel ? `<a class="go" href="${tel}">${bi('callShop')}</a>` : ''}
  <a class="alt" href="${mapsHref(p)}">${bi('directions')}</a>
</nav>

${langScript(lang)}
${open ? statusScript(p) : ''}
<script>
(function(){
  if(!('IntersectionObserver' in window))return;
  var links={};
  [].forEach.call(document.querySelectorAll('.nav a'),function(a){links[a.getAttribute('data-nav')]=a;});
  var spy=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting)return;
      for(var k in links)links[k].removeAttribute('data-on');
      if(links[e.target.id])links[e.target.id].setAttribute('data-on','');
    });
  },{rootMargin:'-45% 0px -50% 0px'});
  [].forEach.call(document.querySelectorAll('[id]'),function(s){ if(links[s.id])spy.observe(s); });
})();
</script>
</body>
</html>`;
}

/** Open/closed in both languages, aware of a kitchen that shuts between sittings. */
function statusScript(p) {
  const json = JSON.stringify(Object.fromEntries(
    p.hours.map(h => [h.day, h.spans.length ? h.spans : null])));
  const S = JSON.stringify({
    openNow: T.openNow, closed: T.closed, closedToday: T.closedToday,
    until: T.until, opens: T.opens, today: T.today, tomorrow: T.tomorrow,
  });
  return `<script>
(function(){
  var h=${json},S=${S};
  var f=function(x){var m=Math.round((x%1)*60),H=Math.floor(x)%24,ap=H<12?'am':'pm',d=H%12||12;
    return d+':'+String(m).padStart(2,'0')+ap;};
  var n=new Date(),d=n.getDay(),c=n.getHours()+n.getMinutes()/60,t=h[d],tm=h[(d+1)%7];
  var cur=null,next=null,i;
  if(t)for(i=0;i<t.length;i++){ if(c>=t[i][0]&&c<t[i][1]){cur=t[i];break;}
    if(c<t[i][0]&&!next)next=t[i]; }
  var open=!!cur;
  var say=function(i){
    if(open)return S.openNow[i]+' · '+S.until[i]+' '+f(cur[1]);
    if(next)return S.closed[i]+' · '+S.opens[i]+' '+f(next[0])+' '+S.today[i];
    if(tm)return S.closed[i]+' · '+S.opens[i]+' '+f(tm[0][0])+' '+S.tomorrow[i];
    return S.closedToday[i];
  };
  var el=document.getElementById('status');
  if(el){
    el.className=(el.className?el.className+' ':'')+'i18n';
    el.setAttribute('data-open',open?'yes':'no');
    [['en',0],['zh',1]].forEach(function(pair){
      var s=document.createElement('span');
      s.setAttribute('data-l',pair[0]);
      s.textContent=say(pair[1]);
      el.appendChild(s);
    });
  }
  [].forEach.call(document.querySelectorAll('[data-d="'+d+'"]'),function(r){r.setAttribute('data-today','');});
})();
</script>`;
}
