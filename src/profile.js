// Places API payload -> site data model.
//
// Honesty rule: anything the API states as fact (hours, phone, attributes)
// goes straight in. Anything inferred (dish names mined from review text)
// is flagged `unverified` and listed in content-todo.md for the owner to
// confirm. The tool must never invent a menu and present it as real.

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// Terms that actually show up in Australian cafe/restaurant reviews.
const DISH_TERMS = [
  'smashed avocado','avocado toast','eggs benedict','big breakfast','farmers breakfast',
  'scrambled eggs','poached eggs','bacon and eggs','french toast','pancakes','waffles',
  'acai bowl','granola','muesli','porridge','chia pudding',
  'sausage roll','meat pie','banh mi','bagel','toastie','panini','focaccia','reuben',
  'wrap','burrito','falafel','souvlaki','schnitzel','parma','burger','steak sandwich',
  'fish and chips','calamari','pasta','gnocchi','risotto','pizza','lasagne',
  'laksa','pho','pad thai','curry','dumpling','ramen','sushi','poke bowl',
  'flat white','long black','cappuccino','latte','piccolo','cold brew','filter coffee',
  'chai latte','matcha','hot chocolate','milkshake','smoothie','affogato',
  'croissant','banana bread','muffin','scone','cheesecake','brownie','cannoli','baklava',
  'salad','soup','fried chicken','roast','tacos','nachos','halloumi','shakshuka',
];

// Non-hospitality trades need their own vocabulary, otherwise a barber or a
// physio generates a page with an empty middle. Terms are matched against
// review text the same way dishes are.
const SERVICE_TERMS = [
  'haircut','hair cut','fade','skin fade','buzz cut','beard trim','hot towel shave','shave',
  'blow wave','blow dry','balayage','foils','colour','highlights','keratin','hair treatment',
  'facial','massage','remedial massage','deep tissue','hot stone','waxing','threading',
  'manicure','pedicure','gel nails','acrylics','lash extensions','eyebrow','spray tan',
  'physio','physiotherapy','dry needling','adjustment','rehab','pilates','reformer',
  'personal training','group class','bootcamp','yoga','osteo','chiro','podiatry',
  'roadworthy','logbook service','tyre','brake','wheel alignment','car service','detailing',
  'dog grooming','puppy wash','nail clip',
  'alterations','dry cleaning','key cutting','shoe repair','watch battery',
  'consultation','check up','clean and polish','whitening','filling',
];

// Half of Box Hill trades in Chinese, Korean and Japanese, and so do its
// reviews. An English-only vocabulary left those shops with an all-but-empty
// menu section — the worst possible thing to hand an owner you're pitching.
// CJK needs no word boundaries, so plain substring counting works here too.
const CJK_DISH_TERMS = [
  // Chinese - characters
  '火锅','麻辣烫','麻辣香锅','串串','冒菜','干锅','砂锅','烧烤','烤串','烤鸭','北京烤鸭',
  '牛肉面','拉面','刀削面','担担面','热干面','炸酱面','米线','螺蛳粉','酸辣粉','黄焖鸡',
  '饺子','水饺','煎饺','小笼包','包子','烧麦','肠粉','云吞','馄饨','汤包',
  '炒饭','炒面','盖浇饭','煲仔饭','粥','皮蛋瘦肉粥','油条','豆浆','煎饼','肉夹馍',
  '麻婆豆腐','宫保鸡丁','回锅肉','水煮鱼','酸菜鱼','口水鸡','白切鸡','叉烧','烧腊',
  '点心','蛋挞','菠萝包','豆花','烧仙草','芋圆','珍珠奶茶','奶茶','刨冰',
  // Chinese / regional - romanised
  'hot pot','hotpot','malatang','dim sum','yum cha','xiao long bao','xiaolongbao',
  'char siu','peking duck','beef noodle','dan dan','mapo tofu','kung pao','sichuan',
  'wonton','congee','bao','shengjian','jianbing','luosifen','biang biang',
  // Korean
  '김치','비빔밥','불고기','떡볶이','삼겹살','순두부','짜장면','치킨',
  'kimchi','bibimbap','bulgogi','tteokbokki','samgyeopsal','sundubu','japchae',
  'korean fried chicken','kimchi jjigae','bingsu','hotteok','gimbap',
  // Japanese
  'sashimi','gyoza','tempura','katsu','donburi','takoyaki','okonomiyaki',
  'omakase','chirashi','unagi','yakitori','tonkotsu','miso soup','matcha latte',
  // South-east Asian
  'banh mi','bun cha','spring roll','rice paper roll','laksa','char kway teow',
  'hainanese chicken rice','roti','nasi lemak','tom yum','green curry','massaman',
  'satay','rendang','pandan',
  // Bakery / dessert crossover
  'souffle','soufflé','sourdough','croissant','egg tart','basque cheesecake',
  'bubble tea','boba','milk tea','taro','brown sugar',
];

