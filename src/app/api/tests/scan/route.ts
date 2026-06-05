import { NextResponse } from "next/server";
import { processUploadedScan } from "@/server/services/test-checker.service";

export async function POST(request: Request) {
  const form = await request.formData();
  const templateId = String(form.get("templateId") ?? "");
  const file = form.get("file");
  if (!templateId) return NextResponse.json({ message: "Template wajib dipilih." }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ message: "File scan/Excel wajib diupload." }, { status: 400 });

  try {
    return NextResponse.json(await processUploadedScan({ templateId, file: await file.arrayBuffer() }));
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Scan processing failed" }, { status: 400 });
  }
}
