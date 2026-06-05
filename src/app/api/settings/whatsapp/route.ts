import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { saveWhatsAppSettings } from "@/server/services/settings.service";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.roles.includes("SUPER_ADMIN") && !session?.permissions.includes("setting.manage")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const form = await request.formData();
  await saveWhatsAppSettings(null, {
    baseUrl: String(form.get("baseUrl") ?? ""),
    apiKey: String(form.get("apiKey") ?? ""),
    instanceId: String(form.get("instanceId") ?? ""),
    pairingPhone: String(form.get("pairingPhone") ?? ""),
    fallbackApprovalPhone: String(form.get("fallbackApprovalPhone") ?? "")
  });

  return NextResponse.redirect(new URL("/settings/whatsapp", request.url));
}
