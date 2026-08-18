// Turns listing facts into the specific things worth saying to THIS owner.
// Generic pitches lose. "You have 318 reviews and nothing to click" wins.

const money = n => `A$${n.toLocaleString('en-AU')}`;

export function buildPitch(p, { price = 1000, renewal = 390, trialDays = 30 } = {}) {
  const hooks = [];

  if (p.reviews >= 50 && p.rating >= 4.3) {
    hooks.push(`**${p.reviews} reviews at ${p.rating}★** — the reputation is already earned. It just has nowhere to land.`);
  }

  if (!p.existingWeb) {
    hooks.push(`**No website on the Google listing.** Someone searches "${p.category.toLowerCase()} ${p.suburb}", finds you, and has nothing to click.`);
  } else if (/facebook|instagram/i.test(p.existingWeb)) {
    hooks.push(`**The listing points at ${new URL(p.existingWeb).hostname}**, not a site of their own. Open it on a phone in front of them — that demo sells itself.`);
  } else {
    hooks.push(`**The listing points at a third-party host** (${new URL(p.existingWeb).hostname}). They're renting their online presence.`);
  }

  const early = p.hours.find(h => h.open != null && h.open <= 6.5);
  if (early) hooks.push(`**Opens at ${early.text.split(' – ')[0]}** — genuinely rare, and a real reason for tradies and early commuters to pick them. Nobody can find that out right now.`);

  if (p.hours.filter(h => h.open != null).length === 7) hooks.push(`**Open seven days** — worth saying loudly on a homepage.`);
  if (p.attrs.includes('Outdoor seating')) hooks.push(`**Outdoor seating** — high-intent search term, currently invisible.`);
  if (p.attrs.includes('Bookings available')) hooks.push(`**Takes bookings** — a click-to-call button converts this directly.`);

  const contact = p.phone
    ? `Phone on the listing: **${p.phone}**. Call, or better, walk in.`
    : `**No phone on the listing** — you can't call ahead. Walk in with the site open on your phone.`;

  return `# ${p.name} — pitch notes

*Auto-generated from the Google listing. Verify before you quote anything.*

## Why this one
${hooks.map(h => `- ${h}`).join('\n')}

## Getting to the owner
${contact}

Best window for hospitality: **weekday 1:30–2:30pm** — after the rush, before close. Never on a weekend.

## The 30-second open
> "Hi — are you the owner? I'll be quick.
> ${p.name} has ${p.reviews} reviews at ${p.rating} stars, but there's no website on your Google listing.
> So I built you one. Here — *(hand them the phone)*
> Use it free for ${trialDays} days. If you like it, it's ${money(price)} for the year and I keep it running.
> If you don't, I take it down and you owe nothing."

Show first, quote second. Do not lead with the price.

## Pricing that doesn't end after one payment
- **${money(price)} first year** — build + domain + hosting + SSL + unlimited content updates
- **${money(renewal)} per year after** — hosting, domain, maintenance
- Free for ${trialDays} days; unpaid on day ${trialDays + 1} means the site comes down, domain held 30 days

Hosting sits with you, so "it comes down" is just how a subscription works — not a threat you have to enforce awkwardly.

## Objections
| They say | You say |
|---|---|
| "Instagram is enough" | "Instagram doesn't show up when someone Googles ${p.category.toLowerCase()} near ${p.suburb}. And it can't be tapped to call you." |
| "Too expensive" | "${money(price)} a year is under A$3 a day. And the first ${trialDays} days cost nothing." |
| "I need to think" | "Nothing to decide — it's already built. Use it free for ${trialDays} days. I'll come back Thursday." |
| "My nephew does websites" | "Great — I'll hand him the domain once it's set up. Don't lose the next ${trialDays} days of customers while you wait." |
| "Who updates it?" | "Included. Message me any change, any time, for the whole year." |

## On the day they say yes
1. Register the domain (~A$20/yr, .com.au needs an ABN)
2. Rebuild with \`--live\` to drop the noindex tag
3. Deploy, then **paste the URL into their Google Business Profile "Website" field — do this with them, in person.** It's the single highest-value action in this whole process.
4. Collect real photos and confirm every menu price
`;
}
