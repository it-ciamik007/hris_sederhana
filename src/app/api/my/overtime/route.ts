import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createOvertimeRequest, submitOvertimeRequest } from "@/server/services/overtime.service";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if (!session.employeeId) {
    return NextResponse.json({ message: "Akun belum terhubung ke data karyawan." }, { status: 403 });
  }

  try {
    const form = Object.fromEntries(await request.formData());
    const overtime = await createOvertimeRequest({ ...form, employeeId: session.employeeId });
    if (form.intent === "submit") {
      await submitOvertimeRequest(overtime.id, session.employeeId);
    }
    return NextResponse.redirect(new URL("/my/overtime", request.url), 303);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Pengajuan lembur gagal" },
      { status: 400 }
    );
  }
}
