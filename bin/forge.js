#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { searchText, placeDetails, cacheStatus } from '../src/places.js';
import { filterAndRank, toCsv, classifyWeb } from '../src/scan.js';
import { buildProfile, contentTodo } from '../src/profile.js';
import { pickTheme } from '../src/theme.js';
import { renderSite, pickLayout } from '../src/template.js';
import { buildPitch } from '../src/pitch.js';
import { slug, dirFor } from '../src/render-utils.js';
import { renderRoster } from '../src/roster.js';
import { choosePhotos, fetchPhotos, inlinePhotos, localPhotos } from '../src/photos.js';

// Minimal .env loader — avoids a dependency for one line of work.
try {
  const envPath = new URL('../.env', import.meta.url);
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const args = process.argv.slice(2);
const cmd = args[0];
const flag = (n, d) => { const i = args.indexOf('--' + n); return i > -1 ? args[i + 1] : d; };
const has = n => args.includes('--' + n);

const ROOT = new URL('..', import.meta.url).pathname;

function usage() {
  console.log(`
localsite-forge — find local businesses with no website, then build them one.

  forge scan   --query "cafe in Richmond VIC 3121" [options]
      --min-rating <n>    default 4.3
      --min-reviews <n>   default 40
      --type <t>          Places primary type, e.g. cafe, hair_salon, physiotherapist
      --max <n>           results to pull (default 40, API pages at 20)
      --out <path>        default leads/<slug>.json  (also writes .csv)

  forge merge  [--top <n>]          combine every scan in leads/ into merged.json
  forge roster [--suburb <name>] [--flat]
                                    build the door-knock page over output/

  forge site   "346 Bridge Rd, Richmond VIC 3121"
                                    one shop, one command: look the address up
                                    and build it. Takes every build option below.
      --pick <n>          use the nth match instead of the first

  forge build  <placeId>            build one site from a live lookup
  forge build  --address <text>     same as: forge site <text>
  forge build  --fixture <file>     build from a saved JSON payload (no API key needed)
  forge build  --from <leads.json>  batch-build from a scan
      --top <n>           only the top N leads (default 5)
      --out <dir>         default output/
      --no-reviews        omit Google review quotes (see attribution note in README)
      --no-dishes         omit the mined menu section entirely
      --price <n>         headline price in the generated pitch (default 1000)
      --layout <name>     override: poster | billoffare | card | storefront
      --lang <en|zh>      language the page opens in; storefront ships both
                          and carries a switch (default en)
      --draft             mark the facts the listing does not carry as blanks
                          to fill in with the owner, instead of omitting them
      --refresh           bypass the details cache and re-fetch from the API
      --photos <n>        images to use per business (default 3; billed each
                          when they come from the API)
      --photos-dir <dir>  use image files you already have instead of the API:
                          the owner's own shots, or ones saved off the listing
                          by hand. Not people-screened — you looked at them.
      --photo-credit <s>  caption to print under those images (default: none)
      --no-photos         skip images entirely
      --inline-photos     embed images as data URIs so the page needs no files
                          beside it
      --flat              write output/<shop>.html instead of a folder — one
                          self-contained file you can message to an owner
                          (implies --inline-photos; pitch notes land in
                          output/pitch/). Pair with: forge roster --flat
      --live              drop the noindex tag (ONLY after the owner has paid
                          and agreed — see "Before you publish" in the README)

  forge demo                        same as: build --fixture fixtures/cafe-azul.json

Set GOOGLE_PLACES_API_KEY (env or .env) for anything that hits the API.
`.trim());
}

// Scanning one suburb means running several category queries; they overlap
// (a cafe often comes back under "restaurant" too), so merging is a real step.
function doMerge() {
  const dir = path.join(ROOT, 'leads');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'merged.json');
  const seen = new Map();
  for (const f of files) {
    for (const l of JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))) {
      // Keep the highest-scoring sighting of each place.
      if (!seen.has(l.id) || seen.get(l.id).score < l.score) seen.set(l.id, l);
    }
  }
  const all = [...seen.values()].sort((a, b) => b.score - a.score);
  const out = path.join(dir, 'merged.json');
  fs.writeFileSync(out, JSON.stringify(all, null, 2));
  fs.writeFileSync(out.replace(/\.json$/, '.csv'), toCsv(all));

  const tally = all.reduce((a, l) => (a[l.web] = (a[l.web] || 0) + 1, a), {});
  console.log(`\nMerged ${files.length} scans -> ${all.length} unique leads`);
  console.log(`  no website: ${tally.none||0}   social only: ${tally.social||0}   platform only: ${tally.platform||0}`);
  console.log(`\nscore  rating  reviews  phone  web        name`);
  for (const l of all.slice(0, Number(flag('top', 30)))) {
    console.log(String(l.score).padStart(5), String(l.rating).padStart(7),
      String(l.reviews).padStart(8), (l.phone?'  yes':'   no').padStart(6),
      ' ' + l.web.padEnd(9), l.name);
  }
  console.log(`\nSaved: ${out}`);
}

