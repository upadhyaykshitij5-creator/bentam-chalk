# Bentam Chalk — Website Build Guide (from scratch)

*A clean-slate plan to build a minimalistic, comprehensive, accessible site whose single purpose is to turn a visitor into a buyer.*

---

## 0. The mindset: the website is a salesperson, not a brochure

Every section exists to move one person one step closer to clicking Buy. A good sales conversation does five things in order: **grab attention → build trust → make them understand → make them believe → make it effortless to say yes.** Your page is that conversation, top to bottom. If a section, image, or sentence doesn't push the visitor toward purchase, it's decoration — cut it.

Keep two documents open while you build:
- This guide (structure + where things go)
- `Bentam_Chalk_Nutrient_RDA_Website_Spec_v2.pdf` (all copy + claims, already legally worded)

---

## 1. Recommended stack (simple, from scratch, no framework needed)

You are building two products with local delivery. You do **not** need React, a CMS, or a database. Build it as:

| Layer | Use | Why |
|---|---|---|
| **HTML + CSS + a little vanilla JS** | The whole site, one page | Fast, no build step, you can edit any line directly |
| **A `data.json` file** | All nutrition numbers & product info | One place to change numbers when the lab report is corrected |
| **Small Node/Express backend** | Only for payment (create order + verify) | Payment secret keys can never live in the browser |
| **Razorpay** (India) | Checkout | Native UPI, cards, netbanking — what Indian buyers expect |
| **2 fonts, from Google Fonts** | One serif (headings), one sans (body) | Two is elegant; three looks messy |

Everything except the payment step is static files. That's the whole architecture. Resist adding anything else.

---

## 2. The page, section by section — and the ONE job each does

Build in this exact vertical order. This is the sales conversation.

| # | Section | Its ONE job | The purchase-push |
|---|---|---|---|
| 1 | **Sticky nav** | Orient + always-visible Buy button | Buy is never more than one glance away |
| 2 | **Hero** | Hook in 3 seconds | Big benefit + Buy button above the fold |
| 3 | **Trust strip** | Instant credibility | "Lab-tested, 0 cholesterol" — kills doubt early |
| 4 | **Products** (2 cards + price) | Show exactly what they can buy | Price + Buy on each card, no digging |
| 5 | **Why it's different** | 4–6 core reasons | The emotional + rational "why this one" |
| 6 | **Nutrition transparency** | Prove every claim | Honesty builds the trust that unlocks the sale |
| 7 | **Ingredient story** | "This is real food" | Clean-label reassurance |
| 8 | **Who it's for** (personas) | Self-recognition | "That's me → this is for me" |
| 9 | **Social proof** | Other people bought & liked it | The strongest purchase trigger of all |
| 10 | **How delivery works** | Remove the "can I even get it?" fear | Friction removal = fewer drop-offs |
| 11 | **Buy / Subscribe** | The conversion moment | Clear, simple, reassuring checkout |
| 12 | **FAQ** | Kill the last 5 objections | Answer the doubt that stops the click |
| 13 | **Footer** | Legal, trust, contact | FSSAI license + contact = legitimacy |

If you can't name a section's one job, don't build it.

---

## 3. How to make the visitor *ready to buy* — the conversion layer

This is the part most sites miss. Weave these six psychological levers through the page. Each maps to a section above.

**1. Lead with the benefit, not the product.** The hero must say what it does *for them* before what it *is*. Not "Soy Protein Drink" — instead **"41% of your daily protein. Zero cholesterol. Real food."** Benefit first, always.

**2. Remove risk before they feel it.** People don't buy when they're afraid of wasting money. Counter every fear explicitly: "Made fresh, no preservatives," "Lab-tested — see the report," "Not happy? [return/replace policy]," "Free/local delivery in Agra & Tundla." Put these where hesitation happens — near the price and near the Buy button.

**3. Show proof, not adjectives.** "High protein" is a claim; "22.8g — 41% of your daily protein, lab-verified" is proof. Numbers, the lab report link, and real customer photos/quotes convert far better than words like "premium" or "best."

**4. Social proof is your #1 tool.** Even 5–10 real testimonials, a WhatsApp screenshot of a happy customer, an order count ("500+ bottles delivered"), or a short founder video massively lifts willingness to buy. Build a section for it even if you start with 3 reviews — grow it over time. People buy what other people already trust.

