import { NextResponse } from "next/server";
import { importFingerprintExcel } from "@/server/services/attendance.service";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  const companyId = String(form.get("companyId") ?? "");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "File is required" }, { status: 400 });
  }

  try {
    await importFingerprintExcel(companyId, await file.arrayBuffer());
    return NextResponse.redirect(new URL("/attendance/import", request.url));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Import failed" },
      { status: 400 }
    );
  }
}
