# Bentam Chalk™ — Single-Page Website

A fast, mobile-first, single-page marketing + ordering site for **Bentam Chalk™**, a
plant-based beverage startup. Built with semantic HTML5, modern CSS (Grid/Flexbox +
custom properties), and vanilla JavaScript — **no framework, no build step**.

---

## 1. Architecture at a glance

```
final/
├── index.html      # All markup / section structure
├── styles.css      # Dark-luxury theme, all styling (tokens at top)
├── script.js       # Renders every dynamic section from data.json
├── data.json       # SINGLE SOURCE OF TRUTH — all product, nutrition & delivery data
├── README.md       # This file
└── assets (video/images referenced by exact filename):
    ├── hero.mp4.mp4
    ├── protein x.mp4.mp4
    ├── boondi chaas.mp4.mp4
    ├── nutritional.mp4.mp4
    ├── protein.jpg.jpg
    ├── chaas.jpg.jpg
    └── tm logo.jpg
```

### How `data.json` drives the site

`script.js` fetches `data.json` once on load and renders these sections from it — you
should **never hardcode numbers in the HTML**:

| Section | Reads from `data.json` |
|---|---|
| Trust strip | `trustStrip[]` |
| Serviceability check | `deliveryZones{}` (pincode → localities) |
| Product cards | `products[]` (sizes, attributes, care, order options, price) |
| Nutrition panel | `products[].nutrients{}` grouped by `macros / vitamins / minerals / bioactives`, with `%RDA` per size |
| Ingredient story | `ingredientStory[]` |
| FAQ | `faq[]` |
| Footer legal | `brand.legal` (FSSAI, UDYAM, RDA footnote) |

The product card, the size toggle, and the nutrition panel all read the **same size
figures**, so a value only ever lives in one place. Change it once → it updates everywhere.

> **Why this matters:** when the corrected lab report arrives, you edit one number in
> `data.json` and the hero stat, product card, and nutrition bars all update together.

---

## 2. Running it locally

Because the site uses `fetch("data.json")`, opening `index.html` directly with a
`file://` URL will be blocked by the browser. Serve the folder over HTTP instead:

```bash
# From inside the project folder, pick any one:
node server.mjs          # tiny bundled static server (Node, no install)
# or
python -m http.server 8080
# or
npx serve .
```

Then open `http://localhost:8080`.

> `server.mjs` is a minimal local preview server only — it is **not** the production
> backend. See Section 5 for the Razorpay backend you add before launch.

---

## 3. Common edits (no code knowledge required)

### a) Add or change a delivery pincode

Edit the `deliveryZones` object in `data.json`. Key = 6-digit pincode, value = array of
locality names shown in the dropdown:

```json
"deliveryZones": {
  "282001": ["Sadar Bazaar", "Civil Lines", "Rakabganj"],
  "999999": ["New Locality A", "New Locality B"]   // <- add a line like this
}
```

Any pincode **not** listed automatically shows the "We aren't in your area yet" waitlist.

### b) Update pricing

Each size carries two numbers in `data.json`:

- `price` — the **launch price** (what the customer pays), rendered in ₹.
- `mrp` — the **regular price** (~50% higher). Shown struck-through with an auto-calculated
  "Save X%" pill. Omit `mrp` (or set it ≤ `price`) to hide the strikethrough.

```json
"sizes": {
  "300ml": { "label": "300ml", "protein_g": 13.7, "kcal": 110, "rda_protein": 25, "price": 35, "mrp": 53 }
}
```

Current launch prices: **Protein X** 300ml ₹35 / 500ml ₹50 · **Chaas** 300ml ₹10 / 500ml ₹15 / 1 L ₹35.
The card, cart, checkout total, and the WhatsApp order message all update automatically —
change the number in one place only.

> Chaas nutrition is lab-measured **per 300 ml**; every Chaas size therefore shows the same
> per-300 ml protein figure plus a `statNote`. Only `price`/`mrp` differ between Chaas sizes.

### b2) How orders reach you — two modes (adaptive)

The checkout adapts automatically based on what you've configured, so you can move off
WhatsApp-for-payment whenever you're ready. WhatsApp always stays available as a **support**
channel (the floating button) — the question is only whether it's in the *order/payment* path.

**Mode 1 — WhatsApp fallback (default, works today).** With no gateway connected, "Place Order
on WhatsApp" builds a formatted order (items, total, name, phone, address, locality) and opens
`https://wa.me/<number>` so it lands in your chat. Every order also gets a short id (e.g. `BC…`).

