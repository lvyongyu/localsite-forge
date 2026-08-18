#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { searchText, placeDetails, cacheStatus } from '../src/places.js';
import { filterAndRank, toCsv } from '../src/scan.js';
import { buildProfile, contentTodo } from '../src/profile.js';
import { pickTheme } from '../src/theme.js';
import { renderSite, pickLayout } from '../src/template.js';
import { buildPitch } from '../src/pitch.js';
import { slug, dirFor } from '../src/render-utils.js';
import { renderRoster } from '../src/roster.js';

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
  forge roster [--suburb <name>]    build the door-knock page over everything in output/

  forge build  <placeId>            build one site from a live lookup
  forge build  --fixture <file>     build from a saved JSON payload (no API key needed)
  forge build  --from <leads.json>  batch-build from a scan
      --top <n>           only the top N leads (default 5)
      --out <dir>         default output/
      --no-reviews        omit Google review quotes (see attribution note in README)
      --no-dishes         omit the mined menu section entirely
      --price <n>         headline price in the generated pitch (default 1000)
      --layout <name>     override: poster | billoffare | card
      --refresh           bypass the details cache and re-fetch from the API
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
  const built = leads.filter(l => fs.existsSync(path.join(outDir, dirFor({ name: l.name, id: l.id }))));
  const file = path.join(outDir, 'roster.html');
  fs.writeFileSync(file, renderRoster(built, {
    suburb: flag('suburb', ''), price: Number(flag('price', 1000)),
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

function emit(place, outDir) {
  const profile = buildProfile(place, { noReviews: has('no-reviews'), noDishes: has('no-dishes') });
  const theme = pickTheme({ name: profile.name, types: profile.types, id: profile.id });
  const forced = flag('layout');
  const lay = forced ? { name: forced, reason: 'forced with --layout' } : pickLayout(profile);
  const dir = path.join(outDir, dirFor(profile));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'),
    renderSite(profile, theme, { live: has('live'), layout: lay.name }));

  fs.writeFileSync(path.join(dir, 'pitch.md'), buildPitch(profile, { price: Number(flag('price', 1000)) }));

  const todo = contentTodo(profile);
  fs.writeFileSync(path.join(dir, 'content-todo.md'),
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

  console.log(`  ${profile.name}  ->  ${path.relative(process.cwd(), dir)}/index.html`);
  console.log(`     layout: ${lay.name} — ${lay.reason}`);
  console.log(`     palette: ${theme.name} — ${theme.reason}`);
  if (todo.length) console.log(`     ${todo.length} item(s) need a human — see content-todo.md`);
  return dir;
}

async function doBuild() {
  const outDir = flag('out', path.join(ROOT, 'output'));
  const fixture = flag('fixture');
  const from = flag('from');

  if (fixture) {
    console.log('\nBuilding from fixture (offline):');
    emit(JSON.parse(fs.readFileSync(fixture, 'utf8')), outDir);
  } else if (from) {
    const leads = JSON.parse(fs.readFileSync(from, 'utf8'));
    const top = leads.slice(0, Number(flag('top', 5)));
    console.log(`\nBuilding ${top.length} site(s):`);
    const before = cacheStatus();
    for (const l of top) emit(await placeDetails(l.id, { refresh: has('refresh') }), outDir);
    console.log(`\n  cache: ${before} entries before, ${cacheStatus()} after` +
      ` (repeat builds cost nothing — pass --refresh to force a re-fetch)`);
  } else {
    const id = args[1];
    if (!id || id.startsWith('--')) { console.error('build needs a placeId, --fixture or --from'); process.exit(1); }
    console.log('\nBuilding from live lookup:');
    emit(await placeDetails(id), outDir);
  }
  console.log('\nOpen one to review it, then deploy the folder to Netlify/Cloudflare Pages.\n');
}

try {
  if (cmd === 'scan') await doScan();
  else if (cmd === 'merge') doMerge();
  else if (cmd === 'roster') doRoster();
  else if (cmd === 'build') await doBuild();
  else if (cmd === 'demo') { args.push('--fixture', path.join(ROOT, 'fixtures/cafe-azul.json')); await doBuild(); }
  else usage();
} catch (e) {
  console.error('\n' + e.message + '\n');
  process.exit(1);
}