function doRoster() {
  const from = flag('from', path.join(ROOT, 'leads', 'merged.json'));
  const outDir = flag('out', path.join(ROOT, 'output'));
  const leads = JSON.parse(fs.readFileSync(from, 'utf8')).slice(0, Number(flag('top', 30)));
  const built = leads.filter(l => {
    const b = dirFor({ name: l.name, id: l.id });
    return fs.existsSync(path.join(outDir, has('flat') ? b + '.html' : b));
  });
  const file = path.join(outDir, 'roster.html');
  fs.writeFileSync(file, renderRoster(built, {
    suburb: flag('suburb', ''), price: Number(flag('price', 1000)), flat: has('flat'),
  }));
  console.log(`\nRoster: ${built.length} of ${leads.length} leads have a built site`);
  if (built.length < leads.length)
    console.log(`  ${leads.length - built.length} missing — run build --from ${from} first`);
  console.log(`  ${file}\n`);
}

async function doScan() {
  const query = flag('query');
  if (!query) { console.error('scan needs --query, e.g. --query "cafe in Richmond VIC 3121"'); process.exit(1); }

  const places = await searchText({
    query,
    type: flag('type'),
    minRating: Number(flag('min-rating', 4.3)),
    max: Number(flag('max', 40)),
  });

  const leads = filterAndRank(places, {
    minRating: Number(flag('min-rating', 4.3)),
    minReviews: Number(flag('min-reviews', 40)),
  });

  const out = flag('out', path.join(ROOT, 'leads', slug(query) + '.json'));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(leads, null, 2));
  fs.writeFileSync(out.replace(/\.json$/, '.csv'), toCsv(leads));

  const tally = leads.reduce((a, l) => (a[l.web] = (a[l.web] || 0) + 1, a), {});
  console.log(`\nScanned ${places.length} places -> ${leads.length} leads`);
  console.log(`  no website: ${tally.none || 0}   social only: ${tally.social || 0}   platform only: ${tally.platform || 0}`);
  console.log(`  (${places.length - leads.length} filtered out: own website, low rating, or too few reviews)\n`);
  console.log('score  rating  reviews  phone  web        name');
  for (const l of leads.slice(0, 15)) {
    console.log(
      String(l.score).padStart(5),
      String(l.rating).padStart(7),
      String(l.reviews).padStart(8),
      (l.phone ? '  yes' : '   no').padStart(6),
      ' ' + l.web.padEnd(9),
      l.name);
  }
  console.log(`\nSaved: ${out}\n       ${out.replace(/\.json$/, '.csv')}`);
  console.log(`Next:  node bin/forge.js build --from ${out} --top 5`);
}

// Where a build lands. A folder per shop by default; --flat writes one
// self-contained file per shop instead, because handing an owner their
// mock-up should not involve a folder, a zip, or a deploy.
function pathsFor(outDir, base, flat) {
  return flat
    ? { html:  path.join(outDir, base + '.html'),
        pitch: path.join(outDir, 'pitch', base + '.md'),
        todo:  path.join(outDir, 'pitch', base + '-content-todo.md') }
    : { html:  path.join(outDir, base, 'index.html'),
        pitch: path.join(outDir, base, 'pitch.md'),
        todo:  path.join(outDir, base, 'content-todo.md') };
}

