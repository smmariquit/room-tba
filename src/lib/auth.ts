/**
 * Minimal single-admin auth.
 *
 * Reads two env vars:
 *   ADMIN_PASSWORD_HASH - bcrypt hash of the admin's password.
 *   SESSION_SECRET      - HMAC key for signing the session cookie.
 *
 * Generate a hash with: `bun run scripts/hash-password.ts <password>`
 */

import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import type { AstroCookies } from "astro";

const SESSION_COOKIE = "rtba_admin";
// 7 days. Editor sessions don't need to live forever, but logging in every 30
// minutes is annoying.
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const ADMIN_USERNAME = "admin";

function getEnv(name: string): string | undefined {
  // import.meta.env is the canonical Astro env; fall back to process.env so
  // this works in Bun scripts and Node API routes alike.
  const fromImport =
    typeof import.meta !== "undefined" &&
    (import.meta as { env?: Record<string, string | undefined> }).env;
  return fromImport?.[name] ?? process.env[name];
}

function getSessionSecret(): string {
  const secret = getEnv("SESSION_SECRET");
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET env var must be set to a string of at least 16 chars.",
    );
  }
  return secret;
}

function getAdminHash(): string {
  const hash = getEnv("ADMIN_PASSWORD_HASH");
  if (!hash) {
    throw new Error(
      "ADMIN_PASSWORD_HASH env var is not set. Run scripts/hash-password.ts to generate one.",
    );
  }
  return hash;
}

export async function verifyAdminPassword(
  username: string,
  password: string,
): Promise<boolean> {
  if (username !== ADMIN_USERNAME) return false;
  return bcrypt.compare(password, getAdminHash());
}

type SessionPayload = {
  /** Subject — always "admin" for now, kept so we can extend later. */
  sub: string;
  /** Issued-at, seconds. */
  iat: number;
  /** Expires-at, seconds. */
  exp: number;
};

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function b64urlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, "base64");
}

function sign(value: string, secret: string): string {
  return b64url(crypto.createHmac("sha256", secret).update(value).digest());
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function encodeSession(payload: SessionPayload): string {
  const secret = getSessionSecret();
  const body = b64url(JSON.stringify(payload));
  const sig = sign(body, secret);
  return `${body}.${sig}`;
}

function decodeSession(token: string): SessionPayload | null {
  const secret = getSessionSecret();
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(body, secret);
  if (!timingSafeEqual(sig, expected)) return null;
  let parsed: SessionPayload;
  try {
    parsed = JSON.parse(b64urlDecode(body).toString("utf8"));
  } catch {
    return null;
  }
  if (
    typeof parsed.sub !== "string" ||
    typeof parsed.iat !== "number" ||
    typeof parsed.exp !== "number"
  ) {
    return null;
  }
  if (parsed.exp * 1000 < Date.now()) return null;
  return parsed;
}

export function setSessionCookie(cookies: AstroCookies): void {
  const now = Math.floor(Date.now() / 1000);
  const token = encodeSession({
    sub: ADMIN_USERNAME,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  });
  cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIE, { path: "/" });
}

export type AdminSession = { username: string };

export function getSession(cookies: AstroCookies): AdminSession | null {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = decodeSession(token);
  if (!payload) return null;
  return { username: payload.sub };
}

export function isAdmin(cookies: AstroCookies): boolean {
  return getSession(cookies) !== null;
}
