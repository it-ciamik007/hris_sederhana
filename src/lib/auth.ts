import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const sessionCookieName = "hris_session";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters long.");
  }
  return new TextEncoder().encode(secret);
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  employeeId?: string | null;
  permissions: string[];
  roles: string[];
};

export async function createSessionToken(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
}

export function getSessionCookieOptions() {
  const appUrl = process.env.APP_URL ?? "";
  const secureCookie = process.env.COOKIE_SECURE === "true" || appUrl.startsWith("https://");
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: secureCookie,
    path: "/",
    maxAge: 60 * 60 * 8
  };
}

export async function createSession(user: SessionUser) {
  const token = await createSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, getSessionCookieOptions());
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (!token) return null;

  try {
    const verified = await jwtVerify(token, getSecret());
    return verified.payload as SessionUser;
  } catch {
    return null;
  }
}

export async function getUserSessionFromDb(userId: string): Promise<SessionUser | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true }
              }
            }
          }
        }
      }
    }
  });

  if (!user || !user.isActive) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    employeeId: user.employeeId,
    roles: user.roles.map((item) => item.role.code),
    permissions: [
      ...new Set(
        user.roles.flatMap((item) =>
          item.role.permissions.map((rolePermission) => rolePermission.permission.code)
        )
      )
    ]
  };
}
