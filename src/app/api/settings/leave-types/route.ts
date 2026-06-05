import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.roles.includes("SUPER_ADMIN") && !session?.permissions.includes("setting.manage")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const form = await request.formData();
  const company = await db.company.findFirst();
  if (!company) return NextResponse.json({ message: "Company default belum ada." }, { status: 400 });

  const id = String(form.get("id") ?? "");
  const code = String(form.get("code") ?? "").trim().toUpperCase().replaceAll(" ", "_");
  const name = String(form.get("name") ?? "").trim();
  const requiresAttachment = form.get("requiresAttachment") === "1";
  const deductsBalance = form.get("deductsBalance") === "1";
  const isActive = form.get("isActive") === "1";

  if (!code || !name) return NextResponse.json({ message: "Code dan nama wajib diisi." }, { status: 400 });

  if (id) {
    await db.leaveType.update({
      where: { id },
      data: { code, name, requiresAttachment, deductsBalance, isActive }
    });
  } else {
    await db.leaveType.create({
      data: { companyId: company.id, code, name, requiresAttachment, deductsBalance, isActive }
    });
  }

  return NextResponse.redirect(new URL("/settings/defaults", request.url));
}
