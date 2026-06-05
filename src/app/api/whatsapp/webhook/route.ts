import { NextResponse } from "next/server";
import { processWhatsAppWebhook } from "@/server/services/whatsapp.service";

export async function POST(request: Request) {
  await processWhatsAppWebhook(await request.json());
  return NextResponse.json({ success: true });
}
