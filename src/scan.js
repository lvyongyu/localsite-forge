// Lead scoring & classification.
// The useful signal is not binary. A listing pointing at m.facebook.com or a
// third-party menu host is still a business without a website of its own —
// and it converts, because you can show them what they're settling for.

const SOCIAL = [
  'facebook.com', 'fb.me', 'instagram.com', 'linktr.ee', 'linkin.bio',
  'tiktok.com', 'twitter.com', 'x.com', 'youtube.com',
];

const PLATFORM = [
  'mryum.com', 'square.site', 'order.online', 'ubereats.com', 'doordash.com',
  'menulog.com.au', 'nowbookit.com', 'obee.com.au', 'quandoo.com',
  'thefork.com', 'opentable.com', 'fresha.com', 'bookwell.com.au',
  'setmore.com', 'acuityscheduling.com', 'bookings.',
];

// Match on domain boundaries, never substrings. `host.includes('x.com')`
// would classify a legitimate business at matrix.com.au as a Twitter link
// and silently drop it from the leads list.
function matchesDomain(host, patterns) {
  return patterns.some(d => d.endsWith('.')
    ? host.startsWith(d)                       // subdomain prefix, e.g. bookings.
    : host === d || host.endsWith('.' + d));   // exact host or true subdomain
}

/** 'none' | 'social' | 'platform' | 'own' */
export function classifyWeb(uri) {
  if (!uri) return 'none';
  let host;
  try { host = new URL(uri).hostname.replace(/^www\./, '').toLowerCase(); }
  catch { return 'none'; }
  if (matchesDomain(host, SOCIAL)) return 'social';
  if (matchesDomain(host, PLATFORM)) return 'platform';
  return 'own';
}

const WEB_WEIGHT  = { none: 40, social: 32, platform: 26, own: 0 };
const PRICE_WEIGHT = {
  PRICE_LEVEL_INEXPENSIVE: 6, PRICE_LEVEL_MODERATE: 14,
  PRICE_LEVEL_EXPENSIVE: 18, PRICE_LEVEL_VERY_EXPENSIVE: 18,
};

/**
 * Rank a place as a sales lead. Higher = go after it first.
 * Mirrors how you'd actually triage: can I reach a human, do they have
 * enough traffic to afford it, and how badly do they need this.
 */
export function scoreLead(p) {
  const web = classifyWeb(p.websiteUri);
  if (web === 'own') return null;

  const reviews = p.userRatingCount ?? 0;
  const rating  = p.rating ?? 0;

  let score = WEB_WEIGHT[web];
  // Review volume proxies foot traffic. Log-scaled: 50 vs 100 matters more than 800 vs 900.
  score += Math.min(30, Math.log10(Math.max(reviews, 1)) * 13);
  // Reputation they've already earned and aren't converting.
  score += Math.max(0, (rating - 4.0)) * 18;
  // A phone number is the difference between a pitch and a wish.
  if (p.nationalPhoneNumber) score += 22;
  score += PRICE_WEIGHT[p.priceLevel] ?? 8;

  return {
    id: p.id,
    name: p.displayName?.text ?? '(unnamed)',
    rating, reviews,
    address: p.formattedAddress ?? '',
    phone: p.nationalPhoneNumber ?? '',
    category: p.primaryTypeDisplayName?.text ?? '',
    priceLevel: p.priceLevel ?? '',
    web,
    webUri: p.websiteUri ?? '',
    score: Math.round(score),
    mapsUrl: `https://www.google.com/maps/place/?q=place_id:${p.id}`,
  };
}

export function filterAndRank(places, { minRating = 0, minReviews = 0 } = {}) {
  return places
    .filter(p => p.businessStatus ? p.businessStatus === 'OPERATIONAL' : true)
    .filter(p => (p.rating ?? 0) >= minRating)
    .filter(p => (p.userRatingCount ?? 0) >= minReviews)
    .map(scoreLead)
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
}

export function toCsv(leads) {
  const cols = ['score','name','rating','reviews','web','phone','address','category','id','mapsUrl'];
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [cols.join(','), ...leads.map(l => cols.map(c => esc(l[c])).join(','))].join('\n');
}
