# localsite-forge

Find local businesses that have earned a good reputation but never got a website — then generate one for each, ready to show the owner.

Built after manually scanning one street in Richmond, Victoria: of the cafes rated 4.5★ and up, most had **no website at all**, and several had a Google listing pointing at a Facebook mobile page or a third-party menu host. That is the gap this tool works.

```
scan  ->  rank leads  ->  build a site per business  ->  pitch notes  ->  deploy
                                   ^
              or start here: forge site "<their address>"
```

## Quick start (no API key needed)

```bash
node bin/forge.js demo
```

Builds a complete site from the bundled fixture into `output/cafe-azul/`, alongside `pitch.md` and `content-todo.md`. Open the HTML in a browser to see what a lead actually receives.

## One shop, one command

Most of the time you don't have a place id — you have a shopfront someone pointed at, or an address off a business card:

```bash
node bin/forge.js site "346 Bridge Rd, Richmond VIC 3121" --flat
```

Looks the address up, says which listing it matched and what the listing's website situation is, pulls the details, and builds the site. Wrong shop? Re-run with `--pick 2` — the other candidates are printed with their numbers. Every `build` option applies here too (`--flat`, `--layout`, `--photos`, `--no-reviews`, `--live`).

The search costs one Text Search request on top of the usual details call, and it caps at five candidates so an ambiguous address can't quietly run up a bill.

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

Costs money per request, billed by field mask tier — the scan pass and the detail pass use deliberately different masks to keep it down. Details responses are cached on disk for 25 days, so rebuilding after a template change costs nothing; `--refresh` forces a re-fetch. Check current rates on Google's [Places API pricing page](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing) before running a wide sweep.

## Working a whole suburb

One suburb means several category queries, and they overlap — a cafe comes back under `restaurant` too. `merge` folds every scan in `leads/` into one ranked list, keeping the highest-scoring sighting of each place:

```bash
node bin/forge.js scan --query "cafe in Box Hill VIC 3128"
node bin/forge.js scan --query "hair salon in Box Hill VIC 3128"
node bin/forge.js merge --top 30

node bin/forge.js build --from leads/merged.json --top 30 --flat
node bin/forge.js roster --suburb "Box Hill" --flat
```

`roster` writes `output/roster.html`: every built site in approach order, ratings and website class visible, phone numbers tappable on a phone, and a to&nbsp;do → visited → closed toggle per shop that survives a reload (kept in that browser only). It's the one page you actually open while walking the street.

### Flat output — one file per shop

`--flat` writes `output/<shop>.html` instead of `output/<shop>/index.html`, with photos embedded as data URIs. The result is a single self-contained file, roughly 1 MB with images, that you can message to an owner without a folder, a zip or a deploy. Pitch notes and the todo list land in `output/pitch/`.

Photos still download to `output/<shop>/photos/` under both layouts — that folder is the cache and the place you delete an unsuitable shot from, and that deletion sticks across rebuilds.

Build and roster must agree: `roster --flat` looks for the flat files, so pass `--flat` to both. Use `--inline-photos` on its own if you want the folder layout but a page that pulls in nothing from beside it.

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
- **`photos/`** — up to three images from the listing, screened so no person appears on any page (see below), with an `ATTRIBUTION.txt` naming whoever took each one.

With `--flat` the page and its notes land as `output/<slug>.html` (photos embedded in it), `output/pitch/<slug>.md` and `output/pitch/<slug>-content-todo.md` instead.

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

### A fourth: `storefront`, the full page

The three above each answer one question and stop. That reads as thin to an owner who has just been shown the site of the shop two doors down — what they see is not restraint, it's *less than the neighbours got*. So `--layout storefront` builds the page that high-street hospitality sites actually have: a bar that sticks to the top with anchors into the page, and a section for each thing the listing knows — menu, gallery, reviews, hours, find us — ending in the address and the phone number.

