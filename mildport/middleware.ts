import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE = "admin_token";
const SALT = "phassaree_admin_v1";

async function expectedToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(password + SALT);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin/login is always public
  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  // Protect everything else under /admin
  if (pathname.startsWith("/admin")) {
    const password = process.env.ADMIN_PASSWORD;

    if (!password) {
      // No password configured → block with a plain 503
      return new NextResponse(
        "Admin password is not configured. Set ADMIN_PASSWORD in .env.local.",
        { status: 503 }
      );
    }

    const token = request.cookies.get(COOKIE)?.value;
    const expected = await expectedToken(password);

    if (!token || token !== expected) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
