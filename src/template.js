// Layout selection.
//
// Colour alone doesn't differentiate anything — two shops with the same
// skeleton in different palettes still read as one template. What actually
// separates them is structure, so the layout is chosen from how the business
// is used, not from how it looks:
//
//   poster      counter trade — decided on the footpath, needs "open?" fast
//   billoffare  sit-down venue — decided the night before, needs the menu
//   card        appointment trade — decided already, needs to book
//
// Where two layouts genuinely both fit (a cafe with a substantial menu), a
// stable hash of the place id picks one, so a row of neighbouring cafes
// doesn't ship a row of identical pages.

import { render as poster } from './layouts/poster.js';
import { render as billoffare } from './layouts/billoffare.js';
import { render as card } from './layouts/card.js';

const LAYOUTS = { poster, billoffare, card };

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

export function pickLayout(p) {
  if (!p.isFood) return { name: 'card', reason: 'appointment trade — the job is to book' };

  // Google's `types` array is unreliable here: it tags most cafes as
  // "restaurant" too. Trading hours are the honest signal — a place still
  // serving at 6pm is somewhere you sit down; one shut by mid-afternoon is
  // counter trade, whatever the listing calls it.
  const closes = p.hours.filter(h => h.open != null).map(h => h.close);
  const latest = closes.length ? Math.max(...closes) : 0;
  const evening = latest >= 17.5 || p.attrs.includes('Dinner') || p.attrs.includes('Wine');

  if (evening) {
    const h = Math.floor(latest) % 24;
    const clock = `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`;
    return { name: 'billoffare', reason: `still open at ${clock} — sit-down venue, menu leads` };
  }

  // Daytime trade. Both layouts suit when there's a real menu; otherwise
  // one screen is right. The id decides so neighbours differ.
  const opts = p.dishes.length >= 6 ? ['poster', 'billoffare'] : ['poster'];
  const name = opts[hash(p.id || p.name) % opts.length];
  return {
    name,
    reason: opts.length > 1
      ? `counter trade with a full menu — ${name} chosen by place id`
      : 'counter trade — one screen, open/closed first',
  };
}

export function renderSite(p, theme, opts = {}) {
  const { name } = opts.layout ? { name: opts.layout } : pickLayout(p);
  const fn = LAYOUTS[name] ?? poster;
  return fn(p, theme, opts);
}

export const layoutNames = Object.keys(LAYOUTS);
