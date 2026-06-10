import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { submitOvertimeRequest } from "@/server/services/overtime.service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.employeeId) {
    return NextResponse.json({ message: "Akun belum terhubung ke data karyawan." }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    await submitOvertimeRequest(id, session.employeeId);
    return NextResponse.redirect(new URL("/my/overtime", request.url), 303);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Submit lembur gagal" },
      { status: 400 }
    );
  }
}
