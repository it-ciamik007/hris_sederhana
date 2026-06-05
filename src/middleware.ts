import { jwtVerify } from "jose/jwt/verify";
import { NextResponse, type NextRequest } from "next/server";
import { routePermissions } from "@/lib/route-permissions";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

function isBypassPath(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/approval/action") ||
    pathname.startsWith("/api/whatsapp/webhook")
  );
}

function requiredPermission(pathname: string) {
  return routePermissions.find((item) => pathname.startsWith(item.prefix))?.permission;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isBypassPath(pathname)) return NextResponse.next();

  const isApi = pathname.startsWith("/api");
  const isProtectedPage =
    pathname === "/" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/employees") ||
    pathname.startsWith("/leave") ||
    pathname.startsWith("/approvals") ||
    pathname.startsWith("/attendance") ||
    pathname.startsWith("/evaluations") ||
    pathname.startsWith("/tests") ||
    pathname.startsWith("/payroll") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/documents") ||
    pathname.startsWith("/announcements") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/overtime") ||
    pathname.startsWith("/reimbursement") ||
    pathname.startsWith("/recruitment") ||
    pathname.startsWith("/training") ||
    pathname.startsWith("/my");

  if (!isApi && !isProtectedPage) return NextResponse.next();

  const token = request.cookies.get("hris_session")?.value;
  const secret = getSecret();
  if (!token || !secret) {
    if (isApi) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const verified = await jwtVerify(token, secret);
    const payload = verified.payload as { permissions?: string[]; roles?: string[] };
    const roles = payload.roles ?? [];
    const permissions = payload.permissions ?? [];
    const permission = requiredPermission(pathname);
    const allowed =
      roles.includes("SUPER_ADMIN") ||
      !permission ||
      permissions.includes(permission) ||
      permissions.includes("setting.manage") ||
      pathname.startsWith("/my");

    if (!allowed) {
      if (isApi) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      return NextResponse.redirect(new URL("/dashboard?forbidden=1", request.url));
    }
  } catch {
    if (isApi) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"]
};
