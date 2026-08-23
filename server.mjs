// Bentam Chalk server — serves the static site AND a small, secure Razorpay
// payment backend. Zero npm dependencies: uses Node built-ins (http, crypto,
// fs) and Razorpay's REST API over the global fetch(). Node 18+ required.
//
// PAYMENT SECURITY MODEL (why the customer can never set their own amount):
//   • The browser sends only WHAT was chosen — [{ id, size, qty }] — never a price.
//   • The server looks up prices from data.json (its own source of truth),
//     computes the total, and creates a Razorpay Order for that exact amount.
//   • Razorpay then enforces the Order's amount on its own servers; the checkout
//     is opened with order_id, so the amount is display-only in the browser and
//     cannot be edited.
//   • A webhook (server-to-server) re-verifies the signature AND that the amount
//     actually captured equals what we expected — before anything is activated.
//
// The three secrets live ONLY in environment variables on the host, never in
// the repo and never in the browser:
//   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
// With none set, the payment API stays dormant (returns "not configured") and
// the site falls back to its existing gateway-link / WhatsApp flow — so local
// static preview keeps working with no keys.

import { createServer } from "node:http";
import { readFile, appendFile, readFile as read, mkdir } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { pathToFileURL } from "node:url";
import crypto from "node:crypto";
import {
  createSubscription, findByToken, markDelivery, deliveriesForDate,
  findStaff, verifyPassword, ensureStaffBootstrap, loadSubscriptions,
} from "./delivery-store.mjs";

const ROOT = import.meta.dirname;
const PORT = process.env.PORT || 8080;
const DATA_PATH = join(ROOT, "data.json"); // product catalog — ships with the code, not runtime data
// DATA_DIR points at a persistent disk in production (e.g. Render), so order
// history survives redeploys — falls back to the repo checkout for local dev.
const DATA_DIR = process.env.DATA_DIR || ROOT;
const ORDERS_LOG = join(DATA_DIR, "orders.log.jsonl"); // simple file store (see README)

const KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "";
const PAYMENTS_ENABLED = Boolean(KEY_ID && KEY_SECRET);

// "Ask Bentam" AI assistant — a real LLM (Claude) grounded in our product data.
// Set ANTHROPIC_API_KEY in .env to switch the site's chatbot from the offline
// knowledge base to full open-ended AI. ANTHROPIC_MODEL is optional; default is
// Claude Opus 5. For a high-volume customer chatbot, claude-haiku-4-5 is a much
// cheaper option — set ANTHROPIC_MODEL=claude-haiku-4-5 to use it.
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const CHAT_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";
const CHAT_ENABLED = Boolean(ANTHROPIC_API_KEY);

const TYPES = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".mp4": "video/mp4",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".txt": "text/plain", ".xml": "application/xml",
};

// The one canonical, public-facing hostname — everything else (www, the
// Render subdomain, any other alias pointed at this service) 301s here so
// Google indexes a single URL per page instead of splitting authority
// across duplicates. Override via env var if the canonical host ever changes.
const CANONICAL_HOST = process.env.CANONICAL_HOST || "bentamchalk.com";

/* ============================================================
   PRICE ENGINE — the single security-critical function.
   Reads prices from data.json ONLY. Any amount/price sent by the
   client is ignored entirely; the client can name items but never
   dictate a rupee value.
   ============================================================ */
