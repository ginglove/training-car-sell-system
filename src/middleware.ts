import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/portal", "/profile", "/orders", "/checkout", "/test-drive"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin") || "*";

  // 1. CORS handling for all API routes (for Swagger UI, Postman, and external testers)
  if (pathname.startsWith("/api/")) {
    const isOptions = request.method === "OPTIONS";
    const allowOrigin = origin && origin !== "null" ? origin : "*";

    const corsHeaders: Record<string, string> = {
      "Access-Control-Allow-Origin": allowOrigin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Cookie, Set-Cookie",
      "Access-Control-Max-Age": "86400",
    };

    if (allowOrigin !== "*") {
      corsHeaders["Access-Control-Allow-Credentials"] = "true";
    }

    if (isOptions) {
      return new NextResponse(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    const response = NextResponse.next();
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // 2. Protect browser portal & customer routes
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const hasSessionCookie =
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token") ||
    request.cookies.has("next-auth.session-token") ||
    request.cookies.has("__Secure-next-auth.session-token");

  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|fonts).*)"],
};