async function emit(place, outDir) {
  const flat = has('flat');
  const base = dirFor({ name: place.displayName?.text ?? '', id: place.id ?? '' });

  // Photos download to <outDir>/<base>/photos/ under either layout: that
  // folder is the cache, and the place you delete an unsuitable shot from —
  // a deletion that has to survive the next rebuild. Flat output embeds the
  // survivors as data URIs rather than linking to them.
  const shopDir = path.join(outDir, base);
  const fromDir = flag('photos-dir');
  let photos = [];
  if (!has('no-photos') && fromDir) {
    fs.mkdirSync(shopDir, { recursive: true });
    photos = localPhotos(fromDir, shopDir, {
      limit: Number(flag('photos', 3)), credit: flag('photo-credit', ''),
    });
  } else if (!has('no-photos')) {
    const want = choosePhotos(place, Number(flag('photos', 3)));
    if (want.length) {
      fs.mkdirSync(shopDir, { recursive: true });
      photos = await fetchPhotos(want, shopDir);
    }
  }
  const inline = flat || has('inline-photos');
  if (inline && photos.length) photos = inlinePhotos(photos, shopDir);

  const profile = buildProfile(place, {
    noReviews: has('no-reviews'), noDishes: has('no-dishes'), photos,
  });
  const theme = pickTheme({ name: profile.name, types: profile.types, id: profile.id });
  const forced = flag('layout');
  const lay = forced ? { name: forced, reason: 'forced with --layout' } : pickLayout(profile);
  const html = renderSite(profile, theme, {
    live: has('live'), layout: lay.name,
    lang: flag('lang', 'en'), draft: has('draft'),
  });

  const out = pathsFor(outDir, base, flat);
  fs.mkdirSync(path.dirname(out.html), { recursive: true });
  fs.mkdirSync(path.dirname(out.pitch), { recursive: true });
  fs.writeFileSync(out.html, html);
  fs.writeFileSync(out.pitch, buildPitch(profile, { price: Number(flag('price', 1000)) }));

  const todo = contentTodo(profile);
  fs.writeFileSync(out.todo,
    `# ${profile.name} — before this goes live\n\n` +
    `Layout: **${lay.name}** (${lay.reason})\nPalette: **${theme.name}** (${theme.reason})\n\n` +
    todo.map(t => `- [ ] ${t}`).join('\n') +
    (profile.dishes.length
      ? `\n\n## Menu items mined from review text (UNVERIFIED)\n\n` +
        profile.dishes.map(d => `- ${d.title} — mentioned ${d.mentions}x`).join('\n')
      : '') +
    `\n\n## Listing snapshot\n\n- Rating: ${profile.rating} from ${profile.reviews} reviews\n` +
    `- Phone: ${profile.phone || '(none on listing)'}\n` +
    `- Existing web: ${profile.existingWeb || '(none — this is the pitch)'}\n`);

  console.log(`  ${profile.name}  ->  ${path.relative(process.cwd(), out.html)}`);
  console.log(`     layout: ${lay.name} — ${lay.reason}`);
  console.log(`     palette: ${theme.name} — ${theme.reason}`);
  if (lay.name === 'storefront')
    console.log(`     opens in ${flag('lang', 'en') === 'zh' ? 'Chinese' : 'English'}, switch in the page`);
  if (photos.length && photos[0].local)
    console.log(`     ${photos.length} photo(s) from ${fromDir} — not screened, you looked at them` +
      `${inline ? '; embedded in the page' : ''}`);
  else if (photos.length)
    console.log(`     ${photos.length} photo(s) kept (people-free)${inline ? ', embedded in the page' : ''}`);
  if (todo.length) console.log(`     ${todo.length} item(s) need a human — see ${path.basename(out.todo)}`);
  return out.html;
}

