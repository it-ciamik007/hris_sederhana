import { NextResponse } from "next/server";
import { getSession, sessionCookieName } from "@/lib/auth";
import { logout } from "@/server/services/auth.service";

export async function POST(request: Request) {
  const session = await getSession();
  await logout(session?.id);
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete(sessionCookieName);
  return response;
}
