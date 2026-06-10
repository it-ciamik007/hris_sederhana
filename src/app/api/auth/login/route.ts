import { NextResponse } from "next/server";
import { createSessionToken, getSessionCookieOptions, sessionCookieName } from "@/lib/auth";
import { login } from "@/server/services/auth.service";

export function GET(request: Request) {
  return NextResponse.redirect(new URL("/login", request.url));
}

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  try {
    const session = await login({
      email,
      password: String(form.get("password") ?? "")
    });
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set(sessionCookieName, await createSessionToken(session), getSessionCookieOptions());
    return response;
  } catch (error) {
    const url = new URL("/login", request.url);
    url.searchParams.set("email", email);
    url.searchParams.set("error", error instanceof Error ? error.message : "Login failed");
    return NextResponse.redirect(url, { status: 303 });
  }
}