**5. One clear action, repeated.** The Buy button appears: in the nav (sticky), in the hero, on each product card, and in the buy section. Same wording, same copper color, every time. Never make them scroll to find how to purchase. On mobile, a **sticky bottom "Buy" bar** that's always visible.

**6. Make the decision small.** Big commitments scare people. Offer a **"Try a single bottle"** or **"Starter pack"** entry point alongside the subscription. Once they've tasted it, the subscription upsell is easy. Let them start small and say yes fast.

**Gentle urgency (honest only):** "Made fresh daily — order by [time] for tomorrow's delivery" or "Limited daily batches." Never fake countdowns; Indian buyers see through them and it destroys the trust you built.

---

## 4. Asset placement map — what goes where

You already have strong assets. Each has exactly one home; don't use one just because it exists.

| Asset | Section | Notes |
|---|---|---|
| Cinematic macro / slow-motion video | **Hero** background | Muted, autoplay, loop, `playsinline`, dark overlay + poster fallback |
| Short bottle-rotation / pour videos | **Product cards** (hover) / **Ingredient story** | Loop on hover only; one video playing at a time |
| Protein-X bottle shots | **Products** + **Hero** product shot | Pick ONE hero shot; keep one alt for the card |
| Chaas / boondi pack shots | **Products** (Chaas card) | |
| Soy-magic poster | **Why it's different** band | Full-width visual break |
| Persona images (athletes, elders, students, professionals, kids, everyone) | **Who it's for** | One per persona card — this is why you shot them |
| Logo | **Nav + Footer** | Get a **transparent PNG/SVG** version — a JPEG logo with a white box looks unfinished |
| Trademark logo | **Footer** only | Small |
| Founder photos | **Social proof / About line** | Adds a human, trustworthy face — great near testimonials |

**Two asset jobs before you start:** (1) a transparent logo, (2) compress every image for web (Section 7). These lift polish and speed more than any code.

---

## 5. Content placement map — where the nutrition spec goes

Reuse copy from the spec PDF **verbatim** so claims stay legally safe.

| Website section | Pull from spec | Use as |
|---|---|---|
| Hero headline + badges | Sec 4A + 4F | "41% of your daily protein" + badges: 0 Cholesterol · 0 Dairy · 100% Plant |
| Trust strip | Sec 4A/4F + Lab-Tested | 5 icons: Complete Protein · Zero Cholesterol · Low Sugar · Omega-3 · Lab-Tested |
| Why it's different | Sec 4A/4B/4C/4D top cards | 4–6 icon cards, one line each |
| Nutrition panel | **Spec Sections 2 & 3 tables** | Tabbed table (Macros/Vitamins/Minerals/Fats/Bioactives) with %RDA bars |
| Ingredient story | Sec 4E + 4G | Isoflavones, lignans, sterols, mustard oil, spices |
| B-vitamin banner | Sec 4C | "50% Vitamin B2 + 33% Vitamin B1 — turns food into energy" |
| FAQ | Sec 6 logic | Turn guardrails into honest Q&As |
| Footer legal | Sec 6 | Mandatory: "%RDA based on 2000 kcal adult diet" + FSSAI number |

### The most important build habit
Put **all numbers in one `data.json`**, and have the hero, product cards, and nutrition panel read from it. When the corrected lab report arrives, you change one number in one place. Carry a **status flag** (`lab` / `estimated` / `confirm`) per nutrient so the panel auto-shows a green check vs an amber dot — that honesty layer is itself a trust-builder, and it stops an estimated number ever looking lab-confirmed.

```json
{
  "proteinX": {
    "sizes": { "300ml": {"protein_g":13.7,"rda":25,"kcal":110},
               "500ml": {"protein_g":22.8,"rda":41,"kcal":183} },
    "price": { "300ml": 0, "500ml": 0 },
    "nutrients": [
      {"name":"Protein","per300":"13.7 g","rda300":25,"status":"lab","claim":"use"},
      {"name":"Omega-3 ALA","per300":"~1.2 g","rda300":90,"status":"estimated","claim":"confirm"}
    ]
  }
}
```

---

## 6. Minimalism — concrete rules

