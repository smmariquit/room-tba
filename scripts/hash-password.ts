/**
 * Generate a bcrypt hash for the admin password.
 *
 * Usage:
 *   bun run scripts/hash-password.ts                 # prompts for password
 *   bun run scripts/hash-password.ts <password>      # one-shot
 *
 * Copy the output into your .env as `ADMIN_PASSWORD_HASH=...`.
 * Also generate a SESSION_SECRET (any 32+ random chars) — e.g.
 *   openssl rand -base64 32
 */

import bcrypt from "bcryptjs";

async function readPasswordFromStdin(): Promise<string> {
  process.stdout.write("Password: ");
  const chunks: Buffer[] = [];
  return await new Promise((resolve) => {
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8").trim());
    });
  });
}

const argv = process.argv.slice(2);
const password = argv[0] ?? (await readPasswordFromStdin());

if (!password || password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log("\nADMIN_PASSWORD_HASH=" + hash);
