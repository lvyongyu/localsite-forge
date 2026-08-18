// Every generated site must not look like the same template.
// Two signals drive the palette: a colour word in the business name
// (Melbourne is full of them — Azul, Verde, Nero), otherwise a stable
// hash of the place id so a given shop always gets the same look.

const PALETTES = {
  azure: {
    name: 'azure',
    ink: '#12303a', primary: '#1d5f7a', bright: '#2e8ba8', accent: '#c9694a',
    sand: '#f2e8d8', cream: '#fdfaf4', muted: '#5a6b72', sage: '#7a8f6b',
    dkBg: '#0d1f26', dkFg: '#ede4d5', dkCard: '#142b34', dkSand: '#1b3a45', dkBright: '#5fb6d4',
  },
  terracotta: {
    name: 'terracotta',
    ink: '#3a2018', primary: '#8c4530', bright: '#c2683f', accent: '#3f6b5c',
    sand: '#f4e6da', cream: '#fdf8f3', muted: '#77605a', sage: '#8a8253',
    dkBg: '#231411', dkFg: '#f0e2d6', dkCard: '#33201a', dkSand: '#3d2720', dkBright: '#e08e5f',
  },
  forest: {
    name: 'forest',
    ink: '#1a2c22', primary: '#2f5d43', bright: '#4e8f66', accent: '#c08a3e',
    sand: '#e9eee3', cream: '#fbfdf8', muted: '#5d6b60', sage: '#7d8a5f',
    dkBg: '#101a14', dkFg: '#e4ecdf', dkCard: '#18271d', dkSand: '#1e3325', dkBright: '#79bd8f',
  },
  plum: {
    name: 'plum',
    ink: '#2b1a2c', primary: '#5d3355', bright: '#8f5580', accent: '#c88a3e',
    sand: '#f1e7ee', cream: '#fdf9fc', muted: '#6b5c68', sage: '#7f8a6a',
    dkBg: '#1a1019', dkFg: '#ece0e8', dkCard: '#281a27', dkSand: '#32202f', dkBright: '#c88fb8',
  },
  charcoal: {
    name: 'charcoal',
    ink: '#1c1c1e', primary: '#2f2f33', bright: '#8a8a92', accent: '#b08d4f',
    sand: '#eceae6', cream: '#fbfaf8', muted: '#6a6a70', sage: '#7d7f74',
    dkBg: '#131315', dkFg: '#e8e6e2', dkCard: '#1e1e21', dkSand: '#26262a', dkBright: '#c9a869',
  },
  // A warm red for the shops that are actually red: Sichuan and Hunan
  // kitchens, roast houses, anywhere the food on the page is chilli-coloured.
  // The others put a cool accent against a warm ground; this one does not.
  chilli: {
    name: 'chilli',
    ink: '#39201b', primary: '#8c2f2a', bright: '#c14a3a', accent: '#c2683f',
    sand: '#f5e7dc', cream: '#fdf8f4', muted: '#78605a', sage: '#8a8253',
    dkBg: '#22120f', dkFg: '#f1e2d8', dkCard: '#321915', dkSand: '#3d211b', dkBright: '#e3806a',
  },
  harbour: {
    name: 'harbour',
    ink: '#12283a', primary: '#1f4d70', bright: '#3d84b8', accent: '#d08a42',
    sand: '#e6edf3', cream: '#fafcfe', muted: '#586b7a', sage: '#6f8a7c',
    dkBg: '#0c1a26', dkFg: '#e2ebf2', dkCard: '#132434', dkSand: '#183041', dkBright: '#66aede',
  },
};

// Colour words that show up in real shop names, across the languages
// you actually see on a Melbourne high street.
const COLOUR_WORDS = [
  [/\b(azul|azzurro|blu|blue|bleu|azure|mavi)\b/i, 'azure'],
  [/\b(verde|vert|green|gruen|yesil)\b/i, 'forest'],
  [/\b(rosso|rouge|rojo|red|kirmizi)\b/i, 'terracotta'],
  [/\b(terra|clay|amber|ochre|rust)\b/i, 'terracotta'],
  [/\b(nero|noir|negro|black|charcoal|onyx)\b/i, 'charcoal'],
  [/\b(viola|violet|plum|purple|lilac|mauve)\b/i, 'plum'],
  [/\b(oro|gold|golden|dore)\b/i, 'charcoal'],
  [/\b(bay|harbour|harbor|pier|marine|ocean|tide)\b/i, 'harbour'],
  [/\b(leaf|garden|fern|olive|grove|botanic)\b/i, 'forest'],
];

const BY_CATEGORY = {
  cafe: ['azure', 'terracotta', 'forest'],
  coffee_shop: ['azure', 'terracotta', 'charcoal'],
  bakery: ['terracotta', 'charcoal'],
  restaurant: ['charcoal', 'plum', 'terracotta'],
  bar: ['charcoal', 'plum'],
  hair_salon: ['plum', 'charcoal'],
  beauty_salon: ['plum', 'terracotta'],
  gym: ['charcoal', 'harbour'],
  physiotherapist: ['harbour', 'forest'],
  dentist: ['harbour', 'azure'],
  florist: ['forest', 'plum'],
  plumber: ['harbour', 'charcoal'],
  electrician: ['charcoal', 'harbour'],
};

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

export function pickTheme({ name = '', types = [], id = '' }) {
  for (const [re, pal] of COLOUR_WORDS) {
    if (re.test(name)) return { ...PALETTES[pal], reason: `name matched /${re.source}/` };
  }
  for (const t of types) {
    const opts = BY_CATEGORY[t];
    if (opts) {
      const pal = opts[hash(id || name) % opts.length];
      return { ...PALETTES[pal], reason: `category "${t}"` };
    }
  }
  const all = Object.keys(PALETTES);
  const pal = all[hash(id || name) % all.length];
  return { ...PALETTES[pal], reason: 'stable hash of place id' };
}

/** Override the choice: `--palette terracotta` when you know better than the hash. */
export function paletteByName(name) {
  const pal = PALETTES[name];
  if (!pal) throw new Error(`Unknown palette "${name}". Try: ${Object.keys(PALETTES).join(', ')}`);
  return { ...pal, reason: 'forced with --palette' };
}

export const paletteNames = Object.keys(PALETTES);