const ATTRS = [
  ['dineIn',            'Dine-in'],
  ['takeout',           'Takeaway'],
  ['delivery',          'Delivery'],
  ['outdoorSeating',    'Outdoor seating'],
  ['reservable',        'Bookings available'],
  ['servesBreakfast',   'Breakfast'],
  ['servesBrunch',      'Brunch'],
  ['servesLunch',       'Lunch'],
  ['servesDinner',      'Dinner'],
  ['servesVegetarianFood','Vegetarian options'],
  ['servesCoffee',      'Espresso menu'],
  ['servesDessert',     'Desserts'],
  ['servesBeer',        'Beer'],
  ['servesWine',        'Wine'],
  ['goodForChildren',   'Family friendly'],
  ['goodForGroups',     'Good for groups'],
];

function fmtTime(h, m) {
  const ap = h < 12 ? 'am' : 'pm';
  const hh = h % 12 || 12;
  return `${hh}:${String(m ?? 0).padStart(2, '0')}${ap}`;
}

function buildHours(oh) {
  // rows[0..6] indexed Sunday..Saturday, matching JS getDay()
  const rows = DAYS.map((label, d) => ({ day: d, label, text: 'Closed', open: null, close: null }));
  for (const p of oh?.periods ?? []) {
    const d = p.open?.day;
    if (d == null) continue;
    const oH = p.open.hour ?? 0, oM = p.open.minute ?? 0;
    const cH = p.close?.hour, cM = p.close?.minute ?? 0;
    rows[d].open = oH + oM / 60;
    if (cH == null) { rows[d].close = 24; rows[d].text = 'Open 24 hours'; continue; }
    rows[d].close = cH + cM / 60;
    // close-past-midnight (e.g. bars) — normalise so the JS status check works
    if (rows[d].close <= rows[d].open) rows[d].close += 24;
    rows[d].text = `${fmtTime(oH, oM)} – ${fmtTime(cH, cM)}`;
  }
  return rows;
}

