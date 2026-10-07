import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Stateless signed session: "v1.<expiry-ms>.<hmac>". Nothing is stored in the
// database. Changing ADMIN_PASSWORD (or SESSION_SECRET) logs every device out.

export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function signingKey(): Buffer {
  const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("ADMIN_PASSWORD is not set.");
  return createHash("sha256").update(`admin-session:${secret}`).digest();
}

function sign(payload: string): string {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  // Hash first so inputs of different lengths still compare in constant time.
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function createSessionToken(now = Date.now()): string {
  const payload = `v1.${now + SESSION_MAX_AGE_SECONDS * 1000}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined, now = Date.now()): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return false;
  const expires = Number(parts[1]);
  if (!Number.isFinite(expires) || expires < now) return false;
  try {
    return safeEqual(parts[2], sign(`${parts[0]}.${parts[1]}`));
  } catch {
    return false; // ADMIN_PASSWORD missing: nobody is logged in
  }
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(input, expected);
}
