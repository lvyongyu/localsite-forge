// Bilingual chrome.
//
// The shop's own words — its name, its dishes, what customers wrote — stay
// exactly as they are in whatever language they were written. Only the
// scaffolding around them is translated: navigation, section headings,
// buttons, weekdays, the open/closed line. That split matters on a street
// like Box Hill or Doncaster, where the trading name is Chinese, the reviews
// are half Chinese and half English, and the landlord's agent reads neither
// especially well.

export const LANGS = ['en', 'zh'];

export const DAYS = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  zh: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
};

export const HTML_LANG = { en: 'en-AU', zh: 'zh-Hans' };

// [english, 中文]
export const T = {
  navMenu:     ['Menu', '菜单'],
  navServices: ['Services', '服务'],
  navGallery:  ['Gallery', '环境'],
  navReviews:  ['Reviews', '评价'],
  navHours:    ['Hours', '营业时间'],
  navFind:     ['Find us', '位置'],

  call:        ['Call', '致电'],
  callShop:    ['Call the shop', '致电门店'],
  callBook:    ['Call to book', '致电订位'],
  directions:  ['Directions', '导航路线'],
  seeMenu:     ['See the menu', '查看菜单'],
  openMaps:    ['Open in Google Maps', '在 Google 地图打开'],

  menuKicker:  ['What regulars order', '熟客常点'],
  menuTitle:   ['The menu', '菜单'],
  svcKicker:   ['What we do', '提供的服务'],
  svcTitle:    ['Services', '服务项目'],
  enquire:     ['Enquire', '请询问'],

  roomKicker:  ['The room', '店内环境'],
  roomTitle:   ['Gallery', '环境'],
  saidKicker:  ['What people say', '客人怎么说'],
  hoursKicker: ['Every day', '每日'],
  hoursTitle:  ['Hours', '营业时间'],
  findKicker:  ['How to get here', '怎么找到我们'],
  findTitle:   ['Find us', '位置'],

  openNow:     ['Open now', '正在营业'],
  closed:      ['Closed', '休息'],
  closedToday: ['Closed today', '今日休息'],
  until:       ['until', '至'],
  opens:       ['opens', '开门'],
  today:       ['today', '今天'],
  tomorrow:    ['tomorrow', '明天'],
  open24:      ['Open 24 hours', '24 小时营业'],

  reviewsFrom: ['Google reviews', '条 Google 评价'],
  photoNote:   ['Photos from the Google listing. The owner’s own shots go here before launch.',
                '照片取自 Google 商家页面，上线前换成店家自己的照片。'],
  photoNoteOwn:['Placed by hand for this draft. The owner’s own shots replace them before launch.',
                '本稿图片为手动放入，上线前换成店家自己拍的照片。'],
  minedNote:   ['Taken from what customers wrote in their Google reviews — not a menu the owner supplied. Confirm every line. No prices appear anywhere on this page.',
                '以下取自顾客在 Google 评论里写到的内容，并非店家提供的菜单，需逐条确认。本页不显示任何价格。'],
  draftNote:   ['Draft — the marked fields are filled in with the owner.',
                '草稿 — 标记处与店家当面确认后填写。'],
  tbc:         ['To confirm', '待确认'],
  demoFooter:  ['Private demo — not indexed', '内部演示页 — 未被搜索引擎收录'],
};

/** Pick one side of a pair. */
export const one = (key, lang) => T[key][lang === 'zh' ? 1 : 0];

/**
 * Both languages in the page at once, one hidden by CSS. Rendering both — as
 * opposed to a second page or a fetch — keeps the file self-contained, which
 * is the whole premise: one HTML file you can message to an owner.
 * Values here are the tool's own strings, never listing data.
 */
export function bi(key, { tag = 'span', cls = '', style = '' } = {}) {
  const [en, zh] = T[key];
  const attrs = `class="i18n${cls ? ' ' + cls : ''}"${style ? ` style="${style}"` : ''}`;
  return `<${tag} ${attrs}><span data-l="en">${en}</span><span data-l="zh">${zh}</span></${tag}>`;
}

/** Same, for a pair of already-escaped strings that are not in the table. */
export function biText(en, zh, { tag = 'span', cls = '', style = '' } = {}) {
  const attrs = `class="i18n${cls ? ' ' + cls : ''}"${style ? ` style="${style}"` : ''}`;
  return `<${tag} ${attrs}><span data-l="en">${en}</span><span data-l="zh">${zh}</span></${tag}>`;
}

/** CSS that makes the switch work with no JavaScript at all. */
export const i18nCss = `
.i18n [data-l]{display:none}
html[data-lang="en"] .i18n [data-l="en"],
html[data-lang="zh"] .i18n [data-l="zh"]{display:inline}
html[data-lang="en"] .i18n.blk [data-l="en"],
html[data-lang="zh"] .i18n.blk [data-l="zh"]{display:block}`;

/**
 * The switch itself. Remembers the choice per browser, so an owner who flips
 * to Chinese once gets Chinese every time they open the page again.
 */
export function langScript(primary = 'en') {
  return `<script>
(function(){
  var K='site-lang',r=document.documentElement,b=document.getElementById('lang');
  var HL={en:${JSON.stringify(HTML_LANG.en)},zh:${JSON.stringify(HTML_LANG.zh)}};
  var set=function(l){r.setAttribute('data-lang',l);r.setAttribute('lang',HL[l]);
    if(b){b.textContent=l==='zh'?'EN':'中文';b.setAttribute('aria-label',l==='zh'?'Switch to English':'切换到中文');}
    try{localStorage.setItem(K,l)}catch(e){}};
  var saved;try{saved=localStorage.getItem(K)}catch(e){}
  set(saved==='zh'||saved==='en'?saved:${JSON.stringify(primary)});
  if(b)b.addEventListener('click',function(){
    set(r.getAttribute('data-lang')==='zh'?'en':'zh');});
})();
</script>`;
}