function mineOfferings(reviews, limit = 8) {
  const blob = (reviews ?? [])
    .map(r => r.text?.text ?? r.originalText?.text ?? '')
    .join(' ')
    .toLowerCase();
  const hits = [];
  // The vocabularies overlap by hand (banh mi sits in both the general and
  // the Asian list); a Set stops the same dish being counted twice.
  for (const term of new Set([...DISH_TERMS, ...CJK_DISH_TERMS, ...SERVICE_TERMS])) {
    // CJK has no word boundaries, so substring counting is correct there.
    // Latin terms must not: bare substring matching found "pho" inside
    // "phone" and put Vietnamese noodles on a Sichuan hotpot menu.
    const cjk = /[\u3000-\u9fff\uac00-\ud7af]/.test(term);
    let n;
    if (cjk) {
      n = blob.split(term).length - 1;
    } else {
      const re = new RegExp('\\b' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g');
      n = (blob.match(re) || []).length;
    }
    if (n > 0) hits.push({ term, n });
  }
  // Vocabularies overlap: "bubble tea" also matches "tea", "珍珠奶茶" contains
  // "奶茶". Prefer the longest specific match and drop anything contained by
  // one already kept, otherwise the menu lists the same dish twice.
  // Drop any term wholly contained by another that also matched: "fried
  // chicken" loses to "korean fried chicken", "奶茶" to "珍珠奶茶". Filter
  // before ranking — the generic term always counts higher (every mention of
  // the specific one contains it), so ranking first would keep the wrong one.
  // "hot pot" and "hotpot" are the same dish spelled two ways; compare with
  // spacing and hyphens stripped so only one reaches the menu.
  const norm = t => t.replace(/[\s-]/g, '');
  const specific = hits.filter(h => !hits.some(o =>
    o.term !== h.term &&
    (o.term.includes(h.term) ||
     (norm(o.term) === norm(h.term) && (o.n > h.n || (o.n === h.n && o.term < h.term))))));
  specific.sort((a, b) => b.n - a.n || b.term.length - a.term.length);
  return specific.slice(0, limit)
    .map(h => ({
      title: /[\u3000-\u9fff\uac00-\ud7af]/.test(h.term)
        ? h.term                                        // leave CJK as written
        : h.term.replace(/\b[a-z]/g, c => c.toUpperCase()),
      mentions: h.n,
      unverified: true,
    }));
}

function pickQuotes(reviews, limit = 3) {
  return (reviews ?? [])
    .map(r => ({
      text: (r.text?.text ?? '').trim(),
      author: r.authorAttribution?.displayName ?? 'Google user',
      authorUri: r.authorAttribution?.uri ?? '',
      rating: r.rating ?? 0,
    }))
    .filter(r => r.rating >= 4 && r.text.length > 25 && r.text.length < 220)
    .slice(0, limit);
}

// "346 Bridge Rd, Richmond VIC 3121, Australia" -> "Richmond"
function suburbOf(addr = '') {
  for (const part of String(addr).split(',').map(x => x.trim())) {
    const m = part.match(/^(.+?)\s+(VIC|NSW|QLD|WA|SA|TAS|NT|ACT)\s+\d{4}$/i);
    if (m) return m[1];
  }
  return String(addr).split(',')[1]?.trim() ?? '';
}

export function buildProfile(place, opts = {}) {
  const name = place.displayName?.text ?? 'This Business';
  const hours = buildHours(place.regularOpeningHours);
  const openDays = hours.filter(h => h.open != null);
  const earliest = openDays.length ? Math.min(...openDays.map(h => h.open)) : null;

  const attrs = ATTRS.filter(([k]) => place[k] === true).map(([, label]) => label);

  // A genuinely early opener is a real differentiator worth putting in the hero.
  let hook = null;
  if (earliest != null && earliest <= 6.5) hook = `Open from ${fmtTime(Math.floor(earliest), (earliest % 1) * 60)}`;
  else if (openDays.length === 7) hook = 'Open seven days';

  return {
    id: place.id,
    name,
    tagline: hook ? `${hook}${openDays.length === 7 && hook !== 'Open seven days' ? ', seven days' : ''}` : '',
    summary: place.editorialSummary?.text ?? '',
    address: place.formattedAddress ?? '',
    shortAddress: place.shortFormattedAddress ?? place.formattedAddress ?? '',
    suburb: suburbOf(place.formattedAddress),
    phone: place.nationalPhoneNumber ?? '',
    phoneHref: (place.internationalPhoneNumber ?? place.nationalPhoneNumber ?? '').replace(/[^\d+]/g, ''),
    rating: place.rating ?? null,
    reviews: place.userRatingCount ?? 0,
    category: place.primaryTypeDisplayName?.text ?? 'Local business',
    // Fixtures may carry a translated category and hand-noted hooks under _zh;
    // the API returns neither. Hooks reach the pitch notes only — never the page.
    categoryZh: place._zh?.category ?? '',
    notes: place._zh?.notes ?? [],
    types: place.types ?? [],
    priceLevel: place.priceLevel ?? '',
    hours,
    attrs,
    dishes: opts.noDishes ? [] : mineOfferings(place.reviews),
    // Drives the section heading: a barber does not have "a menu".
    isFood: (place.types ?? []).some(t =>
      /cafe|restaurant|bar|bakery|food|meal_|coffee|ice_cream|pizza/.test(t)),
    quotes: opts.noReviews ? [] : pickQuotes(place.reviews),
    mapsQuery: encodeURIComponent(`${name} ${place.formattedAddress ?? ''}`),
    lat: place.location?.latitude, lng: place.location?.longitude,
    existingWeb: place.websiteUri ?? '',
    photos: opts.photos ?? [],   // filled in by the CLI after download
  };
}

/** What a human still has to fill in before this site should go live. */
export function contentTodo(p) {
  const todo = [];
  const noun = p.isFood ? 'Menu items' : 'Services';
  if (!p.dishes.length) todo.push(`${noun} — the API provides none. Get the real list from the owner.`);
  else todo.push(`Confirm the ${p.dishes.length} ${noun.toLowerCase()} below with the owner (mined from review text, NOT authoritative)`);
  todo.push('Prices — deliberately omitted. Never guess these.');
  if (p.photos.length && p.photos.some(x => x.local))
    todo.push(`Photos — ${p.photos.length} image(s) supplied by hand, NOT screened by the people detector. Check every one for customers or staff who did not agree to appear, and confirm you have the right to use them at all: a shot taken by a reviewer belongs to that reviewer, not to the shop. The owner's own photos are the only ones that survive the site going live.`);
  else if (p.photos.length)
    todo.push(`Photos — ${p.photos.length} image(s) from the Google listing, auto-screened so none contain people. They still belong to whoever took them: fine for showing the owner, replace with their own shots before it goes live. See photos/ATTRIBUTION.txt.`);
  else
    todo.push('Photos — none bundled. Google\'s photos belong to their authors; get the owner\'s own shots.');
  if (!p.summary) todo.push('Hero description — no editorial summary from Google; the placeholder needs a rewrite.');
  if (!p.phone) todo.push('Phone number — none on the listing. Click-to-call is disabled until you have one.');
  if (!p.hours.some(h => h.open != null)) todo.push('Opening hours — none on the listing. The hours table is hidden.');
  return todo;
}
