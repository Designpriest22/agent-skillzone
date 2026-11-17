import { NextResponse, type NextRequest } from "next/server";

/** Fast gate: unauthenticated visitors to /os are sent to /login. Full session validation happens server-side. */
export function proxy(request: NextRequest) {
  if (!request.cookies.get("prohub_session")) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/os/:path*"] };
