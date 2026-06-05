import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.roles.includes("SUPER_ADMIN") && !session?.permissions.includes("setting.manage")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const form = await request.formData();
  const roleId = String(form.get("roleId") ?? "");
  const permissionId = String(form.get("permissionId") ?? "");
  const enabled = String(form.get("enabled") ?? "") === "1";

  if (enabled) {
    await db.rolePermission.createMany({ data: [{ roleId, permissionId }], skipDuplicates: true });
  } else {
    await db.rolePermission.deleteMany({ where: { roleId, permissionId } });
  }

  return NextResponse.redirect(new URL("/settings/roles", request.url));
}