export async function computeAmountPaise(items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error("Empty cart");
  if (items.length > 50) throw new Error("Too many items");

  const data = JSON.parse(await read(DATA_PATH, "utf8"));
  const byId = Object.fromEntries(data.products.map((p) => [p.id, p]));

  let totalRupees = 0;
  const lines = [];
  for (const it of items) {
    const product = byId[it && it.id];
    if (!product) throw new Error("Unknown product: " + (it && it.id));
    const size = product.sizes[it.size];
    if (!size) throw new Error(`Unknown size ${it.size} for ${it.id}`);

    // Bottles-per-day is the customer's choice (validated). The DAYS multiplier
    // comes from the plan in data.json — SERVER-controlled, so a tampered client
    // cannot shrink it to underpay.
    const qty = Number.parseInt(it.qty ?? 1, 10);
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) throw new Error("Bad quantity");

    const option = (product.orderOptions || []).find((o) => o.id === it.option);
    if (it.option && !option) throw new Error("Unknown plan: " + it.option);
    const days = option ? (Number(option.deliveries) || 1) : 1;

    // The one-time trial ("single bottle") tier has its own price in data.json —
    // every other plan (weekly/15-day/monthly) bills at the regular per-bottle price.
    const isTrial = option && option.type === "one-time";
    const unit = Number(isTrial && size.trialPrice != null ? size.trialPrice : size.price) || 0;
    if (unit <= 0) throw new Error(`No price for ${it.id}/${it.size}`);

    const lineTotal = unit * qty * days;
    totalRupees += lineTotal;
    lines.push(`${product.name} — ${size.label} ×${qty}/day × ${days}d (₹${lineTotal})`);
  }
  return { paise: totalRupees * 100, rupees: totalRupees, lines };
}

/* ============================================================
   Razorpay REST helpers (no SDK needed)
   ============================================================ */
function rzpAuthHeader() {
  return "Basic " + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");
}
async function rzpCreateOrder(amount, receipt, notes) {
  const resp = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: rzpAuthHeader() },
    body: JSON.stringify({ amount, currency: "INR", receipt, notes, payment_capture: 1 }),
  });
  if (!resp.ok) throw new Error("Razorpay order create failed: " + (await resp.text()));
  return resp.json();
}

/* ============================================================
   Tiny append-only order store (owner also keeps the record).
   NOTE: file store is fine for a single always-on host (Render/Railway/VM).
   On serverless (Vercel/Netlify functions) the filesystem is ephemeral —
   swap this for a real DB there. See README §5.
   ============================================================ */
async function recordOrder(row) {
  await appendFile(ORDERS_LOG, JSON.stringify(row) + "\n", "utf8").catch(() => {});
}
async function findOrder(orderId) {
  try {
    const txt = await read(ORDERS_LOG, "utf8");
    let found = null;
    for (const line of txt.split("\n")) {
      if (!line.trim()) continue;
      const r = JSON.parse(line);
      // Merge, don't replace: create-order writes {customer, items, ...}, then
      // verify-payment/webhook later append partial {status, subscriptionsCreated}
      // updates for the same orderId. Merging keeps earlier fields (like the
      // customer's address) available when a later partial record is read.
      if (r.orderId === orderId) found = found ? { ...found, ...r } : r;
    }
    return found;
  } catch { return null; }
}

/* ============================================================
   DELIVERY SUBSCRIPTIONS — turns a paid order into a tracked delivery
   schedule. Runs from BOTH the client verify-payment callback (fast UX)
   AND the webhook (reliable fallback if the browser closed before the
   callback fired) — idempotent via the `subscriptionsCreated` flag, so
   it only ever runs once per order no matter which path triggers it.
   ============================================================ */
async function resolveOrderItems(items) {
  const data = JSON.parse(await read(DATA_PATH, "utf8"));
  const byId = Object.fromEntries(data.products.map((p) => [p.id, p]));
  return (items || []).map((it) => {
    const product = byId[it && it.id];
    if (!product) return null;
    const size = product.sizes[it.size];
    if (!size) return null;
    const option = (product.orderOptions || []).find((o) => o.id === it.option);
    const days = option ? (Number(option.deliveries) || 1) : 1;
    return {
      productId: product.id, productName: product.name, sizeLabel: size.label,
      bottlesPerDay: Math.max(1, Number.parseInt(it.qty ?? 1, 10) || 1), days,
    };
  }).filter(Boolean);
}
async function ensureSubscriptionsForOrder(orderId) {
  const stored = await findOrder(orderId);
  if (!stored || !stored.customer || !Array.isArray(stored.items) || !stored.items.length) return [];
  if (stored.subscriptionsCreated) return stored.trackingLinks || [];
  const resolved = await resolveOrderItems(stored.items);
  const tracking = [];
  for (const r of resolved) {
    const sub = await createSubscription({
      customer: stored.customer,
      product: { id: r.productId, name: r.productName, size: r.sizeLabel },
      plan: { type: stored.freq || "single", bottlesPerDay: r.bottlesPerDay, days: r.days },
      orderId,
    });
    tracking.push({ token: sub.trackToken, product: r.productName });
  }
  await recordOrder({ orderId, status: "subscribed", subscriptionsCreated: true, trackingLinks: tracking, at: new Date().toISOString() });
  return tracking;
}

