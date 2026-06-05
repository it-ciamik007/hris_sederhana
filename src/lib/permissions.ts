import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export function hasPermission(permissions: string[], permission: string) {
  return permissions.includes(permission) || permissions.includes("setting.manage");
}

export function isAdminRole(roles: string[]) {
  return roles.some((role) => ["SUPER_ADMIN", "HR_ADMIN", "HRD"].includes(role));
}

export async function requirePermission(permission: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasPermission(session.permissions, permission)) {
    throw new Error(`Forbidden: missing permission ${permission}`);
  }

  return session;
}
