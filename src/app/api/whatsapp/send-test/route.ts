import { NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/server/services/whatsapp.service";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const input = contentType.includes("form")
    ? Object.fromEntries(await request.formData())
    : await request.json();

  try {
    await sendWhatsAppMessage({
      phone: String(input.phone),
      message: String(input.message),
      type: "text"
    });
    return NextResponse.redirect(new URL("/settings/whatsapp", request.url));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "WhatsApp send failed" },
      { status: 400 }
    );
  }
}
