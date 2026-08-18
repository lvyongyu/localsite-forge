// Smoke tests. No framework — node test/smoke.js
import assert from 'node:assert';
import { buildProfile, contentTodo } from '../src/profile.js';
import { pickTheme } from '../src/theme.js';
import { renderSite, pickLayout, layoutNames } from '../src/template.js';
import { classifyWeb, filterAndRank } from '../src/scan.js';
import fs from 'node:fs';

let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); console.log('  ok   ' + name); pass++; }
  catch (e) { console.log('  FAIL ' + name + '\n       ' + e.message); fail++; }
};
const site = (place) => {
  const p = buildProfile(place);
  return renderSite(p, pickTheme({ name: p.name, types: p.types, id: p.id }));
};

const azul = JSON.parse(fs.readFileSync(new URL('../fixtures/cafe-azul.json', import.meta.url), 'utf8'));

console.log('\nweb classification');
t('missing uri -> none',        () => assert.equal(classifyWeb(undefined), 'none'));
t('m.facebook.com -> social',   () => assert.equal(classifyWeb('https://m.facebook.com/shop'), 'social'));
t('instagram -> social',        () => assert.equal(classifyWeb('https://www.instagram.com/x'), 'social'));
t('mryum menu host -> platform',() => assert.equal(classifyWeb('https://mryum.com/venue'), 'platform'));
t('real domain -> own',         () => assert.equal(classifyWeb('https://pillarofsalt.com.au'), 'own'));
t('garbage uri -> none',        () => assert.equal(classifyWeb('not a url'), 'none'));
t('own website is not a lead',  () => assert.equal(
  filterAndRank([{ id:'x', displayName:{text:'X'}, rating:4.9, userRatingCount:900, websiteUri:'https://x.com.au' }]).length, 0));
t('phone outranks equal rival', () => {
  const [a, b] = filterAndRank([
    { id:'n', displayName:{text:'NoPhone'},  rating:4.6, userRatingCount:200 },
    { id:'p', displayName:{text:'HasPhone'}, rating:4.6, userRatingCount:200, nationalPhoneNumber:'03 1234 5678' },
  ]);
  assert.equal(a.name, 'HasPhone');
});

console.log('\nprofile');
t('early opener becomes the hook', () => {
  assert.match(buildProfile(azul).tagline, /6:00am/);
});
t('hours land on the right weekday', () => {
  const h = buildProfile(azul).hours;
  assert.equal(h[0].label, 'Sunday');
  assert.equal(h[0].text, '8:00am – 2:00pm');   // fixture: Sunday 8-2
  assert.equal(h[6].text, '6:00am – 3:00pm');   // fixture: Saturday 6-3
});
t('dishes are mined and flagged unverified', () => {
  const d = buildProfile(azul).dishes;
  assert.ok(d.length >= 5, 'expected dishes, got ' + d.length);
  assert.ok(d.every(x => x.unverified === true));
});
t('todo always warns about prices', () => {
  assert.ok(contentTodo(buildProfile(azul)).some(x => /Prices/.test(x)));
});
t('--no-dishes suppresses mining', () => {
  assert.equal(buildProfile(azul, { noDishes: true }).dishes.length, 0);
});

