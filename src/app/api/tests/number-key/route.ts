import { NextResponse } from "next/server";
import { extractNumberTestWorkbookFromBuffer, extractNumberTestWorkbookFromFile } from "@/server/services/number-test-workbook.service";

export async function GET() {
  try {
    const workbook = await extractNumberTestWorkbookFromFile();
    return NextResponse.json({ data: workbook });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Workbook kunci tidak bisa dibaca." },
      { status: 404 }
    );
  }
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "File Excel wajib diupload." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = await extractNumberTestWorkbookFromBuffer(buffer, file.name);
  return NextResponse.json({ data: workbook });
}
