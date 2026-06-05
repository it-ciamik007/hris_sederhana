import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSession, destroySession, getUserSessionFromDb } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/server/services/audit.service";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function login(input: z.infer<typeof loginSchema>) {
  const data = loginSchema.parse(input);
  const user = await db.user.findUnique({ where: { email: data.email } });
  if (!user || !user.isActive) throw new Error("Email atau password salah.");

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) throw new Error("Email atau password salah.");

  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  const session = await getUserSessionFromDb(user.id);
  if (!session) throw new Error("Session tidak dapat dibuat.");

  await createSession(session);
  await audit({ userId: user.id, module: "auth", action: "login" });
  return session;
}

export async function logout(userId?: string) {
  await destroySession();
  if (userId) await audit({ userId, module: "auth", action: "logout" });
}
