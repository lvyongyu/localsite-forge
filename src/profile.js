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
  for (const term of [...DISH_TERMS, ...SERVICE_TERMS]) {
    const n = blob.split(term).length - 1;
    if (n > 0) hits.push({ term, n });
  }
  return hits.sort((a, b) => b.n - a.n).slice(0, limit)
    .map(h => ({
      title: h.term.replace(/\b\w/g, c => c.toUpperCase()),
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
  };
}

/** What a human still has to fill in before this site should go live. */
export function contentTodo(p) {
  const todo = [];
  const noun = p.isFood ? 'Menu items' : 'Services';
  if (!p.dishes.length) todo.push(`${noun} — the API provides none. Get the real list from the owner.`);
  else todo.push(`Confirm the ${p.dishes.length} ${noun.toLowerCase()} below with the owner (mined from review text, NOT authoritative)`);
  todo.push('Prices — deliberately omitted. Never guess these.');
  todo.push('Photos — no images are bundled. Google\'s photos are licensed to their authors; get the owner\'s own shots.');
  if (!p.summary) todo.push('Hero description — no editorial summary from Google; the placeholder needs a rewrite.');
  if (!p.phone) todo.push('Phone number — none on the listing. Click-to-call is disabled until you have one.');
  if (!p.hours.some(h => h.open != null)) todo.push('Opening hours — none on the listing. The hours table is hidden.');
  return todo;
}
