#!/usr/bin/env node
// Usage: node scripts/hash-password.js <password>
const bcrypt = require("bcryptjs");

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-password.js <password>");
  process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
  console.log("Password hash:");
  console.log(hash);
  console.log("\nAdd to .env.local:");
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
});
