import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// TEMPORARY: bypassing withAuth entirely to get visibility into exactly
// why getToken() returns null despite a present, correctly-named session
// cookie. Will be reverted once the root cause is found.
export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  let token = null;
  let errorMessage: string | null = null;
  try {
    token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: true,
    });
  } catch (e) {
    errorMessage = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  }

  console.log(
    "[mw-debug2]",
    "path=", pathname,
    "hasToken=", !!token,
    "error=", errorMessage,
    "secretLen=", process.env.NEXTAUTH_SECRET?.length ?? 0,
    "cookieNames=", req.cookies.getAll().map((c) => c.name).join(",")
  );

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
