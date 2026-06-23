import crypto from "crypto";
import { cookies } from "next/headers";

export const COOKIE = "admin_token";
export const SALT = "phassaree_admin_v1";

/** SHA-256 of `password + SALT`, hex-encoded. Must match the middleware token. */
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + SALT).digest("hex");
}

/**
 * Returns true when the current request carries a valid admin session cookie.
 * Use this to guard mutating API routes — middleware only protects the `/admin`
 * pages, not `/api/*`, so without this anyone could write to the database.
 */
export async function isAdminRequest(): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;

  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;

  const expected = hashPassword(password);
  // Constant-time comparison; timingSafeEqual throws on length mismatch.
  if (token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
