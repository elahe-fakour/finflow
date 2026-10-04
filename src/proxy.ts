import { createLoginPath } from "./lib/auth/redirects";
import { sessionCookieName } from "./lib/auth/session-cookie";
import { NextResponse, type NextRequest } from "next/server";

const publicAuthPaths = new Set(["/login", "/register"]);

function proxy(request: NextRequest): NextResponse {
  if (publicAuthPaths.has(request.nextUrl.pathname) || request.cookies.has(sessionCookieName)) {
    return NextResponse.next();
  }

  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  return NextResponse.redirect(new URL(createLoginPath(nextPath), request.url));
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

export { proxy };
