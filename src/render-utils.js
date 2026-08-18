// Shared by every layout. Escaping lives here because every value that
// reaches a template came from an external API.

export const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// JSON.stringify does not escape '<', so a name containing "</script>"
// would break out of the JSON-LD block. \u escapes keep it inert.
export const jsonInScript = obj => JSON.stringify(obj)
  .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');

export function head(p, opts, extraMeta = '') {
  const title = `${p.name}${p.suburb ? ' — ' + p.suburb : ''}`;
  const desc = p.summary || `${p.category} in ${p.suburb || 'your area'}. ${p.address}`;
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${opts.live ? '' : '<meta name="robots" content="noindex,nofollow">\n'}<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(p.name)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
${extraMeta}<script type="application/ld+json">${jsonInScript({
  '@context': 'https://schema.org', '@type': 'LocalBusiness',
  name: p.name, address: p.address, telephone: p.phone || undefined,
  ...(p.rating ? { aggregateRating: { '@type':'AggregateRating', ratingValue:p.rating, reviewCount:p.reviews } } : {}),
  ...(p.lat ? { geo: { '@type':'GeoCoordinates', latitude:p.lat, longitude:p.lng } } : {}),
})}</script>`;
}

/** Live open/closed, computed client-side from the real periods. */
export function hoursScript(p, { statusId = 'status', tableId = 'hours', dotId = null } = {}) {
  if (!p.hours.some(h => h.open != null)) return '';
  // Spans, not one pair: a restaurant that shuts between lunch and dinner is
  // "closed, opens 5pm" at 3pm, not "open until 9:30pm".
  const json = JSON.stringify(Object.fromEntries(
    p.hours.map(h => [h.day, h.spans.length ? h.spans : null])));
  return `<script>
(function(){
  var h=${json},el=document.getElementById(${JSON.stringify(statusId)});
  var f=function(x){var m=Math.round((x%1)*60),H=Math.floor(x)%24,ap=H<12?'am':'pm',d=H%12||12;
    return d+':'+String(m).padStart(2,'0')+ap;};
  var n=new Date(),d=n.getDay(),c=n.getHours()+n.getMinutes()/60,t=h[d],tm=h[(d+1)%7];
  var cur=null,next=null,i;
  if(t)for(i=0;i<t.length;i++){ if(c>=t[i][0]&&c<t[i][1]){cur=t[i];break;}
    if(c<t[i][0]&&!next)next=t[i]; }
  var open=!!cur;
  if(el){el.textContent=open?'Open now until '+f(cur[1])
    :next?'Closed \u00b7 opens '+f(next[0])+' today'
    :tm?'Closed \u00b7 opens '+f(tm[0][0])+' tomorrow':'Closed today';
    el.setAttribute('data-open',open?'yes':'no');}
  ${dotId ? `var dt=document.getElementById(${JSON.stringify(dotId)});if(dt&&!open)dt.setAttribute('data-shut','');` : ''}
  var r=document.querySelector('#${tableId} [data-d="'+d+'"]');if(r)r.setAttribute('data-today','');
})();
</script>`;
}

export const mapsHref = p =>
  `https://www.google.com/maps/search/?api=1&amp;query=${p.mapsQuery}`;

export const telHref = p => p.phoneHref ? `tel:${esc(p.phoneHref)}` : null;

/** Reduced-motion guard + focus ring, wanted by every layout. */
export const a11yCss = `
*:focus-visible{outline:2px solid currentColor;outline-offset:3px}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}`;

// Shop names in a suburb like Box Hill are frequently entirely CJK.
// Stripping to [a-z0-9] leaves an empty string, and every such shop then
// writes into the output root, silently overwriting the previous one.
// Keep any Unicode letter or digit; callers fall back to the place id.
export const slug = s => String(s ?? '').toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 60);

export const dirFor = p => slug(p.name) || 'place-' + slug(p.id) || 'place';
