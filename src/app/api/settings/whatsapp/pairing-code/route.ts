import { NextResponse } from "next/server";
import { generateWhatsAppPairingCode } from "@/server/services/whatsapp.service";

export async function POST(request: Request) {
  const form = await request.formData();
  try {
    return NextResponse.json(await generateWhatsAppPairingCode(String(form.get("phoneNumber") ?? "")));
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Pairing failed" }, { status: 400 });
  }
}