**Mode 2 — Direct pay + you own the details (WhatsApp NOT in the order path).** This turns on
automatically once you set **both** of these in `data.json → brand`:

1. `payment.gateways` — a real gateway payment link (see below). Enables direct payment.
2. `orderCapture.endpoint` — a form endpoint URL so every order's details are saved to a place
   **you own** (your email inbox or a sheet), independent of WhatsApp. Free, no-KYC options:
   [Formspree](https://formspree.io) (`https://formspree.io/f/xxxx`), Getform, Basin, or a
   Google Apps Script web-app URL. On checkout the site POSTs
   `{orderId, items, total, name, phone, address, locality, payment, placedAt}` there.

In Mode 2 the button becomes "Save Details & Pay": the customer's delivery details are captured
to you, then they pay directly via the gateway button — **no WhatsApp involved in the order**.
The gateway's own dashboard also records the payer + payment, so between the two you have the
full customer record. (Set only ONE of the two and it still degrades safely — capture-only or
gateway-only both work.)

**Direct UPI payment already works**, no gateway account needed: checkout shows a
"Pay ₹X via UPI App" button (a standard `upi://pay` deep link — opens GPay/PhonePe/any UPI
app with your UPI ID, name and the exact cart total pre-filled), plus a QR code + manual UPI
ID as a fallback for desktop or if no app catches the link. Edit `data.json → brand.payment`
(`upiId`, `payeeName`, `qrImage`) to change these.

**Any other payment gateway** (Razorpay, Cashfree, Instamojo, PayU, PhonePe PG, etc.) can be
added with zero code changes once you have a real account: generate a Payment Link/Page/Button
from that gateway's own dashboard, then add it to `data.json → brand.payment.gateways`:

```json
"gateways": [
  { "label": "Razorpay", "url": "https://rzp.io/l/your-link", "note": "Optional: mention if it's a fixed amount." }
]
```

A "Pay via Razorpay" button appears in checkout automatically for every entry. Leave the
array empty until you have a **real, live** link — a placeholder URL here would silently
break checkout for a real customer. Full backend/Checkout.js integration (needed only if you
want a live "enter card number" widget rather than a hosted payment page) is still Section 5.

### c) Update a nutrition number or %RDA

Find the product in `products[]`, open its `nutrients` block, pick the category
(`macros` / `vitamins` / `minerals` / `bioactives`), and edit the row:

```json
{ "name": "Protein", "status": "LAB", "per300": "13.70 g", "per500": "22.8 g",
  "rda300": 25, "rda500": 41, "claim": "USE" }
```

- `per300` / `per500` → the displayed amount for each bottle size.
- `rda300` / `rda500` → the number that drives the **%RDA progress bar** (values over 100
  render as ">100%" text, e.g. Omega-3 at 500 ml).
- `status` and `claim` are retained in the data for internal/QA and future use but are
  **not rendered** in the current build (see note below).

### d) Replace a video or image

The site references assets by their **exact current filenames** (which include a doubled
extension, e.g. `hero.mp4.mp4`). Two options:

1. **Keep the filename:** just overwrite the file with your new asset — no code change.
2. **Use a new filename:** update the reference in `data.json`
   (`products[].video`, `products[].image`) and/or `index.html` (hero + nutrition videos
   are hard-referenced there: `hero.mp4.mp4`, `nutritional.mp4.mp4`).

All background/preview videos are already set to `muted autoplay loop playsinline` for
reliable mobile inline playback and are wrapped by a `prefers-reduced-motion` rule that
hides them for motion-sensitive users.

---

## 4. Nutrition display note (status flags)

`data.json` still carries a `status` field (`LAB` / `ESTIMATED` / `LAB+EST`) and a
`claim` field on every nutrient row, but per current project direction the site presents
all revised nutrition values **as active product claims** — it does **not** render
LAB/ESTIMATED badges or "pending confirmation" warnings.

The `%RDA based on 2000 kcal adult diet` footnote **is** still rendered wherever %RDA
appears (it's a separate labelling disclosure). If you later want to switch the
LAB/ESTIMATED transparency badges back on, the data is already present — re-enable badge
rendering in `paintNutrientRows()` / `renderStory()` inside `script.js`.

> **Regulatory reminder:** the original nutrient spec flags estimated figures as an
> FSSAI / Legal Metrology labelling consideration for packaged food in India. Confirm
> your on-site claim presentation with whoever owns regulatory sign-off before launch.

---

## 5. Secure Razorpay payment backend (BUILT-IN)

The Razorpay backend is **already wired into `server.mjs`** — zero npm dependencies (pure
Node built-ins + Razorpay's REST API over `fetch`). It stays **dormant until you set keys**,
so local static preview keeps working with no setup. Set the keys and it goes live with the
checkout automatically switching to secure, server-priced payment.

### The security model (why a customer can never set their own amount)

1. The browser sends only **what was chosen** — `[{ id, size, qty }]`, **never a price**.
2. `server.mjs` looks up prices in **`data.json`** (its own source of truth), computes the
   total, and creates a Razorpay **Order** for that exact amount (`/api/create-order`).
3. The checkout opens **bound to that `order_id`**, so Razorpay enforces the amount on its
   own servers — in the browser it's display-only and cannot be edited.
4. The **webhook** (`/api/razorpay-webhook`) re-verifies the signature over the raw body AND
   confirms the captured amount equals what we expected — **before** anything is activated.
   The client callback (`/api/verify-payment`) is only for showing the success page.

### Endpoints (all in `server.mjs`)

| Route | Purpose |
|---|---|
| `GET /api/payment-config` | Tells the frontend if live keys are set (never exposes the secret). |
| `POST /api/create-order` | Server-prices the cart from `data.json`, creates the Razorpay order. |
| `POST /api/verify-payment` | HMAC-verifies the client callback (UX only). |
| `POST /api/razorpay-webhook` | Trusted path: verifies signature + exact amount, then fulfils. |

### Go-live steps

1. **Get keys** — Razorpay Dashboard → Settings → API Keys (use **test** keys first).
2. **Set secrets as environment variables** (never in the repo / browser). Copy `.env.example`
   → `.env`, fill in `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.
3. **Run with the env file** (Node 20.6+):
   ```bash
   node --env-file=.env server.mjs
   ```
   On startup you'll see `[Razorpay payments: LIVE]`. The checkout button becomes
   **"Pay Securely"** and opens the Razorpay window with the locked amount.
4. **Create the webhook** — Dashboard → Settings → Webhooks → URL
   `https://YOUR_DOMAIN/api/razorpay-webhook`, event `payment.captured`, and paste the same
   secret into `RAZORPAY_WEBHOOK_SECRET`.
5. **Fulfilment hook** — in `server.mjs`, the webhook handler has a `TODO(owner)` where a
   confirmed, correctly-paid order lands. Add your action there (email, sheet row, etc.).
   **This is the only place a paid order should be granted** — never the client callback.
6. Switch **test → live** keys only when you're ready to take real money.

### Notes

- **Hosting:** needs an always-on Node host (Render / Railway free tier / a small VM). The
  order log (`orders.log.jsonl`) is a simple file store — fine for one always-on host. On
  **serverless** (Vercel/Netlify functions) the filesystem is ephemeral, so swap it for a DB.
- **Subscription price scaling (built-in):** each plan in `data.json → orderOptions` has a
  `deliveries` count = number of days (single 1, weekly 7, monthly 30). The customer also
  picks **bottles per day** on the product card. Line total = `bottle price × bottles/day ×
  days`. To change a plan's length, edit its `deliveries` number — the card, cart, checkout,
  and the server all recompute from it. The **days multiplier is enforced server-side**
  (`computeAmountPaise()` in `server.mjs` looks it up from `data.json`), so a tampered client
  can't shrink a monthly plan to a single-bottle charge; the customer's bottles/day is a
  validated input (1–10).
- `orders.log.jsonl` and `.env*` are blocked from being served and should be git-ignored.

---

## 6. Accessibility & performance notes baked in

- Semantic landmarks (`header/nav/main/section/footer`), one `<h1>`, `<h2>` per section.
- Visible copper focus outline; keyboard-reachable controls; 44px minimum tap targets.
- `prefers-reduced-motion` disables autoplay video and animations.
- Colour is never the only signal.
- Mobile-first CSS with a sticky bottom **Buy** bar on phones.
- **Before launch:** compress videos to < ~4 MB each and images to WebP for best mobile
  load times (see the Build Guide, Section 8).

---

## 7. Pre-launch checklist

- [ ] Real prices set on every size in `data.json`
- [ ] Real serviceable pincodes in `deliveryZones`
- [ ] Nutrition numbers reflect the latest lab report
- [ ] Razorpay backend wired and switched to **live** keys
- [ ] Assets compressed (video < 4 MB, images WebP)
- [ ] Tested on a real phone
- [ ] FSSAI + UDYAM numbers verified in footer
```