console.log('\nrendering');
t('html escapes a hostile business name', () => {
  const html = site({ ...azul, displayName: { text: 'Bob\'s <script>alert(1)</script> & Co' } });
  assert.ok(!html.includes('<script>alert(1)'), 'raw script tag leaked into output');
  assert.ok(html.includes('&lt;script&gt;'), 'name was not escaped');
  assert.ok(html.includes('Bob&#39;s'), 'apostrophe was not escaped');
});
t('html escapes hostile review text', () => {
  const html = site({ ...azul, reviews: [{ rating:5, authorAttribution:{displayName:'A'},
    text:{ text:'Great "food" here <img src=x onerror=alert(1)> lovely staff and coffee' } }] });
  assert.ok(!html.includes('<img src=x'), 'raw img tag leaked from review text');
});
t('no phone -> no tel: links anywhere', () => {
  const { nationalPhoneNumber, internationalPhoneNumber, ...noPhone } = azul;
  const html = site(noPhone);
  assert.ok(!html.includes('href="tel:'), 'tel link rendered without a phone number');
  assert.ok(html.includes('Find us'), 'nav fallback missing');
});
t('no hours -> hours table and status script omitted', () => {
  const { regularOpeningHours, ...noHours } = azul;
  const html = site(noHours);
  assert.ok(!html.includes('id="hours"'));
  assert.ok(!html.includes('id="status"'));
});
t('no reviews -> no quote blocks', () => {
  const p = buildProfile(azul, { noReviews: true });
  assert.ok(!renderSite(p, pickTheme({name:p.name,types:p.types,id:p.id})).includes('<blockquote>'));
});
t('structured data is valid json', () => {
  const m = site(azul).match(/application\/ld\+json">([^<]+)</);
  const ld = JSON.parse(m[1]);
  assert.equal(ld['@type'], 'LocalBusiness');
  assert.equal(ld.aggregateRating.ratingValue, 4.5);
});

console.log('\ndifferentiation (the whole point — neighbouring shops must not match)');
t('four different shops -> different palettes', () => {
  const shops = [
    { id:'1', displayName:{text:'Cafe Azul'},        types:['cafe'] },
    { id:'2', displayName:{text:'Stillman Cafe'},    types:['cafe'] },
    { id:'3', displayName:{text:'Nero Barbers'},     types:['hair_salon'] },
    { id:'4', displayName:{text:'Verde Trattoria'},  types:['restaurant'] },
  ];
  const themes = shops.map(s => pickTheme({ name:s.displayName.text, types:s.types, id:s.id }).name);
  assert.ok(new Set(themes).size >= 3, 'palettes too similar: ' + themes.join(','));
});
t('same shop twice -> identical theme (stable, not random)', () => {
  const a = pickTheme({ name:'Stillman Cafe', types:['cafe'], id:'c3' });
  const b = pickTheme({ name:'Stillman Cafe', types:['cafe'], id:'c3' });
  assert.equal(a.name, b.name);
});
t('generated pages differ structurally, not just in colour', () => {
  const a = site(azul);
  const b = site({ ...azul, id:'ZZ', displayName:{text:'Nero Barbers'}, types:['hair_salon'],
                   regularOpeningHours:{periods:[{open:{day:2,hour:9,minute:0},close:{day:2,hour:18,minute:0}}]},
                   editorialSummary:{text:'Neighbourhood barbershop.'} });
  assert.notEqual(a, b);
  // Different layouts, not the same skeleton recoloured.
  assert.ok(a.includes('<main') && b.includes('class="dock"'), 'both pages used the same structure');
});

console.log('\nlayout selection');
t('appointment trade -> card', () => {
  assert.equal(pickLayout({ isFood:false, types:['hair_salon'], hours:[], attrs:[], dishes:[] }).name, 'card');
});
t('open into the evening -> billoffare', () => {
  const hours = [{ day:5, open:17.5, close:23 }];
  assert.equal(pickLayout({ isFood:true, types:['restaurant'], hours, attrs:[], dishes:[], id:'a' }).name, 'billoffare');
});
t('REGRESSION: a cafe tagged "restaurant" but shut by 3pm is not a sit-down venue', () => {
  // Google tags most cafes as restaurant too. Trading hours are the honest
  // signal — this exact case sent Cafe Azul to the wrong layout once.
  const hours = [{ day:1, open:6, close:14.5 }, { day:6, open:6, close:15 }];
  const got = pickLayout({ isFood:true, types:['cafe','restaurant','food'], hours,
                           attrs:['Breakfast','Brunch'], dishes:[], id:'azul' });
  assert.notEqual(got.name, 'billoffare', 'a 6am-3pm cafe was classed as a dinner venue');
});
t('every layout renders, escapes, and defaults to noindex', () => {
  const p = buildProfile(azul);
  const th = pickTheme({ name:p.name, types:p.types, id:p.id });
  for (const name of layoutNames) {
    const html = renderSite({ ...p, name: 'Bad <script>alert(1)</script> Cafe' }, th, { layout: name });
    assert.ok(html.startsWith('<!doctype html>'), name + ' produced no document');
    assert.ok(html.includes('noindex'), name + ' is missing the noindex default');
    assert.ok(!html.includes('<script>alert(1)'), name + ' leaked a script tag');
    assert.ok(/<\/html>\s*$/.test(html), name + ' document is unterminated');
  }
});
t('--live drops noindex in every layout', () => {
  const p = buildProfile(azul);
  const th = pickTheme({ name:p.name, types:p.types, id:p.id });
  for (const name of layoutNames)
    assert.ok(!renderSite(p, th, { layout:name, live:true }).includes('noindex'), name);
});
t('html entities in attributes survive as entities, not literal text', () => {
  const html = renderSite(buildProfile(azul), pickTheme({name:'x',types:[],id:'x'}), { layout:'billoffare' });
  assert.ok(!html.includes('&amp;middot;'), 'entity was double-escaped into visible text');
});

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
