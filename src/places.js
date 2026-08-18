// Google Places API (New) client.
// Docs: https://developers.google.com/maps/documentation/places/web-service/op-overview
// Field masks are mandatory and drive billing tier — keep them tight.

const BASE = 'https://places.googleapis.com/v1';

// Cheap pass: everything needed to decide "is this a lead?"
export const SCAN_FIELDS = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.rating',
  'places.userRatingCount',
  'places.websiteUri',
  'places.nationalPhoneNumber',
  'places.primaryTypeDisplayName',
  'places.priceLevel',
  'places.businessStatus',
].join(',');

// Full pass: only for places we actually build a site for.
export const DETAIL_FIELDS = [
  'id', 'displayName', 'formattedAddress', 'shortFormattedAddress',
  'rating', 'userRatingCount', 'websiteUri', 'nationalPhoneNumber',
  'internationalPhoneNumber', 'primaryTypeDisplayName', 'types', 'priceLevel',
  'regularOpeningHours', 'editorialSummary', 'reviews', 'location',
  'dineIn', 'takeout', 'delivery', 'outdoorSeating', 'reservable',
  'servesBreakfast', 'servesBrunch', 'servesLunch', 'servesDinner',
  'servesVegetarianFood', 'servesCoffee', 'servesDessert', 'servesBeer', 'servesWine',
  'goodForChildren', 'goodForGroups', 'restroom', 'parkingOptions',
  'paymentOptions', 'accessibilityOptions',
].join(',');

function key() {
  const k = process.env.GOOGLE_PLACES_API_KEY;
  if (!k) {
    throw new Error(
      'GOOGLE_PLACES_API_KEY is not set.\n' +
      '  1. Enable "Places API (New)" in Google Cloud Console\n' +
      '  2. Create an API key under APIs & Services > Credentials\n' +
      '  3. export GOOGLE_PLACES_API_KEY=...   (or put it in .env)\n' +
      'No key? Run an offline build instead:  forge build --fixture fixtures/cafe-azul.json'
    );
  }
  return k;
}

async function call(url, opts) {
  const res = await fetch(url, opts);
  const body = await res.text();
  if (!res.ok) {
    let msg = body;
    try { msg = JSON.parse(body).error?.message ?? body; } catch {}
    throw new Error(`Places API ${res.status}: ${msg}`);
  }
  return JSON.parse(body);
}

/**
 * Text search. Returns up to `max` places (API pages at 20).
 * @param {object} o
 * @param {string} o.query      e.g. "cafe in Richmond VIC 3121"
 * @param {string} [o.type]     e.g. "cafe", "hair_salon" (primary type filter)
 * @param {number} [o.minRating] 0..5, filtered server-side
 * @param {number} [o.max]      how many results to pull
 */
export async function searchText({ query, type, minRating, max = 40 }) {
  const out = [];
  let pageToken;

  do {
    const body = {
      textQuery: query,
      pageSize: Math.min(20, max - out.length),
      ...(type ? { includedType: type } : {}),
      ...(minRating ? { minRating } : {}),
      ...(pageToken ? { pageToken } : {}),
    };

    const data = await call(`${BASE}/places:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key(),
        'X-Goog-FieldMask': SCAN_FIELDS + ',nextPageToken',
      },
      body: JSON.stringify(body),
    });

    out.push(...(data.places ?? []));
    pageToken = data.nextPageToken;
    // Google requires a short pause before a page token is valid.
    if (pageToken && out.length < max) await new Promise(r => setTimeout(r, 2000));
  } while (pageToken && out.length < max);

  return out.slice(0, max);
}

/** Full details for one place id. */
export async function placeDetails(id) {
  return call(`${BASE}/places/${encodeURIComponent(id)}`, {
    headers: {
      'X-Goog-Api-Key': key(),
      'X-Goog-FieldMask': DETAIL_FIELDS,
    },
  });
}
