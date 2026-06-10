import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveUploadedFile } from "@/server/services/file.service";
import { createReimbursementRequest, submitReimbursementRequest } from "@/server/services/reimbursement.service";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if (!session.employeeId) {
    return NextResponse.json({ message: "Akun belum terhubung ke data karyawan." }, { status: 403 });
  }

  try {
    const form = await request.formData();
    const fields = Object.fromEntries([...form.entries()].filter(([, value]) => typeof value === "string"));

    let attachmentFileId: string | undefined;
    const attachment = form.get("attachment");
    if (attachment instanceof File && attachment.size > 0) {
      const employee = await db.employee.findUnique({ where: { id: session.employeeId }, select: { companyId: true } });
      const saved = await saveUploadedFile({ file: attachment, companyId: employee?.companyId, uploadedBy: session.id });
      attachmentFileId = saved.id;
    }

    const reimbursement = await createReimbursementRequest({
      ...fields,
      employeeId: session.employeeId,
      attachmentFileId
    });
    if (fields.intent === "submit") {
      await submitReimbursementRequest(reimbursement.id, session.employeeId);
    }
    return NextResponse.redirect(new URL("/my/reimbursement", request.url), 303);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Pengajuan reimbursement gagal" },
      { status: 400 }
    );
  }
}
