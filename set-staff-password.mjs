// Lets you set your own username/password for a staff account, instead of
// the random ones generated on first run. Passwords are still hashed with
// scrypt before being saved — the plaintext you type here is never stored.
//
// Usage:
//   node set-staff-password.mjs owner myusername mypassword
//   node set-staff-password.mjs delivery deliveryboy1 mypassword
//
// Run again anytime to change a username/password, or to add a second
// delivery account (e.g. "delivery2") for a second delivery person.

import { loadStaff, saveStaff, hashPassword } from "./delivery-store.mjs";

const [, , role, username, password] = process.argv;

if (!role || !username || !password) {
  console.log("\nUsage: node set-staff-password.mjs <owner|delivery> <username> <password>\n");
  console.log("Examples:");
  console.log("  node set-staff-password.mjs owner tej mySecurePass123");
  console.log("  node set-staff-password.mjs delivery ramesh RameshDelivery9\n");
  process.exit(1);
}
if (role !== "owner" && role !== "delivery") {
  console.error('Role must be "owner" or "delivery".');
  process.exit(1);
}
if (password.length < 6) {
  console.error("Password must be at least 6 characters. Pick something you'll actually remember, but not something guessable (avoid '123456', your name alone, etc).");
  process.exit(1);
}

const db = await loadStaff();
const existing = db.users.find((u) => u.username === username);
if (existing) {
  existing.role = role;
  existing.passwordHash = hashPassword(password);
  console.log(`Updated existing account "${username}" → role: ${role}.`);
} else {
  db.users.push({ username, role, passwordHash: hashPassword(password), createdAt: new Date().toISOString() });
  console.log(`Created new account "${username}" → role: ${role}.`);
}
await saveStaff(db);
console.log(`\nYou can now log in at /staff-login.html with:\n  Username: ${username}\n  Password: ${password}\n`);
