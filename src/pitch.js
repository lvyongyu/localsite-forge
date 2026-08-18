// Turns listing facts into the specific things worth saying to THIS owner.
// Generic pitches lose. "You have 318 reviews and nothing to click" wins.

const money = n => `A$${n.toLocaleString('en-AU')}`;

export function buildPitch(p, { price = 1000, renewal = 390, trialDays = 30, lang = 'en' } = {}) {
  if (lang === 'zh') return zhPitch(p, { price, renewal, trialDays });

  // Hand-noted first: what you saw at the door beats anything the API knows.
  const hooks = [...(p.notes ?? [])];

  if (!p.rating) {
    hooks.push(`**New shop, no ratings yet.** Nothing to lose and everything to set up: the site, the Google listing link, and the first reviews all start from zero this month.`);
  }

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

  // A brand-new shop has no rating and no reviews. Reading a listing's
  // emptiness back to the owner as "0 reviews at null stars" ends the
  // conversation; the honest version of that fact is the pitch itself.
  const standing = p.rating
    ? `${p.name} has ${p.reviews} reviews at ${p.rating} stars, but there's no website on your Google listing.`
    : `I went looking for ${p.name} online and there's no website on your Google listing — nothing to send anyone.`;

  return `# ${p.name} — pitch notes

*Auto-generated from the Google listing. Verify before you quote anything.*

## Why this one
${hooks.map(h => `- ${h}`).join('\n')}

## Getting to the owner
${contact}

Best window for hospitality: **weekday 1:30–2:30pm** — after the rush, before close. Never on a weekend.

## The 30-second open
> "Hi — are you the owner? I'll be quick.
> ${standing}
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

// 中文话术。不是英文稿的翻译 —— 走进一家湘菜馆跟老板讲的话，和递给一家咖啡
// 馆店主的说法本来就不是一回事：价格要说得干脆，试用要说清楚谁承担风险，
// 「我侄子会做网站」这条异议在华人商圈出现的频率是其他说法的好几倍。
function zhPitch(p, { price, renewal, trialDays }) {
  const money = n => `A$${n.toLocaleString('en-AU')}`;
  // Hand-noted first: what you saw at the door beats anything the API knows.
  const hooks = [...(p.notes ?? [])];

  if (!p.rating) {
    hooks.push(`**新店，还没有评分。** 现在是最好的时候：网站、Google 商家资料、第一批评价可以一起从零做起，不用等口碑攒够了再补。`);
  } else if (p.reviews >= 50 && p.rating >= 4.3) {
    hooks.push(`**${p.reviews} 条评价、${p.rating} 星。** 口碑已经挣到了，只是没有落脚的地方。`);
  }

  if (!p.existingWeb) {
    hooks.push(`**Google 商家资料上没有网站。** 有人搜「${p.suburb || '这一带'} 湘菜 / 中餐」，找到你们，然后没有任何东西可以点进去。`);
  } else if (/facebook|instagram|xiaohongshu/i.test(p.existingWeb)) {
    hooks.push(`**商家资料指向的是社交主页**（${new URL(p.existingWeb).hostname}），不是自己的网站。当面用手机打开给老板看，这一步本身就是说服。`);
  } else {
    hooks.push(`**商家资料指向的是第三方平台**（${new URL(p.existingWeb).hostname}）—— 等于把自己的门面租在别人家里。`);
  }

  const early = p.hours.find(h => h.open != null && h.open <= 6.5);
  if (early) hooks.push(`**${early.text.split(' – ')[0]} 就开门** —— 这在这条街上很少见，但现在没人查得到。`);
  if (p.hours.filter(h => h.open != null).length === 7) hooks.push(`**一周七天营业** —— 值得放在首页最显眼的位置。`);
  if (p.attrs.includes('Outdoor seating')) hooks.push(`**有户外座位** —— 搜索意图很强的关键词，现在完全看不见。`);
  if (p.attrs.includes('Bookings available')) hooks.push(`**接受订位** —— 页面上一个可点击的电话按钮就能直接转化。`);

  const contact = p.phone
    ? `商家资料上的电话：**${p.phone}**。可以打，但更建议直接走进去。`
    : `**商家资料上没有电话** —— 打不了预约电话，直接带着手机上门，页面开着给老板看。`;

  return `# ${p.name} — 谈判话术

*根据 Google 商家资料自动生成。报价前请自行核实每一条。*

## 为什么是这家
${hooks.map(h => `- ${h}`).join('\n')}

## 怎么见到老板
${contact}

餐饮业最好的时间窗：**工作日下午 1:30–2:30** —— 午市刚过、还没打烊。周末绝对不要去。

## 30 秒开场
> 「老板您好，占用您两分钟。
> 我在 Google 上找${p.name}，发现你们商家资料里没有网站，客人搜到你们之后没有任何东西可以点。
> 所以我先做了一个 —— 您看。*（把手机递过去）*
> 免费用 ${trialDays} 天。觉得有用，${money(price)} 一年，我负责一直帮你们维护更新。
> 觉得没用，我把它撤掉，您一分钱都不用付。」

**先给看，再说价格。** 不要一上来就报数字。

## 报价结构
- **首年 ${money(price)}** —— 建站 + 域名 + 服务器 + SSL 证书 + 全年内容随时改
- **次年起 ${money(renewal)}/年** —— 服务器、域名、日常维护
- 前 ${trialDays} 天免费；第 ${trialDays + 1} 天没付款，站点自动下线，域名替你保留 30 天

服务器在你手上，所以「不付款就下线」只是订阅到期，不用你去做什么难堪的事。

## 常见异议
| 老板会说 | 你这样回 |
|---|---|
| 「我们有小红书/微信就够了」 | 「小红书上的是找中文客人，Google 上搜的是本地客人和老外，两拨人。而且小红书没法直接点一下就打你们电话。」 |
| 「太贵了」 | 「${money(price)} 一年，一天不到三块钱，一份小菜的钱。而且前 ${trialDays} 天不要钱。」 |
| 「我要考虑一下」 | 「不用考虑，东西已经做好了，先免费用 ${trialDays} 天。我周四再过来一趟。」 |
| 「我亲戚/朋友会做网站」 | 「挺好，做好了我把域名转给他。但别为了等这个，白白丢掉接下来 ${trialDays} 天的客人。」 |
| 「以后谁帮我改？」 | 「包含在里面。全年随时微信发我，改什么都行。」 |
| 「我英文不好，看不懂后台」 | 「不用后台。您微信发我要改的字或者图片，我改完发链接给您看。页面本身也是中英文一键切换的。」 |

## 老板点头当天要做的四件事
1. 注册域名（约 A$20/年；.com.au 需要 ABN）
2. 用 \`--live\` 重新生成，去掉 noindex 标签
3. 部署上线，然后**当着老板的面，把网址填进他们的 Google 商家资料「网站」那一栏** —— 这一步的价值高过前面所有步骤
4. 收齐真实照片，逐道确认菜名和价格

## 上线前必须确认（不确认就别上线）
- 菜名、价格：一律由店家提供，**不要猜**
- 照片版权：Google 评论里的照片属于拍照的客人，不属于店家。演示可以，上线必须换成店家自己拍的
- 页面里有没有出现客人的脸：有就删掉那张
`;
}