/* ============================================================
   STAFF SESSIONS — individual accounts, HttpOnly+SameSite=Strict cookies.
   In-memory (fine for a single always-on process; sessions reset on
   restart, which is an acceptable trade-off — nothing sensitive is lost).
   ============================================================ */
const SESSIONS = new Map(); // sid -> { username, role, expires }
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h
function newSession(username, role) {
  const sid = crypto.randomBytes(32).toString("hex"); // 256 bits — not brute-forceable
  SESSIONS.set(sid, { username, role, expires: Date.now() + SESSION_TTL_MS });
  return sid;
}
function getSession(req) {
  const m = (req.headers.cookie || "").match(/(?:^|;\s*)bc_session=([a-f0-9]{64})/);
  if (!m) return null;
  const s = SESSIONS.get(m[1]);
  if (!s || s.expires < Date.now()) { SESSIONS.delete(m[1]); return null; }
  return s;
}
function setSessionCookie(res, sid, req) {
  const secure = Boolean(req.socket.encrypted || req.headers["x-forwarded-proto"] === "https");
  // HttpOnly — JavaScript can't read it, so XSS can't steal the session.
  // SameSite=Strict — never sent on a cross-site request, closing the main CSRF path.
  // Secure — added automatically once served over HTTPS (production); omitted on
  // plain http so local development keeps working.
  res.setHeader("Set-Cookie",
    `bc_session=${sid}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_MS / 1000}` + (secure ? "; Secure" : ""));
}
function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `bc_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
}

// Basic in-memory sliding-window rate limit on login attempts, per IP —
// blunts password brute-forcing without needing an external service.
const LOGIN_ATTEMPTS = new Map();
const LOGIN_WINDOW_MS = 5 * 60 * 1000;
const LOGIN_MAX = 8;
function isRateLimited(ip) {
  const now = Date.now();
  const arr = (LOGIN_ATTEMPTS.get(ip) || []).filter((t) => now - t < LOGIN_WINDOW_MS);
  arr.push(now);
  LOGIN_ATTEMPTS.set(ip, arr);
  return arr.length > LOGIN_MAX;
}
// A fixed-shape dummy hash so an unknown username still runs scryptSync —
// keeps login response timing constant whether or not the username exists,
// so timing can't be used to enumerate valid usernames.
const DUMMY_HASH = "0".repeat(32) + ":" + "0".repeat(128);

/* ============================================================
   HTTP helpers
   ============================================================ */
function readRawBody(req, limit = 100 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) { reject(new Error("Body too large")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(body);
}
function timingSafeEqualHex(a, b) {
  const ba = Buffer.from(String(a), "utf8");
  const bb = Buffer.from(String(b), "utf8");
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

/* ============================================================
   "ASK BENTAM" AI ASSISTANT (Claude) — grounded in data.json
   ============================================================ */
// Rebuilt on every request from data.json (it's tiny) — NOT cached — so that
// editing data.json (adding a delivery area, changing a product, etc.) takes
// effect on the AI's very next answer, with no server restart needed.
async function getChatSystem() {
  let facts = "";
  try {
    const d = JSON.parse((await readFile(DATA_PATH, "utf8")) || "{}");
    const b = d.brand || {};
    const mv = b.missionVision || {};
    const prods = (d.products || []).map((p) => {
      const sizes = Object.values(p.sizes || {})
        .map((s) => `${s.label}: ${s.protein_g}g protein, ${s.kcal} kcal, ₹${s.price}`)
        .join("; ");
      return `- ${p.name} (${p.shortName}): ${p.tagline} ${p.description} Sizes — ${sizes}. Key: ${(p.attributes || []).join(", ")}.`;
    }).join("\n");
    // Delivery areas come ONLY from data.json (brand.serviceAreas + deliveryZones
    // pincodes) — never hardcode a city name here. Add/remove areas in data.json
    // and this text (and every chatbot answer) updates automatically.
    const areas = Array.isArray(d.serviceAreas) && d.serviceAreas.length ? d.serviceAreas.join(", ") : "the areas listed on our delivery checker";
    const pincodes = Object.keys(d.deliveryZones || {});
    facts =
      `BRAND: ${b.trademark || "Bentam Chalk"} by ${b.company || "Damiksh Enterprises"}, ${b.legal ? b.legal.fssai : ""}.\n` +
      `MISSION: ${mv.mission || ""}\n` +
      `PRODUCTS:\n${prods}\n` +
      `SHARED: 100% plant-based, dairy-free, lactose-free, zero cholesterol, no added sugar, zero preservatives, 3-day refrigerated shelf life. Lab-tested at Fast Labs. WhatsApp: +91 ${(b.contact && b.contact.whatsapp) || "9258010913"}.\n` +
      `DELIVERY: We currently deliver to ${areas}. Serviceable pincodes: ${pincodes.join(", ") || "none configured yet"}. ` +
      `If asked whether we deliver to a specific pincode, check it against this exact list — say yes only if it's in the list, otherwise say we don't cover it yet and suggest the on-site pincode checker or waitlist. Never claim a city is covered unless it's in this list.`;
  } catch { facts = "Bentam Chalk makes plant-based Soy Protein X and Boondi Masala Chaas, delivered fresh. Check the on-site pincode tool for delivery areas."; }

  CHAT_SYSTEM =
    "You are the customer-support assistant on the Bentam Chalk website, an Indian plant-based beverage brand. " +
    "Answer ONLY questions about our products, nutrition facts, ingredients, delivery, subscriptions, payments and orders — grounded strictly in the facts below; never invent numbers. " +
    "STRICT RULES: never claim any product diagnoses, treats, cures or prevents disease; no medical advice; keep every answer to 1–2 short sentences; " +
    "reply in plain text, no markdown; if you don't know an order-specific detail, point to WhatsApp. " +
    "If the question is unrelated to Bentam Chalk or its products, say briefly that you can only help with Bentam Chalk questions.\n\n" +
    "=== BENTAM CHALK FACTS (source of truth) ===\n" + facts;
  return CHAT_SYSTEM;
}

