// STOREFRONT — the approved design, generated.
//
// This layout is the canvas design landed as code: the same sticky bar, the
// same hero (rail, oversized name, facts line, three actions, day-bar,
// attribute chips), the same section rhythm — menu, gallery, reviews, then
// hours and find-us side by side — down to the type scale and spacing.
//
// What it refuses to do is manufacture structure the listing cannot fill: no
// functions page with no packages behind it, no booking form we cannot
// honour. A nav item exists only when its section has data. In --draft the
// gaps become marked blanks instead, because a blank you fill in with the
// owner is worth more than a section you quietly drop.
//
// Bilingual by construction: both languages ship in the file and the switch
// is CSS, so the page stays one self-contained thing you can message.

import { esc, head, mapsHref, telHref, a11yCss } from '../render-utils.js';
import { T, DAYS, HTML_LANG, ATTR_ZH, bi, biText, i18nCss, langScript } from '../i18n.js';

export function render(p, t, opts = {}) {
  const lang = opts.lang === 'zh' ? 'zh' : 'en';
  const draft = !!opts.draft;
  const tel = telHref(p);
  const open = p.hours.some(h => h.open != null);
  const hasMenu = p.dishes.length > 0;
  const hasPhotos = p.photos.length > 0;
  const hasQuotes = p.quotes.length > 0;
  const supplied = p.dishes.some(d => d.supplied);
  const menuKicker = p.isFood ? 'menuKicker' : 'svcKicker';
  const menuTitle = p.isFood ? 'menuTitle' : 'svcTitle';

  const nav = [];
  if (hasMenu || draft) nav.push(['menu', p.isFood ? 'navMenu' : 'navServices']);
  if (hasPhotos || draft) nav.push(['gallery', 'navGallery']);
  if (hasQuotes) nav.push(['reviews', 'navReviews']);
  if (open || draft) nav.push(['hours', 'navHours']);
  nav.push(['find', 'navFind']);

  const tbd = (en, zh) => `<span class="tbd">${biText(en, zh)}</span>`;

  // ---- the day-bar: the week to scale, one fill per sitting ---------------
  const spans = p.hours.filter(h => h.open != null);
  const lo = spans.length ? Math.floor(Math.min(...spans.map(h => h.open))) : 9;
  const hi = spans.length ? Math.ceil(Math.max(...spans.map(h => h.close))) : 21;
  const pct = x => ((x - lo) / (hi - lo) * 100).toFixed(2);
  const ticks = [];
  for (let h = lo; h <= hi; h += (hi - lo > 10 ? 3 : 2))
    ticks.push(`<span class="tick" style="left:${pct(h)}%"><i></i><b>${h % 12 || 12}${h < 12 ? 'a' : 'p'}</b></span>`);

  const weekRows = p.hours.map(h => `<div class="hrow" data-d="${h.day}">
      <span class="d">${biText(DAYS.en[h.day].slice(0, 3), DAYS.zh[h.day])}</span>
      <span class="track">${h.spans.map(([o, c]) =>
        `<span class="fill" style="left:${pct(o)}%;width:${(pct(Math.min(c, hi)) - pct(o)).toFixed(2)}%"></span>`).join('')}</span>
      <span class="tm">${h.open == null ? bi('closed') : esc(h.text)}</span></div>`).join('');

  // ---- sections ----------------------------------------------------------
  const dishRows = p.dishes.map(d => `<div class="dish">
      <span class="nm">${d.titleEn
        ? biText(esc(d.titleEn), esc(d.title)) + biText(esc(d.title), esc(d.titleEn), { tag: 'i', cls: 'en' })
        : esc(d.title)}</span>
      <span class="led"></span>
      <span class="ct">${d.supplied ? bi('tbc') : p.isFood ? `${d.mentions}&times;` : bi('enquire')}</span>
    </div>`).join('');

  const plates = p.photos.map((ph, i) => `<figure class="plate">
      <img src="${esc(ph.src)}" alt="${esc(p.name)} ${i + 1}" decoding="async"${
        ph.src.startsWith('data:') ? '' : ' loading="lazy"'}>
      ${ph.author ? `<figcaption>${esc(ph.author)}</figcaption>` : ''}</figure>`).join('');

  const quotes = p.quotes.map(q => `<figure>
      <blockquote>${esc(q.text)}</blockquote>
      <figcaption>${esc(q.author)}, Google</figcaption></figure>`).join('');

  const hourRows = p.hours.map(h => `<div class="hline" data-d="${h.day}">
      <span class="d">${biText(DAYS.en[h.day], DAYS.zh[h.day])}</span>
      <span class="t">${h.open == null ? bi('closed') : esc(h.text)}</span></div>`).join('');

  const chips = p.attrs.map(a => ATTR_ZH[a]
    ? biText(esc(a), esc(ATTR_ZH[a]), { tag: 'span', cls: 'chip' })
    : `<span class="chip">${esc(a)}</span>`).join('');

  const head2 = (kicker, title, aside = '') => `<div class="rowhead">
      <div>${bi(kicker, { tag: 'div', cls: 'kick' })}${bi(title, { tag: 'h2' })}</div>
      ${aside ? `<span class="lbl aside">${aside}</span>` : ''}
    </div>`;

  // The last word of a name carries the accent, the way the design has it.
  const title = esc(p.name).replace(/\s+(\S+)$/, ' <em>$1</em>');

  return `<!doctype html>
<html lang="${HTML_LANG[lang]}" data-lang="${lang}">
<head>
${head(p, opts)}
<style>
:root{
  --paper:${t.cream}; --ink:${t.ink}; --dim:${t.muted}; --line:${t.ink}22; --hair:${t.ink}14;
  --cool:${t.primary}; --bright:${t.bright}; --hot:${t.accent}; --sand:${t.sand}; --sage:${t.sage};
  --bar:${t.cream}f2;
  --display:"Helvetica Neue",Helvetica,Arial,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif;
  --label:ui-monospace,"SF Mono",Menlo,Consolas,"PingFang SC","Microsoft YaHei",monospace;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --paper:${t.dkBg}; --ink:${t.dkFg}; --dim:#8f9a9f; --line:${t.dkFg}22; --hair:${t.dkFg}14;
  --cool:${t.dkBright}; --sand:${t.dkSand}; --bar:${t.dkBg}f2;
}}
:root[data-theme="dark"]{
  --paper:${t.dkBg}; --ink:${t.dkFg}; --dim:#8f9a9f; --line:${t.dkFg}22; --hair:${t.dkFg}14;
  --cool:${t.dkBright}; --sand:${t.dkSand}; --bar:${t.dkBg}f2;
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--paper);color:var(--ink);font-family:var(--display);
  -webkit-font-smoothing:antialiased;line-height:1.5}
${a11yCss}
${i18nCss}
a{color:inherit;text-decoration:none}
a:hover{color:var(--hot)}
img{max-width:100%}
.lbl{font-family:var(--label);font-size:.66rem;letter-spacing:.2em;text-transform:uppercase}
.kick{font-family:var(--label);font-size:.62rem;letter-spacing:.26em;text-transform:uppercase;
  color:var(--dim);margin-bottom:10px}
/* letterspaced uppercase is a latin device — it stretches Chinese */
html[data-lang="zh"] .lbl,html[data-lang="zh"] .kick,html[data-lang="zh"] .navlink,
html[data-lang="zh"] .btn,html[data-lang="zh"] h2,html[data-lang="zh"] .chip{letter-spacing:.05em}

/* bar */
.bar{position:sticky;top:0;z-index:9;background:var(--bar);border-bottom:1px solid transparent;
  backdrop-filter:blur(8px);transition:border-color .2s}
.bar[data-stuck]{border-bottom-color:var(--line)}
.bin{display:flex;align-items:center;justify-content:space-between;gap:24px;
  max-width:1280px;margin:0 auto;padding:0 clamp(18px,4vw,56px)}
.brand{display:flex;align-items:baseline;gap:10px;padding:20px 0;min-width:0}
.brand b{font-size:1.05rem;font-weight:800;letter-spacing:-.02em;text-transform:uppercase;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.brand span{font-family:var(--label);font-size:.58rem;letter-spacing:.16em;text-transform:uppercase;color:var(--dim)}
.links{display:flex;gap:clamp(14px,2.2vw,30px);align-items:center;overflow-x:auto;scrollbar-width:none}
.links::-webkit-scrollbar{display:none}
.navlink{font-family:var(--label);font-size:.66rem;letter-spacing:.2em;text-transform:uppercase;
  color:var(--dim);padding:22px 0;border-bottom:2px solid transparent;white-space:nowrap}
.navlink:hover{color:var(--ink)}
.navlink[data-on]{color:var(--ink);border-bottom-color:var(--hot)}
.right{display:flex;align-items:center;gap:12px}
#status{font-family:var(--label);font-size:.6rem;letter-spacing:.16em;text-transform:uppercase;
  color:var(--dim);white-space:nowrap}
#status[data-open="yes"]{color:var(--sage)}
#status[data-open="no"]{color:var(--hot)}
#lang{font-family:var(--label);font-size:.62rem;letter-spacing:.14em;background:transparent;
  border:1px solid var(--line);color:var(--dim);padding:8px 11px;cursor:pointer;min-height:34px}
#lang:hover{color:var(--ink);border-color:var(--ink)}
.btn{font-family:var(--label);font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;
  padding:14px 26px;border:1px solid var(--ink);display:inline-block;transition:.15s}
.btn:hover{background:var(--ink);color:var(--paper)}
.btn.hot{background:var(--hot);border-color:var(--hot);color:#fff}
.btn.hot:hover{background:var(--hot);color:#fff;filter:brightness(1.1)}
.btn.sm{padding:11px 20px;font-size:.66rem}

.wrap{max-width:1280px;margin:0 auto;padding:0 clamp(18px,4vw,56px)}
/* hero */
.hero{padding:clamp(40px,6vw,76px) 0 clamp(38px,5vw,64px);display:flex;flex-direction:column;
  gap:clamp(22px,2.6vw,34px)}
.rail{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;
  font-family:var(--label);font-size:.66rem;letter-spacing:.2em;text-transform:uppercase;color:var(--dim)}
h1{font-size:clamp(2.6rem,9vw,8.4rem);line-height:.86;font-weight:800;letter-spacing:-.045em;
  text-transform:uppercase;text-wrap:balance;overflow-wrap:break-word}
html[data-lang="zh"] h1{letter-spacing:-.01em;line-height:1.02;font-size:clamp(2.2rem,8vw,7.2rem)}
h1 em{font-style:normal;color:var(--cool)}
.facts{font-family:var(--label);font-size:clamp(.68rem,1.3vw,.8rem);letter-spacing:.2em;
  text-transform:uppercase;color:var(--dim);display:flex;flex-wrap:wrap;gap:6px 22px;align-items:baseline}
.facts .on{color:var(--sage);font-weight:600}
.blurb{font-size:clamp(1.05rem,2vw,1.5rem);line-height:1.45;max-width:32ch;color:var(--dim);text-wrap:pretty}
.acts{display:flex;gap:12px;flex-wrap:wrap;padding-top:2px}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{font-family:var(--label);font-size:.63rem;letter-spacing:.14em;text-transform:uppercase;
  color:var(--dim);border:1px solid var(--line);padding:7px 13px}

/* day-bar */
.week{border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:18px 0;margin-top:8px}
.hrow{display:flex;align-items:center;gap:14px;padding:5px 0}
.hrow .d{font-family:var(--label);font-size:.66rem;letter-spacing:.12em;text-transform:uppercase;
  color:var(--dim);width:3.2em}
.hrow .track{position:relative;flex:1;height:7px;background:var(--line);border-radius:1px}
.hrow .fill{position:absolute;top:0;bottom:0;background:var(--dim);border-radius:1px}
.hrow .tm{font-family:var(--label);font-size:.62rem;color:var(--dim);width:22em;text-align:right;
  font-variant-numeric:tabular-nums}
.hrow[data-today] .d,.hrow[data-today] .tm{color:var(--ink);font-weight:700}
.hrow[data-today] .fill{background:var(--cool)}
.axis{position:relative;height:1.2em;margin:10px 22em 0 3.2em}
.tick{position:absolute;transform:translateX(-50%);font-family:var(--label);font-size:.6rem;color:var(--dim)}
.tick i{display:block;width:1px;height:4px;background:var(--line);margin:0 auto 3px}
#nowline{position:absolute;top:-4px;bottom:0;width:1px;background:var(--hot)}
#nowline::before{content:"";position:absolute;top:-3px;left:-2.5px;width:6px;height:6px;
  border-radius:50%;background:var(--hot)}
@media(max-width:640px){.hrow .tm{display:none}.axis{margin-right:0}}

/* sections */
.sec{padding:clamp(38px,5vw,64px) 0;border-top:1px solid var(--line)}
.rowhead{display:flex;justify-content:space-between;align-items:baseline;gap:24px;
  margin-bottom:30px;flex-wrap:wrap}
h2{font-size:clamp(1.5rem,3.2vw,2.1rem);font-weight:800;letter-spacing:-.03em;
  text-transform:uppercase;line-height:1}
.aside{color:var(--dim);font-size:.64rem}
.note{font-family:var(--label);font-size:.66rem;letter-spacing:.04em;line-height:1.7;
  color:var(--dim);max-width:64ch;margin-top:24px}
.menu{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:0 clamp(28px,4.5vw,56px)}
.dish{display:flex;align-items:baseline;gap:8px;padding:12px 0;border-bottom:1px solid var(--hair)}
.dish .nm{font-size:1.15rem}
.dish .en{display:block;font-style:normal;font-family:var(--label);font-size:.6rem;letter-spacing:.1em;
  text-transform:uppercase;color:var(--dim);margin-top:3px}
html[data-lang="en"] .dish .en [data-l="en"],
html[data-lang="zh"] .dish .en [data-l="zh"]{display:block}
.dish .led{flex:1;border-bottom:1px dotted var(--line);transform:translateY(-.3em)}
.dish .ct{font-family:var(--label);font-size:.66rem;color:var(--dim);font-variant-numeric:tabular-nums;
  white-space:nowrap}
.grid3{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px}
.plate{position:relative;aspect-ratio:4/3;background:var(--sand);overflow:hidden;margin:0}
.plate img{width:100%;height:100%;object-fit:cover;display:block}
.plate figcaption{position:absolute;left:0;right:0;bottom:0;font-family:var(--label);font-size:.53rem;
  letter-spacing:.1em;text-transform:uppercase;color:#fff;padding:16px 8px 6px;
  background:linear-gradient(transparent,rgba(0,0,0,.72));opacity:0;transition:opacity .18s}
.plate:hover figcaption,.plate:focus-within figcaption{opacity:1}
.quotes{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:clamp(20px,2.4vw,28px)}
.quotes figure{margin:0;border-left:2px solid var(--line);padding-left:20px}
.quotes figure:first-child{border-left-color:var(--hot)}
blockquote{font-size:1.08rem;line-height:1.5;text-wrap:pretty}
.quotes figcaption{font-family:var(--label);font-size:.6rem;letter-spacing:.16em;text-transform:uppercase;
  color:var(--dim);margin-top:12px}

/* hours + find us, side by side */
.two{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:clamp(30px,5vw,64px)}
.hline{display:flex;justify-content:space-between;gap:16px;padding:11px 0;border-bottom:1px solid var(--hair)}
.hline:last-child{border-bottom:0}
.hline .d{font-family:var(--label);font-size:.66rem;letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}
.hline .t{font-variant-numeric:tabular-nums}
.hline[data-today] .d,.hline[data-today] .t{color:var(--cool);font-weight:700}
.addr{font-size:clamp(1.35rem,2.6vw,1.9rem);line-height:1.25;letter-spacing:-.02em;max-width:16ch}
.meta{display:flex;flex-direction:column;gap:12px;margin-top:24px;align-items:flex-start}
.meta a,.meta span{font-family:var(--label);font-size:.68rem;letter-spacing:.14em;text-transform:uppercase}
.meta a{color:var(--cool)}
footer{border-top:1px solid var(--line);padding:36px 0 44px;display:flex;justify-content:space-between;
  gap:16px;flex-wrap:wrap;font-family:var(--label);font-size:.6rem;letter-spacing:.18em;
  text-transform:uppercase;color:var(--dim)}

/* draft blanks: loud on purpose — they are the agenda for the meeting */
.tbd{font-family:var(--label);font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;
  color:var(--hot);border:1px dashed var(--hot);padding:6px 12px;display:inline-block}
.rule{display:inline-block;height:1.1em;min-width:11em;border-bottom:1px dashed var(--hot);vertical-align:-.15em}
.blank{border:1px dashed var(--line);aspect-ratio:4/3;display:flex;align-items:center;justify-content:center}
.tbdnote{color:var(--hot)}

/* on paper */
@media print{
  .bar{position:static;border-bottom:1px solid var(--line)}
  #lang{display:none}
  .btn{background:transparent!important;color:var(--ink)!important;border-color:var(--dim)!important}
  .sec,.plate,.quotes figure{break-inside:avoid}
  .hero{padding-top:14px}
  footer{border-top:1px solid var(--line)}
}
@media(max-width:760px){
  .bin{flex-wrap:wrap;gap:0;padding-bottom:8px}
  .brand{padding:12px 0 8px}
  .links{order:3;width:100%;gap:10px;padding-bottom:4px}
  .navlink{padding:9px 0}
  .acts .btn{flex:1 1 auto;text-align:center}
}
</style>
</head>
<body>

<div class="bar" id="bar">
  <div class="bin">
    <a class="brand" href="#top"><b>${esc(p.name)}</b>${p.suburb ? `<span>${esc(p.suburb)}</span>` : ''}</a>
    <nav class="links">${nav.map(([id, key]) =>
      `<a class="navlink" href="#${id}" data-nav="${id}">${bi(key)}</a>`).join('')}</nav>
    <div class="right">
      ${open ? '<span id="status"></span>' : ''}
      <button type="button" id="lang">中文</button>
      ${tel ? `<a class="btn hot sm" href="${tel}">${bi('call')}</a>`
            : `<a class="btn sm" href="${mapsHref(p)}">${bi('directions')}</a>`}
    </div>
  </div>
</div>

<div class="wrap" id="top">
  <div class="hero">
    <div class="rail">
      <span>${esc(p.shortAddress || p.address)}</span>
      ${tel ? `<a href="${tel}">${esc(p.phone)}</a>` : ''}
    </div>

    <h1>${title}</h1>

    <div class="facts">
      ${open ? '<span class="on" id="status2"></span>' : ''}
      ${p.tagline ? (p.taglineZh ? biText(esc(p.tagline), esc(p.taglineZh)) : `<span>${esc(p.tagline)}</span>`) : ''}
      ${p.rating ? biText(`${p.rating} &#9733; &middot; ${p.reviews} Google reviews`,
                          `${p.rating} &#9733; &middot; ${p.reviews} 条 Google 评价`) : ''}
      ${!p.rating && !p.tagline ? `<span>${esc(p.categoryZh || p.category)}</span>` : ''}
    </div>

    ${p.summary
      ? (p.summaryZh
          ? biText(esc(p.summary), esc(p.summaryZh), { tag: 'p', cls: 'blurb blk' })
          : `<p class="blurb">${esc(p.summary)}</p>`)
      : draft ? `<p>${tbd('One sentence about the room, in the owner’s words', '一句话介绍，用店家自己的说法')}</p>` : ''}

    <div class="acts">
      ${tel ? `<a class="btn hot" href="${tel}">${bi('callShop')}</a>`
            : draft ? tbd('Phone number', '电话号码') : ''}
      <a class="btn" href="${mapsHref(p)}">${bi('directions')}</a>
      ${hasMenu ? `<a class="btn" href="#menu">${bi('seeMenu')}</a>` : ''}
    </div>

    ${open ? `<div class="week">
      ${weekRows}
      <div class="axis">${ticks.join('')}<span id="nowline" hidden></span></div>
    </div>` : ''}

    ${chips ? `<div class="chips">${chips}</div>` : ''}
  </div>

  ${hasMenu ? `<section class="sec" id="menu">
    ${head2(menuKicker, menuTitle,
      supplied ? biText(`${p.dishes.length} dishes &middot; to confirm`, `${p.dishes.length} 道 &middot; 待确认`)
        : p.reviews ? biText(`from ${p.reviews} reviews`, `取自 ${p.reviews} 条评价`) : '')}
    <div class="menu">${dishRows}</div>
    ${bi(supplied ? 'suppliedMenu' : 'minedNote', { tag: 'p', cls: 'note blk' })}
  </section>` : draft ? `<section class="sec" id="menu">
    ${head2(menuKicker, menuTitle)}
    <div class="menu">${[1, 2, 3, 4, 5, 6].map(() => `<div class="dish">
      <span class="nm rule"></span><span class="led"></span>
      <span class="ct">${biText('to confirm', '待填')}</span></div>`).join('')}</div>
    ${biText('The owner supplies the real list — six to ten of the dishes people actually come for. Prices are never guessed here.',
             '菜品清单由店家提供，先列六到十道最招牌的。价格一律不猜，需店家确认。',
             { tag: 'p', cls: 'note blk' })}
  </section>` : ''}

  ${hasPhotos ? `<section class="sec" id="gallery">
    ${head2('roomKicker', 'roomTitle', biText(`${p.photos.length} photos`, `${p.photos.length} 张`))}
    <div class="grid3">${plates}</div>
    ${bi(p.photos.some(x => x.local) ? 'photoNoteOwn' : 'photoNote', { tag: 'p', cls: 'note blk' })}
  </section>` : draft ? `<section class="sec" id="gallery">
    ${head2('roomKicker', 'roomTitle')}
    <div class="grid3">
      <div class="blank">${tbd('Shopfront', '门头')}</div>
      <div class="blank">${tbd('The room', '店内')}</div>
      <div class="blank">${tbd('Two dishes', '两道菜')}</div>
    </div>
    ${biText('Three shots of the room and two of the food, taken on the owner’s phone, are enough.',
             '店内两三张、菜品两张，店家手机拍的就够。', { tag: 'p', cls: 'note blk' })}
  </section>` : ''}

  ${hasQuotes ? `<section class="sec" id="reviews">
    ${head2('saidKicker', 'navReviews', p.rating ? `${p.rating} &#9733; &middot; ${p.reviews}` : '')}
    <div class="quotes">${quotes}</div>
  </section>` : ''}

  <section class="sec two">
    <div id="hours">
      ${open || draft ? head2('hoursKicker', 'hoursTitle') : ''}
      ${open ? `<div>${hourRows}</div>${draft ? bi('sampleHours', { tag: 'p', cls: 'note blk tbdnote' }) : ''}`
             : draft ? `<div class="blank" style="aspect-ratio:auto;padding:24px">${tbd('Opening hours, seven days', '一周营业时间')}</div>` : ''}
    </div>
    <div id="find">
      ${head2('findKicker', 'findTitle')}
      <p class="addr">${esc(p.address.replace(/,\s*Australia$/, ''))}</p>
      <div class="meta">
        ${tel ? `<a href="${tel}">${esc(p.phone)}</a>${draft && p.demoPhone ? ' ' + tbd('Example number', '示例号码') : ''}`
              : draft ? tbd('Phone number', '电话号码') : ''}
        <a href="${mapsHref(p)}">${bi('openMaps')} &rarr;</a>
      </div>
      <div class="acts" style="margin-top:26px">
        ${tel ? `<a class="btn hot" href="${tel}">${bi(p.attrs.includes('Bookings available') ? 'callBook' : 'callShop')}</a>`
              : `<a class="btn" href="${mapsHref(p)}">${bi('directions')}</a>`}
      </div>
    </div>
  </section>

  <footer>
    <span>${esc(p.name)} &middot; ${esc(p.address.replace(/,\s*Australia$/, ''))}</span>
    ${draft ? `<span style="color:var(--hot)">${bi('draftNote')}</span>` : ''}
    ${opts.live ? '' : `<span>${bi('demoFooter')}</span>`}
  </footer>
</div>

${langScript(lang)}
${open ? statusScript(p) : ''}
${open ? `<script>
(function(){
  var lo=${lo},hi=${hi},n=new Date(),c=n.getHours()+n.getMinutes()/60;
  if(c<lo||c>hi)return;
  var el=document.getElementById('nowline');
  if(!el)return;
  el.style.left=((c-lo)/(hi-lo)*100).toFixed(2)+'%';
  el.hidden=false;
})();
</script>` : ''}
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
  [].forEach.call(document.querySelectorAll('.navlink'),function(a){links[a.getAttribute('data-nav')]=a;});
  var spy=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting)return;
      for(var k in links)links[k].removeAttribute('data-on');
      links[e.target.id].setAttribute('data-on','');
    });
  },{rootMargin:'-45% 0px -50% 0px'});
  [].forEach.call(document.querySelectorAll('[id]'),function(s){ if(links[s.id])spy.observe(s); });
})();
</script>
</body>
</html>`;
}

/**
 * Open/closed, computed in the browser from the real periods, in both
 * languages at once, and aware that a kitchen shuts between lunch and dinner.
 * Built with DOM calls rather than innerHTML so the bilingual spans stay
 * inert markup the switch can hide.
 */
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
  [].forEach.call(document.querySelectorAll('[data-d="'+d+'"]'),function(r){r.setAttribute('data-today','');});
})();
</script>`;
}
