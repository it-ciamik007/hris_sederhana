import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { saveDefaultSettings } from "@/server/services/settings.service";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.roles.includes("SUPER_ADMIN") && !session?.permissions.includes("setting.manage")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const form = await request.formData();
  await saveDefaultSettings({
    companyName: String(form.get("companyName") ?? ""),
    legalName: String(form.get("legalName") ?? ""),
    email: String(form.get("email") ?? ""),
    phone: String(form.get("phone") ?? ""),
    shiftId: String(form.get("shiftId") ?? ""),
    leavePolicyId: String(form.get("leavePolicyId") ?? ""),
    annualQuota: Number(form.get("annualQuota") ?? 0),
    allowNegativeBalance: form.get("allowNegativeBalance") === "1",
    excludeWeekends: form.get("excludeWeekends") === "1",
    excludeHolidays: form.get("excludeHolidays") === "1"
  });

  return NextResponse.redirect(new URL("/settings/defaults", request.url));
}