What it does **not** do is manufacture the rest of that structure. No Functions page we have no packages for, no What's On we have no events for, no booking form we can't honour. **A nav item exists only when its section has real data behind it**, so a thin listing gets a short bar instead of a page full of empty rooms.

```bash
node bin/forge.js site "15 Village Ave, Doncaster VIC 3108" --layout storefront --lang zh --flat
```

### Bilingual, without a second page

`--lang zh` opens the page in Chinese; `--lang en` (the default) opens it in English. Either way `storefront` ships **both** languages in the one file with a switch in the bar — the choice is remembered per browser. Half of Box Hill and Doncaster trades in Chinese while the landlord's agent and the council read English; a single file that flips between them is worth more than two files that drift apart.

The split is deliberate: only the scaffolding is translated — navigation, section headings, buttons, weekdays, the open/closed line. **The shop's own words are never touched**: its trading name, the dishes mined from its reviews, and what customers wrote all stay exactly as written. Translating a business's own name is how you produce a page it doesn't recognise as its own.

Pitch notes follow the same flag: `--lang zh` writes `pitch.md` in Chinese, and it is not a translation of the English one — the objections that actually come up across a counter in Box Hill ("我们有小红书就够了", "我亲戚会做网站", "我英文不好，看不懂后台") are different objections, and they get their own answers.

A fixture may also carry a `_zh` block: `category` for the kicker line, and `notes` — the hooks you saw standing at the door that no API returns (the awards on the wall, which neighbour on the strip already has a site). Notes reach the **pitch notes only**, never the page.

### `--draft`: the blanks are the agenda

A shop that opened last month has no rating, no reviews and often no hours on its listing. Built normally, those sections simply don't exist — correct, but it leaves you holding a short page in front of an owner. `--draft` renders them instead as **marked blanks** in the shape of the real thing: a menu with dotted leaders and no dish names, the seven weekdays with nothing beside them, three photo frames labelled *shopfront / the room / two dishes*. Nothing is invented — the page says plainly what is missing, and the blanks become the list of things you fill in together at one of their tables.

### Photos, and who is in them

Listing photos are pulled so an owner sees their own shop in the mock-up rather than a stock cafe. Two rules are enforced in code:

- **Nobody appears on a generated page.** Every downloaded image is run through Apple's Vision framework (`tools/detect-people.swift`) for faces *and* human bodies — the common listing photo is a salon client shot from behind, which registers zero faces — and any hit is deleted. It **fails closed**: if the detector is missing or errors, no photo is used at all.
- **Deleting a photo sticks.** If `photos/` already exists it is treated as reviewed: nothing is re-downloaded, so a shot you threw out doesn't come back on the next build.

### Photos you already have

`--photos-dir <dir>` uses image files from a folder instead of the API — the owner's own shots, or images saved off the listing by hand where the API is out of reach (its photo CDN is blocked on plenty of networks, and photo media is billed per request anyway). They are copied in, embedded when the build is `--flat`, and captioned only if you pass `--photo-credit`.

These files are **not** run through the people detector: whoever put them in the folder looked at them, which is a stronger check than Vision gives us and the only one available off macOS. `content-todo.md` records that the screening did not run, and says plainly that a shot taken by a reviewer belongs to that reviewer — the owner's own photos are the only ones that survive the site going live.

### The detector

The detector is a small Swift binary and needs macOS. Build it once:

```bash
swiftc -O tools/detect-people.swift -o tools/detect-people
```

Without it, builds still work — they just ship no photos. On any other platform, run with `--no-photos` so you aren't paying for images that get discarded.

Photo media is billed per request (`--photos <n>`, default 3). None of this is a licence: the images belong to the customers and staff who took them, so they're fine for showing an owner and must be replaced with the owner's own shots before the site goes live. `content-todo.md` says so on every build.

## What this tool will not do

It won't invent a menu. The Places API returns no menu data, so dish and service names are mined from review text, capped, and marked **unverified** in `content-todo.md`. **Prices are never generated** — guessing a price and putting it on a business's homepage is how you lose the sale in the first thirty seconds.

