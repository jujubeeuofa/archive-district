import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/account", req.url));
    }
    return NextResponse.next();
  },
  {
    // The Edge Middleware runtime doesn't reliably auto-pick-up
    // NEXTAUTH_SECRET the way the Node.js API routes do — pass it
    // explicitly so token verification here actually works in production.
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
      authorized: ({ token, req }) => {
        console.log(
          "[mw-debug] path=",
          req.nextUrl.pathname,
          "hasToken=",
          !!token,
          "hasSecret=",
          !!process.env.NEXTAUTH_SECRET,
          "cookieNames=",
          req.cookies.getAll().map((c) => c.name).join(",")
        );
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/sell/:path*"],
};