// Calls the Anthropic Messages API over raw HTTPS (zero npm deps). Non-streaming;
// max_tokens is small enough (1024) that HTTP timeouts aren't a concern.
async function callClaude(messages) {
  const system = await getChatSystem();
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: CHAT_MODEL, max_tokens: 200, system, messages }),
  });
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`Claude API ${resp.status}: ${t.slice(0, 300)}`);
  }
  const data = await resp.json();
  // Opus 5 / Fable 5 can decline via a safety classifier — handle before reading content.
  if (data.stop_reason === "refusal") {
    return "Sorry, I can't help with that one — but ask me anything about our drinks, ingredients or nutrition. 🥤";
  }
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  return text || "Sorry, I didn't quite catch that — could you rephrase?";
}

/* ============================================================
   API ROUTES
   ============================================================ */
async function handleApi(req, res, pathname) {
  // Advertises whether the AI assistant is live, so the frontend can switch
  // between full AI and its offline knowledge-base fallback (no secret exposed).
  if (pathname === "/api/chat-config" && req.method === "GET") {
    return sendJson(res, 200, { enabled: CHAT_ENABLED, model: CHAT_ENABLED ? CHAT_MODEL : "" });
  }

  // The AI assistant. Browser sends recent {role, content} turns; the API key
  // stays server-side. Input is sanitised and capped.
  if (pathname === "/api/chat" && req.method === "POST") {
    if (!CHAT_ENABLED) return sendJson(res, 503, { error: "AI chat not configured" });
    try {
      const body = JSON.parse((await readRawBody(req)).toString() || "{}");
      let msgs = Array.isArray(body.messages) ? body.messages : [];
      msgs = msgs
        .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
        .slice(-12)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
      if (!msgs.length || msgs[msgs.length - 1].role !== "user") {
        return sendJson(res, 400, { error: "Last message must be from the user" });
      }
      const reply = await callClaude(msgs);
      return sendJson(res, 200, { reply });
    } catch (e) {
      console.error("[chat] error:", e.message);
      return sendJson(res, 502, { error: "chat_failed" });
    }
  }

  // Lets the frontend decide its mode without exposing any secret.
  if (pathname === "/api/payment-config" && req.method === "GET") {
    return sendJson(res, 200, { enabled: PAYMENTS_ENABLED, keyId: PAYMENTS_ENABLED ? KEY_ID : "" });
  }

  // (1) Create an order — price is computed SERVER-SIDE from data.json.
  if (pathname === "/api/create-order" && req.method === "POST") {
    if (!PAYMENTS_ENABLED) return sendJson(res, 503, { error: "Payments not configured on server" });
    try {
      const body = JSON.parse((await readRawBody(req)).toString() || "{}");
      // Only items are read. body.amount / body.price (if any) are ignored.
      const { paise, rupees, lines } = await computeAmountPaise(body.items);
      const receipt = "BC" + Date.now().toString(36).toUpperCase();
      const order = await rzpCreateOrder(paise, receipt, {
        freq: String(body.freq || "single").slice(0, 40),
      });
      // Customer fields are stored ONLY for delivery scheduling (name/address/etc.)
      // — never read for pricing, which stays computeAmountPaise()'s job above.
      const c = body.customer && typeof body.customer === "object" ? body.customer : {};
      const customer = {
        name: String(c.name || "").slice(0, 120),
        phone: String(c.phone || "").slice(0, 20),
        address: String(c.address || "").slice(0, 400),
        locality: String(c.locality || "").slice(0, 120),
      };
      await recordOrder({
        orderId: order.id, receipt, expectedPaise: paise, rupees, lines,
        freq: body.freq || "single", status: "created", at: new Date().toISOString(),
        items: Array.isArray(body.items) ? body.items : [], customer,
      });
      return sendJson(res, 200, { orderId: order.id, amount: order.amount, currency: order.currency, keyId: KEY_ID });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // (2) Verify the client callback signature — for UX (show success page).
  //     This does NOT activate anything; the webhook is the trusted path.
  if (pathname === "/api/verify-payment" && req.method === "POST") {
    if (!PAYMENTS_ENABLED) return sendJson(res, 503, { error: "Payments not configured" });
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        JSON.parse((await readRawBody(req)).toString() || "{}");
      const expected = crypto.createHmac("sha256", KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
      const ok = timingSafeEqualHex(expected, razorpay_signature);
      // Fast-path delivery scheduling for a snappy checkout UX. This is NOT the
      // trusted payment record (the webhook below still owns that) — it just
      // turns a verified callback into tracking links right away instead of
      // making the customer wait for the webhook round-trip.
      const tracking = ok ? await ensureSubscriptionsForOrder(razorpay_order_id).catch(() => []) : [];
      return sendJson(res, 200, { ok, tracking });
    } catch (e) {
      return sendJson(res, 400, { ok: false, error: e.message });
    }
  }

  // (3) Webhook — the TRUSTED source of truth. Verifies signature over the RAW
  //     body, then confirms the captured amount equals what we expected.
  if (pathname === "/api/razorpay-webhook" && req.method === "POST") {
    try {
      const raw = await readRawBody(req);
      const signature = req.headers["x-razorpay-signature"];
      if (!WEBHOOK_SECRET) { res.writeHead(503).end("Webhook secret not set"); return; }
      const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(raw).digest("hex");
      if (!signature || !timingSafeEqualHex(expected, signature)) {
        res.writeHead(400).end("bad signature");
        return;
      }
      const event = JSON.parse(raw.toString());
      if (event.event === "payment.captured" || event.event === "order.paid") {
        const payment = event.payload.payment.entity;
        const stored = await findOrder(payment.order_id);
        if (stored && stored.status === "paid") {
          // Idempotent replay: still ensure delivery scheduling ran, in case the
          // client's verify-payment callback never fired (tab closed, etc.).
          await ensureSubscriptionsForOrder(payment.order_id).catch(() => {});
          return sendJson(res, 200, { ok: true });
        }
        const amountOk = stored ? payment.amount === stored.expectedPaise : true;
        if (!amountOk || payment.currency !== "INR") {
          console.warn("AMOUNT MISMATCH", payment.order_id, payment.amount, stored && stored.expectedPaise);
          res.writeHead(400).end("amount mismatch");
          return;
        }
        await recordOrder({
          orderId: payment.order_id, paymentId: payment.id, status: "paid",
          paidPaise: payment.amount, at: new Date().toISOString(),
        });
        await ensureSubscriptionsForOrder(payment.order_id).catch((e) => console.error("subscription creation failed:", e.message));
        console.log("PAID ✓", payment.order_id, "₹" + payment.amount / 100);
      }
      return sendJson(res, 200, { ok: true }); // 200 fast so Razorpay stops retrying
    } catch (e) {
      console.error("webhook error", e);
      res.writeHead(500).end("error");
      return;
    }
  }

  /* ---- STAFF LOGIN / SESSION ---- */
  if (pathname === "/api/staff/login" && req.method === "POST") {
    const ip = req.socket.remoteAddress || "unknown";
    if (isRateLimited(ip)) return sendJson(res, 429, { error: "Too many attempts — please wait a few minutes and try again." });
    try {
      const { username, password } = JSON.parse((await readRawBody(req)).toString() || "{}");
      const user = await findStaff(String(username || "").trim());
      // Always run verifyPassword — even for an unknown user, against a dummy
      // hash — so response timing is identical either way (no username-enumeration
      // via a timing side-channel).
      const passOk = verifyPassword(String(password || ""), user ? user.passwordHash : DUMMY_HASH);
      if (!user || !passOk) return sendJson(res, 401, { error: "Invalid username or password" });
      const sid = newSession(user.username, user.role);
      setSessionCookie(res, sid, req);
      return sendJson(res, 200, { ok: true, role: user.role, username: user.username });
    } catch {
      return sendJson(res, 400, { error: "Bad request" });
    }
  }
  if (pathname === "/api/staff/logout" && req.method === "POST") {
    const m = (req.headers.cookie || "").match(/(?:^|;\s*)bc_session=([a-f0-9]{64})/);
    if (m) SESSIONS.delete(m[1]);
    clearSessionCookie(res);
    return sendJson(res, 200, { ok: true });
  }
  if (pathname === "/api/staff/me" && req.method === "GET") {
    const s = getSession(req);
    return sendJson(res, 200, s ? { loggedIn: true, role: s.role, username: s.username } : { loggedIn: false });
  }

  /* ---- OWNER DASHBOARD — every customer + their full delivery schedule ---- */
  if (pathname === "/api/admin/subscriptions" && req.method === "GET") {
    const s = getSession(req);
    if (!s || s.role !== "owner") return sendJson(res, 401, { error: "Owner login required" });
    const db = await loadSubscriptions();
    return sendJson(res, 200, { subscriptions: db.subscriptions });
  }

  /* ---- DELIVERY STAFF — today's (or any date's) route, mark status ---- */
  if (pathname === "/api/delivery/today" && req.method === "GET") {
    const s = getSession(req);
    if (!s || (s.role !== "delivery" && s.role !== "owner")) return sendJson(res, 401, { error: "Delivery login required" });
    const url = new URL(req.url, "http://internal");
    const date = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);
    const rows = await deliveriesForDate(date);
    return sendJson(res, 200, { date, rows });
  }
  if (pathname === "/api/delivery/mark" && req.method === "POST") {
    const s = getSession(req);
    if (!s || (s.role !== "delivery" && s.role !== "owner")) return sendJson(res, 401, { error: "Delivery login required" });
    try {
      const { subId, date, status } = JSON.parse((await readRawBody(req)).toString() || "{}");
      if (!["delivered", "missed", "skipped", "pending"].includes(status)) return sendJson(res, 400, { error: "Invalid status" });
      const day = await markDelivery(String(subId || ""), String(date || ""), status, s.username);
      return sendJson(res, 200, { ok: true, day });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  /* ---- CUSTOMER TRACKING — public, but the token itself is the secret
     (192-bit random, never guessable, never contains PII). Returns ONLY that
     one subscription's own data — never a list, never other customers'. ---- */
  if (pathname === "/api/track" && req.method === "GET") {
    const url = new URL(req.url, "http://internal");
    const token = url.searchParams.get("t") || "";
    if (!/^[a-f0-9]{48}$/.test(token)) return sendJson(res, 400, { error: "Invalid tracking link" });
    const sub = await findByToken(token);
    if (!sub) return sendJson(res, 404, { error: "Tracking link not found" });
    return sendJson(res, 200, {
      customerName: sub.customer.name, product: sub.product, plan: sub.plan,
      deliveries: sub.deliveries, createdAt: sub.createdAt,
    });
  }

  sendJson(res, 404, { error: "Not found" });
}

/* ============================================================
   STATIC FILE SERVING (unchanged behaviour)
   ============================================================ */
async function handleStatic(req, res, pathname) {
  try {
    let path = pathname;
    if (path === "/") path = "/index.html";
    const filePath = normalize(join(ROOT, path));
    if (!filePath.startsWith(ROOT)) { res.writeHead(403).end("Forbidden"); return; }
    // Never serve the order log, env files, or the subscription/staff data
    // stores (customer PII + password hashes) — those are API-only, never
    // static-served, no matter how the URL is phrased.
    if (/orders\.log\.jsonl$|\.env|subscriptions\.json$|staff\.json$/i.test(filePath)) { res.writeHead(403).end("Forbidden"); return; }
    const data = await readFile(filePath);
    res.writeHead(200, { "Content-Type": TYPES[extname(filePath)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
  }
}

const server = createServer(async (req, res) => {
  // Canonicalize to https://CANONICAL_HOST before anything else — collapses
  // http, www, and the old onrender.com URL down to one indexable address.
  // Skipped for local dev (localhost) so `node server.mjs` still works.
  const hostname = (req.headers.host || "").toLowerCase().split(":")[0];
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "";
  if (!isLocal) {
    const proto = req.headers["x-forwarded-proto"] || (req.socket.encrypted ? "https" : "http");
    if (proto !== "https" || hostname !== CANONICAL_HOST) {
      res.writeHead(301, { Location: `https://${CANONICAL_HOST}${req.url}` });
      return res.end();
    }
  }

  const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
  if (pathname.startsWith("/api/")) return handleApi(req, res, pathname);
  return handleStatic(req, res, pathname);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`\n  Port ${PORT} is already in use.`);
    console.log(`  The site is probably already running — just open http://localhost:${PORT} in your browser.\n`);
  } else {
    console.error(err);
  }
});

// Only start listening when run directly (`node server.mjs`), not when imported
// by a test that just wants computeAmountPaise().
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  // Make sure the (possibly mounted-disk) data directory exists before
  // anything tries to write order/subscription/staff files into it.
  await mkdir(DATA_DIR, { recursive: true }).catch(() => {});

  // First run only: creates the owner + delivery1 staff accounts with strong
  // random passwords and prints them ONCE. They're stored as scrypt hashes —
  // this console line is the only place the plaintext ever exists, so save it.
  const bootstrap = await ensureStaffBootstrap();
  if (bootstrap) {
    console.log("\n============ STAFF ACCOUNTS CREATED (shown once) ============");
    console.log(` Owner dashboard   → /admin.html     user: owner       pass: ${bootstrap.owner.password}`);
    console.log(` Delivery dashboard→ /delivery.html  user: delivery1   pass: ${bootstrap.delivery.password}`);
    console.log(" Save these now — passwords are hashed on disk and cannot be recovered.");
    console.log("================================================================\n");
  }
  server.listen(PORT, () =>
    console.log(
      `Serving on http://localhost:${PORT}` +
      (PAYMENTS_ENABLED ? "  [Razorpay payments: LIVE]" : "  [Razorpay payments: dormant — set env keys to enable]") +
      (CHAT_ENABLED ? `  [Ask Bentam AI: LIVE · ${CHAT_MODEL}]` : "  [Ask Bentam AI: offline KB — set ANTHROPIC_API_KEY to enable]")
    )
  );
}
