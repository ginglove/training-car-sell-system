import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedRoutes: Record<string, string[]> = {
  "/portal": ["ADMIN", "MANAGER", "SALE"],
  "/profile": ["ADMIN", "MANAGER", "SALE", "CUSTOMER"],
  "/orders": ["CUSTOMER", "SALE", "ADMIN", "MANAGER"],
  "/checkout": ["CUSTOMER", "SALE", "ADMIN", "MANAGER"],
  "/test-drive": ["CUSTOMER", "SALE", "ADMIN", "MANAGER"],
};

const adminOnlyRoutes = ["/portal/users", "/portal/config", "/portal/audit-logs"];
const managerRoutes = ["/portal/inventory", "/portal/transfers", "/portal/refunds"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/login") ||
    pathname === "/" ||
    pathname.startsWith("/catalog")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role as string;

  for (const route of adminOnlyRoutes) {
    if (pathname.startsWith(route) && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  for (const route of managerRoutes) {
    if (pathname.startsWith(route) && !["ADMIN", "MANAGER"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  for (const [route, roles] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route) && !roles.includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|fonts).*)"],
};
