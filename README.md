# localsite-forge

Find local businesses that have earned a good reputation but never got a website — then generate one for each, ready to show the owner.

Built after manually scanning one street in Richmond, Victoria: of the cafes rated 4.5★ and up, most had **no website at all**, and several had a Google listing pointing at a Facebook mobile page or a third-party menu host. That is the gap this tool works.

```
scan  ->  rank leads  ->  build a site per business  ->  pitch notes  ->  deploy
```

## Quick start (no API key needed)

```bash
node bin/forge.js demo
```

Builds a complete site from the bundled fixture into `output/cafe-azul/`, alongside `pitch.md` and `content-todo.md`. Open the HTML in a browser to see what a lead actually receives.

## Scanning for real

Needs a Google Places API key:

1. Enable **Places API (New)** in the Google Cloud Console
2. Create a key under *APIs & Services → Credentials*
3. `cp .env.example .env` and paste it in

```bash
# find leads
node bin/forge.js scan --query "cafe in Richmond VIC 3121" --min-rating 4.5 --min-reviews 100

# build sites for the top 5
node bin/forge.js build --from leads/cafe-in-richmond-vic-3121.json --top 5
```

Costs money per request, billed by field mask tier — the scan pass and the detail pass use deliberately different masks to keep it down. Check current rates on Google's [Places API pricing page](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing) before running a wide sweep.

## How leads are ranked

A listing with no `websiteUri` is the obvious case, but it isn't the only one:

| Class | Meaning | Lead? |
|---|---|---|
| `none` | No website on the listing | Yes — strongest |
| `social` | Points at Facebook / Instagram / Linktree | Yes — the demo sells itself |
| `platform` | Points at a menu or booking host (mryum, square.site, Fresha…) | Yes — they're renting their presence |
| `own` | A real domain of their own | No — filtered out |

Score weights what actually closes deals: review volume (log-scaled, as a proxy for foot traffic), rating above 4.0, price level, and **whether there's a phone number** — the difference between a pitch and a wish.

## What gets generated

Per business, into `output/<slug>/`:

- **`index.html`** — one self-contained file. No build step, no dependencies, no external requests. Mobile-first, dark/light aware, click-to-call, live open/closed status computed from the real opening hours, Google Maps directions, and `LocalBusiness` JSON-LD.
- **`pitch.md`** — pitch notes specific to that business, with hooks derived from its own data (an unusually early opening time, seven-day trading, outdoor seating), plus pricing structure and objection handling.
- **`content-todo.md`** — everything a human still has to supply before it goes live.

### Three layouts, not one template recoloured

Recolouring a single skeleton doesn't differentiate anything — the pages still read as one template. So the layout is chosen from **how the business is actually used**:

| Layout | For | Why it's shaped that way |
|---|---|---|
| **poster** | Cafes, bakeries, espresso bars | Decided on the footpath. One screen, no scrolling, type at full size. Its one device is a **day-bar**: the week's trading hours drawn to scale with a marker at the current time — because "still open?" is the question, and it deserves a diagram. |
| **billoffare** | Restaurants, trattorias, wine bars | Decided the night before, on a phone. A panel that never scrolls away carries address, hours and the phone number; the menu runs beside it set like a printed bill of fare, dot leaders and all. |
| **card** | Barbers, salons, physio, dentists, mechanics | Nobody browses a physio. They arrive knowing what they want. Service list, hours up top, and the call button pinned in view at all times. |

Selection uses trading hours rather than Google's `types` array, which tags nearly every cafe as a "restaurant" too — a place still serving at 6pm is somewhere you sit down; one shut by mid-afternoon is counter trade, whatever the listing says. Where two layouts genuinely both fit (a cafe with a substantial menu), a stable hash of the place id picks one, so a row of neighbouring cafes doesn't ship a row of identical pages.

Palette works the same way: a colour word in the name wins where there is one (*Azul*, *Verde*, *Nero* — Melbourne is full of them), otherwise category plus the id hash. Each layout also carries its own type pairing, so the three don't just differ in colour — they differ in voice.

Override with `--layout poster|billoffare|card` when you disagree.

## What this tool will not do

It won't invent a menu. The Places API returns no menu data, so dish and service names are mined from review text, capped, and marked **unverified** in `content-todo.md`. **Prices are never generated** — guessing a price and putting it on a business's homepage is how you lose the sale in the first thirty seconds.

No photos are bundled either. The images on a Google listing belong to the people who took them.

## Before you publish

Generated sites carry `<meta name="robots" content="noindex,nofollow">` by default. This matters: a page with a real business's name, address and phone number, indexed by Google, starts functioning as that business's official website — while the menu on it is still unverified. Keep the demo out of the index until the owner has seen it and agreed.

Once they've said yes, rebuild with `--live` to drop the tag.

Worth knowing before you send anything:

- **Reviews** — quoted review text carries author attribution in the generated page, per Google's display requirements. `--no-reviews` removes the section entirely.
- **Cold outreach** — in Australia, unsolicited commercial email falls under the [Spam Act 2003](https://www.acma.gov.au/spam-rules-businesses): you need consent, accurate sender identification, and a working unsubscribe. Walking in or phoning avoids the question altogether, and converts better.
- **Their brand** — you're building a site using someone's trading name before they've agreed to it. That's fine as a private demo. It stops being fine when it's publicly indexed and reachable as if it were theirs.

## Commands

```
forge scan  --query <text> [--type <t>] [--min-rating <n>] [--min-reviews <n>] [--max <n>] [--out <path>]
forge build <placeId>
forge build --fixture <file>          offline, no API key
forge build --from <leads.json> [--top <n>] [--price <n>] [--layout <name>] [--live] [--no-reviews] [--no-dishes]
forge demo
```

## Layout

```
bin/forge.js      CLI
src/places.js     Places API (New) client — field masks drive billing
src/scan.js       website classification + lead scoring
src/profile.js    API payload -> site model; mines offerings, flags what's unverified
src/theme.js      palette selection
src/template.js   layout selection
src/layouts/      poster.js, billoffare.js, card.js
src/render-utils.js  escaping, <head>, live open/closed script
src/pitch.js      per-business pitch notes
test/smoke.js     node test/smoke.js
```

## Tests

```bash
node test/smoke.js
```

Covers domain classification (including the substring trap where `matrix.com.au` must not read as a Twitter link), escaping of hostile business names and review text in both HTML and embedded JSON-LD, correct weekday alignment of opening hours, graceful degradation when a listing has no phone or no hours, and that neighbouring shops don't generate matching pages.

Two regressions are pinned there deliberately: a cafe that Google also tags `restaurant` but which shuts at 3pm must not be treated as a dinner venue, and HTML entities in the attribute line must survive as entities rather than being double-escaped into visible `&middot;` text. Both shipped once.

## License

MIT
