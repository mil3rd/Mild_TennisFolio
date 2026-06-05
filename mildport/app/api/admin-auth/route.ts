import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE = "admin_token";
const SALT = "phassaree_admin_v1";
const SEVEN_DAYS = 60 * 60 * 24 * 7;

function hashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password + SALT)
    .digest("hex");
}

/* POST /api/admin-auth — verify password and set session cookie */
export async function POST(request: Request) {
  try {
    const { password } = (await request.json()) as { password?: string };

    if (!process.env.ADMIN_PASSWORD) {
      return Response.json(
        { error: "ADMIN_PASSWORD is not configured on the server." },
        { status: 503 }
      );
    }

    if (!password || password !== process.env.ADMIN_PASSWORD) {
      // Constant-time comparison to resist timing attacks
      await new Promise((r) => setTimeout(r, 300));
      return Response.json({ error: "Incorrect password." }, { status: 401 });
    }

    const token = hashPassword(password);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SEVEN_DAYS,
      path: "/",
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }
}

/* DELETE /api/admin-auth — clear session cookie (logout) */
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
  return Response.json({ ok: true });
}
