import { NextResponse } from "next/server";
import { createWhatsAppInstance } from "@/server/services/whatsapp.service";

export async function POST(request: Request) {
  const form = await request.formData();
  try {
    return NextResponse.json(
      await createWhatsAppInstance({
        name: String(form.get("name") ?? "HRIS WhatsApp"),
        webhookUrl: String(form.get("webhookUrl") ?? "")
      })
    );
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Create instance failed" }, { status: 400 });
  }
}