- **Whitespace is the design.** Generous space between sections; content max-width ~1200px, never edge-to-edge on desktop.
- **One accent color points.** Copper = "action/important" and nothing else — buttons, key numbers, links. Everything else cream/muted. A second accent kills the minimal feel.
- **Two fonts, three heading sizes.** Serif headings, sans body. Don't add a third font.
- **Max ~5 items per section.** 5 trust icons, ≤6 benefit cards, ≤5 comparison rows. Beyond that, people stop reading.
- **One primary action per screen** — the Buy button. Everything else is a quiet outline/ghost button.
- **Cut before you add.** No section without a job from Section 2.

---

## 7. Accessibility — the checklist that matters

A dark, video-heavy site lives or dies on contrast, motion, and keyboard access.

- **Contrast ≥ 4.5:1** for all text. Muted text on a dark background is where sites fail — test and lighten if needed.
- **Hero video:** dark overlay behind text, always; never text on raw footage. Provide a poster frame.
- **Respect reduced motion:** wrap autoplay/animation in `@media (prefers-reduced-motion: reduce)` and pause it.
- **Alt text** on every meaningful image ("Bentam Chalk Soy Protein-X bottle"); `alt=""` on decorative ones.
- **Keyboard:** everything reachable by Tab, with a visible copper focus outline. Never delete focus outlines.
- **Tap targets ≥ 44×44px** on mobile, especially Buy.
- **Semantic HTML:** `<nav><header><main><section><footer><button>`. One `<h1>` (hero), `<h2>` per section.
- **Forms:** every field has a `<label>`; errors described in text, not color alone.
- **Never rely on color alone** — the lab/estimated flags need an icon or text too, not just green vs amber.

---

## 8. Mobile-first & performance (most buyers arrive on a phone)

- **Design the phone layout first**, expand to desktop. Your Agra/Tundla buyers are overwhelmingly mobile.
- **Sticky bottom Buy bar** on mobile — worth more than any animation.
- **Compress images:** ~1600px max width, ~80% quality, **WebP** (JPG fallback). Biggest speed win by far.
- **One hero video, < ~4MB**, muted + `playsinline`, poster-first. Don't autoplay several.
- **`loading="lazy"`** on every below-the-fold image.
- **Target:** usable in under ~3 seconds on mobile data. Test on a real phone, not a resized window.

---

## 9. Pre-launch checklist

- [ ] All numbers in one `data.json`; hero/cards/panel read from it
- [ ] Corrected lab numbers in (protein 13.7, energy ~110); estimated rows flagged
- [ ] Every `%RDA` shows the "based on 2000 kcal diet" footnote
- [ ] Manganese/Copper/estimated rows marked "estimated" (never on hero)
- [ ] Buy button in nav (sticky), hero, each product card, buy section — same wording/color
- [ ] Sticky mobile Buy bar working
- [ ] At least 3 real testimonials / social proof live
- [ ] Risk-reversal copy near price (fresh, no preservatives, delivery area, return policy)
- [ ] "Try one bottle" small-commitment option alongside subscription
- [ ] Transparent logo; all images WebP + lazy-loaded
- [ ] Hero video muted/playsinline/poster/reduced-motion handled
- [ ] Contrast checked (4.5:1); keyboard tab-through + visible focus
- [ ] Razorpay switched from test to live keys
- [ ] FSSAI license number in footer (legal requirement for food sales in India)
- [ ] Delivery area, contact number, refund/return policy present
- [ ] Tested on a real phone

---

## 10. Build order (follow this sequence)

1. **`data.json`** — nutrition + product + price data. Everything reads from here.
2. **Nutrition panel** — hardest and most trust-critical; build it first off the data.
3. **Hero + trust strip** — headline stat + Buy button, reading from the same data.
4. **Product cards** — with 300/500ml toggle and price + Buy on each.
5. **Why-different + ingredient story + personas** — reuse assets and spec 4E/4G.
6. **Social proof** — even 3 reviews to start.
7. **Delivery + Buy/Subscribe + Razorpay backend** — wire the payment last.
8. **FAQ + footer** — legal, FSSAI, contact.
9. **Accessibility + performance pass** — run Sections 7 & 8 over the whole page.

Start at step 1. Don't style the hero until the data layer exists, or you'll hardcode numbers you have to rip out later.

---

### The one line to remember
**Every scroll should either build trust or make buying easier. If it does neither, delete it.**