It won't put a person on a page. Listing photos are screened for faces and bodies and the failures are discarded, because the customers and staff in them never agreed to appear on a commercial site.

## Before you publish

Generated sites carry `<meta name="robots" content="noindex,nofollow">` by default. This matters: a page with a real business's name, address and phone number, indexed by Google, starts functioning as that business's official website — while the menu on it is still unverified. Keep the demo out of the index until the owner has seen it and agreed.

Once they've said yes, rebuild with `--live` to drop the tag.

Worth knowing before you send anything:

- **Reviews** — quoted review text carries author attribution in the generated page, per Google's display requirements. `--no-reviews` removes the section entirely.
- **Cold outreach** — in Australia, unsolicited commercial email falls under the [Spam Act 2003](https://www.acma.gov.au/spam-rules-businesses): you need consent, accurate sender identification, and a working unsubscribe. Walking in or phoning avoids the question altogether, and converts better.
- **Their brand** — you're building a site using someone's trading name before they've agreed to it. That's fine as a private demo. It stops being fine when it's publicly indexed and reachable as if it were theirs.

## Commands

```
forge scan   --query <text> [--type <t>] [--min-rating <n>] [--min-reviews <n>] [--max <n>] [--out <path>]
forge merge  [--top <n>]                       fold every scan in leads/ into merged.json
forge roster [--suburb <name>] [--from <leads.json>] [--top <n>] [--price <n>] [--flat]

forge site   "<address or name>" [--pick <n>] [build options]
forge build  <placeId>
forge build  --address <text> [--pick <n>]     same as forge site
forge build  --fixture <file>                  offline, no API key
forge build  --from <leads.json> [--top <n>]
forge demo

build options, common to every form above:
  --out <dir>        --layout poster|billoffare|card|storefront   --price <n>
  --lang en|zh       --draft                                      --flat
  --inline-photos    --photos <n> | --no-photos
  --photos-dir <dir> --photo-credit <s>
  --no-reviews       --no-dishes    --refresh    --live
```

Run `node bin/forge.js` with no arguments for the full option list.

## Layout

```
bin/forge.js      CLI
src/places.js     Places API (New) client — field masks drive billing
src/scan.js       website classification + lead scoring
src/profile.js    API payload -> site model; mines offerings, flags what's unverified
src/theme.js      palette selection
src/template.js   layout selection
src/i18n.js       bilingual chrome — the shop's own words are never translated
src/layouts/      poster.js, billoffare.js, card.js, storefront.js
src/render-utils.js  escaping, <head>, live open/closed script, Unicode-safe slugs
src/photos.js     photo choice, download, people screening, data-URI inlining
src/roster.js     the door-knock page
src/pitch.js      per-business pitch notes
tools/detect-people.swift  Vision face/body detector (macOS, build it yourself)
test/smoke.js     node test/smoke.js
```

## Tests

```bash
node test/smoke.js
```

Covers domain classification (including the substring trap where `matrix.com.au` must not read as a Twitter link), escaping of hostile business names and review text in both HTML and embedded JSON-LD, correct weekday alignment of opening hours, graceful degradation when a listing has no phone or no hours, and that neighbouring shops don't generate matching pages.

It also checks that `storefront` ships both languages with a working switch, that a nav item never appears without a section behind it, that `--draft` blanks show up only when asked for, that an all-CJK shop name still yields a directory instead of writing into the output root, that people screening fails closed when the detector is absent, and that a `--flat` build produces exactly the files `roster --flat` links to, with nothing loaded from outside the page.

Three regressions are pinned there deliberately: a cafe that Google also tags `restaurant` but which shuts at 3pm must not be treated as a dinner venue; HTML entities in the attribute line must survive as entities rather than being double-escaped into visible `&middot;` text; and flat output must stay in step with the roster that links it — those two halves shipped apart once, and `roster --flat` reported nothing built. All three shipped once.

## License

MIT
