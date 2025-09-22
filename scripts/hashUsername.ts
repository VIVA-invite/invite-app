import crypto from "node:crypto";

const username = process.argv[2];
if (!username) {
  console.error("Usage: ts-node hashUsername.ts <username>");
  process.exit(1);
}
const normalized = username.trim().toLowerCase();
const hash = crypto.createHash("sha256").update(normalized).digest("hex");
console.log(hash);
