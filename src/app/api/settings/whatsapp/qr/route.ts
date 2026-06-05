import { NextResponse } from "next/server";
import { generateWhatsAppQr } from "@/server/services/whatsapp.service";

export async function POST() {
  try {
    return NextResponse.json(await generateWhatsAppQr());
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "QR failed" }, { status: 400 });
  }
}
