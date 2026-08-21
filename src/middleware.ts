import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Not using next-auth's withAuth() helper here: its automatic detection of
// whether to look for the __Secure- prefixed session cookie unreliably
// evaluated to false in Vercel's Edge Middleware runtime for this app,
// which made every request to a protected route look logged-out even with
// a valid session (confirmed via /api/auth/session working fine and the
// correct cookie being present in the request). Passing secureCookie:
// true explicitly — we're always on HTTPS via Vercel — fixes it.
export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: true,
  });

  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/account", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/sell/:path*"],
};
