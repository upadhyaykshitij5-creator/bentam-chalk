// Delivery-tracking data store — subscriptions + staff accounts.
// Zero npm dependencies: plain JSON files with atomic writes (write to a temp
// file, then rename — avoids a half-written file if the process dies mid-save).
// This mirrors the project's existing "no database" approach (orders.log.jsonl)
// but needs MUTABLE records (status changes daily), so it's a JSON object file
// instead of an append-only log.

import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import crypto from "node:crypto";

const ROOT = import.meta.dirname;
// DATA_DIR points at a persistent disk in production (e.g. Render), so
// subscriptions/staff accounts survive redeploys — falls back to the repo
// checkout itself for local dev, where nothing needs to survive a restart.
const DATA_DIR = process.env.DATA_DIR || ROOT;
const SUBS_PATH = join(DATA_DIR, "subscriptions.json");
const STAFF_PATH = join(DATA_DIR, "staff.json");

async function readJsonSafe(path, fallback) {
  try { return JSON.parse(await readFile(path, "utf8")); } catch { return fallback; }
}
async function writeJsonAtomic(path, obj) {
  await mkdir(dirname(path), { recursive: true }).catch(() => {});
  const tmp = path + "." + crypto.randomBytes(4).toString("hex") + ".tmp";
  await writeFile(tmp, JSON.stringify(obj, null, 2), "utf8");
  await rename(tmp, path);
}

/* ============================================================
   SUBSCRIPTIONS
   ============================================================ */
export async function loadSubscriptions() {
  return readJsonSafe(SUBS_PATH, { subscriptions: [] });
}
export async function saveSubscriptions(db) {
  await writeJsonAtomic(SUBS_PATH, db);
}

function isoDate(d) { return d.toISOString().slice(0, 10); }

// Builds one delivery record per day of the plan, starting today (or a given
// date). `days` and `bottlesPerDay` come from the server-computed order, never
// the client, so delivery counts can't be tampered with any more than price can.
export function buildDeliverySchedule(days, bottlesPerDay, startDate = new Date()) {
  const out = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    out.push({ date: isoDate(d), bottles: bottlesPerDay, status: "pending", markedBy: null, markedAt: null });
  }
  return out;
}

// Creates a subscription with a long random, unguessable tracking token — a
// "magic link" style secret. 24 random bytes = 192 bits of entropy: for
// comparison, that's far beyond what's brute-forceable, and nothing about the
// customer (name/phone) is encoded in it, so the link itself leaks no PII if
// intercepted anywhere except directly to that person.
export async function createSubscription({ customer, product, plan, orderId }) {
  const db = await loadSubscriptions();
  const id = "sub_" + crypto.randomBytes(8).toString("hex");
  const trackToken = crypto.randomBytes(24).toString("hex");
  const record = {
    id, trackToken, orderId: orderId || null,
    customer, // { name, phone, address, locality, pincode }
    product,  // { id, name, size }
    plan,     // { type, bottlesPerDay, days }
    deliveries: buildDeliverySchedule(plan.days, plan.bottlesPerDay),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.subscriptions.push(record);
  await saveSubscriptions(db);
  return record;
}

export async function findByToken(token) {
  const db = await loadSubscriptions();
  return db.subscriptions.find((s) => s.trackToken === token) || null;
}

export async function markDelivery(subId, date, status, markedBy) {
  const db = await loadSubscriptions();
  const sub = db.subscriptions.find((s) => s.id === subId);
  if (!sub) throw new Error("Subscription not found");
  const day = sub.deliveries.find((d) => d.date === date);
  if (!day) throw new Error("No delivery scheduled for that date");
  day.status = status;
  day.markedBy = markedBy;
  day.markedAt = new Date().toISOString();
  sub.updatedAt = new Date().toISOString();
  await saveSubscriptions(db);
  return day;
}

export async function deliveriesForDate(date) {
  const db = await loadSubscriptions();
  const rows = [];
  for (const s of db.subscriptions) {
    const d = s.deliveries.find((x) => x.date === date);
    if (d) rows.push({ subId: s.id, customer: s.customer, product: s.product, delivery: d });
  }
  return rows;
}

/* ============================================================
   STAFF ACCOUNTS — individual logins, scrypt-hashed passwords.
   Never shared passcodes: a leaked password only ever compromises ONE
   account, and every status change is attributable to a real person.
   ============================================================ */
const SCRYPT_KEYLEN = 64;
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}
export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const check = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  const stored_ = Buffer.from(hash, "hex");
  // Guard length before timingSafeEqual (it throws on mismatched buffer sizes,
  // which would otherwise leak "wrong length" via a crash vs a clean false).
  if (check.length !== stored_.length) return false;
  return crypto.timingSafeEqual(check, stored_);
}

export async function loadStaff() {
  return readJsonSafe(STAFF_PATH, { users: [] });
}
export async function saveStaff(db) {
  await writeJsonAtomic(STAFF_PATH, db);
}

// First-run bootstrap: if no staff accounts exist yet, create one owner and
// one delivery account with strong random passwords, print them ONCE to the
// server console (never stored in plaintext, never logged again after this).
export async function ensureStaffBootstrap() {
  const db = await loadStaff();
  if (db.users.length > 0) return null;
  const genPassword = () => crypto.randomBytes(9).toString("base64url"); // ~12 chars, high entropy
  const ownerPw = genPassword();
  const deliveryPw = genPassword();
  db.users.push(
    { username: "owner", role: "owner", passwordHash: hashPassword(ownerPw), createdAt: new Date().toISOString() },
    { username: "delivery1", role: "delivery", passwordHash: hashPassword(deliveryPw), createdAt: new Date().toISOString() },
  );
  await saveStaff(db);
  return { owner: { username: "owner", password: ownerPw }, delivery: { username: "delivery1", password: deliveryPw } };
}

export async function findStaff(username) {
  const db = await loadStaff();
  return db.users.find((u) => u.username === username) || null;
}