// One shop, one command. What you actually have when someone points at a
// shopfront is an address, not a place id — so look it up, say plainly which
// listing was matched, and build that one.
async function doAddress(query) {
  // Cap the candidate list: an address is meant to be one shop, and every
  // extra result is a billed row on a query that was already ambiguous.
  const found = (await searchText({ query, max: 5 })).filter(p => p.id);
  if (!found.length) {
    throw new Error(`Nothing on Google matches "${query}".\n` +
      '  Add the suburb and postcode, or search the shop name instead of the street number.');
  }

  const n = Number(flag('pick', 1));
  const i = Number.isFinite(n) ? Math.min(Math.max(1, n), found.length) - 1 : 0;
  const chosen = found[i];

  console.log(`\nMatched: ${chosen.displayName?.text ?? '(unnamed)'} — ${chosen.formattedAddress ?? ''}`);
  if (chosen.rating) console.log(`  ${chosen.rating}★ from ${chosen.userRatingCount ?? 0} reviews`);

  const web = classifyWeb(chosen.websiteUri);
  if (web === 'own')
    console.log(`  Careful: the listing already points at a site of its own — ${chosen.websiteUri}`);
  else if (web === 'none') console.log('  No website on the listing — this is the pitch.');
  else console.log(`  ${web} only: ${chosen.websiteUri}`);

  if (found.length > 1) {
    console.log('\nOther matches (wrong shop? re-run with --pick <n>):');
    found.forEach((f, j) => {
      if (j !== i) console.log(`  ${j + 1}. ${f.displayName?.text ?? '(unnamed)'} — ${f.formattedAddress ?? ''}`);
    });
  }

  console.log('\nBuilding:');
  const dir = await emit(await placeDetails(chosen.id, { refresh: has('refresh') }),
    flag('out', path.join(ROOT, 'output')));
  console.log('\nOpen it, then walk it in.\n');
  return dir;
}

async function doBuild() {
  const outDir = flag('out', path.join(ROOT, 'output'));
  const fixture = flag('fixture');
  const from = flag('from');
  const address = flag('address');

  if (address) {
    await doAddress(address);
    return;
  } else if (fixture) {
    console.log('\nBuilding from fixture (offline):');
    await emit(JSON.parse(fs.readFileSync(fixture, 'utf8')), outDir);
  } else if (from) {
    const leads = JSON.parse(fs.readFileSync(from, 'utf8'));
    const top = leads.slice(0, Number(flag('top', 5)));
    console.log(`\nBuilding ${top.length} site(s):`);
    const before = cacheStatus();
    for (const l of top) await emit(await placeDetails(l.id, { refresh: has('refresh') }), outDir);
    console.log(`\n  cache: ${before} entries before, ${cacheStatus()} after` +
      ` (repeat builds cost nothing — pass --refresh to force a re-fetch)`);
  } else {
    const id = args[1];
    if (!id || id.startsWith('--')) { console.error('build needs a placeId, --fixture or --from'); process.exit(1); }
    console.log('\nBuilding from live lookup:');
    await emit(await placeDetails(id, { refresh: has('refresh') }), outDir);
  }
  console.log(has('flat')
    ? '\nEach file is self-contained — open one to review it, then message it to the owner.\n'
    : '\nOpen one to review it, then deploy the folder to Netlify/Cloudflare Pages.\n');
}

try {
  if (cmd === 'scan') await doScan();
  else if (cmd === 'site') {
    const q = args[1] && !args[1].startsWith('--') ? args[1] : flag('address');
    if (!q) { console.error('site needs an address, e.g. forge site "346 Bridge Rd, Richmond VIC 3121"'); process.exit(1); }
    await doAddress(q);
  }
  else if (cmd === 'merge') doMerge();
  else if (cmd === 'roster') doRoster();
  else if (cmd === 'build') await doBuild();
  else if (cmd === 'demo') { args.push('--fixture', path.join(ROOT, 'fixtures/cafe-azul.json')); await doBuild(); }
  else usage();
} catch (e) {
  console.error('\n' + e.message + '\n');
  process.exit(1);
}
