import { NextResponse } from "next/server";
import { createSessionToken, getSessionCookieOptions, sessionCookieName } from "@/lib/auth";
import { login } from "@/server/services/auth.service";

export async function POST(request: Request) {
  const form = await request.formData();
  try {
    const session = await login({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? "")
    });
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set(sessionCookieName, await createSessionToken(session), getSessionCookieOptions());
    return response;
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Login failed" },
      { status: 401 }
    );
  }
}
