import { z } from "zod";
import { db } from "@/lib/db";
import { parseDateOnly } from "@/lib/validators/date";
import { audit } from "@/server/services/audit.service";
import { createApprovalRequest } from "@/server/services/approval.service";
import { notifyEmployee } from "@/server/services/notification-inapp.service";

export const reimbursementRequestSchema = z.object({
  employeeId: z.string().min(1),
  reimbursementTypeId: z.string().min(1, "Tipe reimbursement wajib dipilih."),
  selectedApproverId: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal pengeluaran wajib diisi."),
  amount: z.coerce.number().positive("Nominal harus lebih dari 0."),
  description: z.string().min(3, "Keterangan minimal 3 karakter."),
  attachmentFileId: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined))
});

async function resolveApprover(employeeId: string, selectedApproverId?: string) {
  const employee = await db.employee.findUnique({ where: { id: employeeId } });
  if (!employee) throw new Error("Karyawan tidak ditemukan.");

  const approverId = selectedApproverId || employee.supervisorId;
  if (!approverId) throw new Error("Atasan/approver wajib dipilih.");
  if (approverId === employee.id) throw new Error("Approver tidak boleh diri sendiri.");

  const approver = await db.employee.findUnique({ where: { id: approverId } });
  if (!approver || approver.companyId !== employee.companyId) {
    throw new Error("Approver tidak valid untuk perusahaan karyawan ini.");
  }

  return { employee, approver };
}

export async function createReimbursementRequest(input: unknown) {
  const data = reimbursementRequestSchema.parse(input);
  const { approver } = await resolveApprover(data.employeeId, data.selectedApproverId);

  const type = await db.reimbursementType.findUnique({ where: { id: data.reimbursementTypeId } });
  if (!type || !type.isActive) throw new Error("Tipe reimbursement tidak valid atau nonaktif.");
  if (type.maxAmount && data.amount > Number(type.maxAmount)) {
    throw new Error(`Nominal melebihi batas tipe ini (maks ${Number(type.maxAmount).toLocaleString("id-ID")}).`);
  }
  if (type.requiresAttachment && !data.attachmentFileId) {
    throw new Error("Tipe reimbursement ini wajib melampirkan bukti.");
  }

  return db.reimbursementRequest.create({
    data: {
      employeeId: data.employeeId,
      reimbursementTypeId: data.reimbursementTypeId,
      selectedApproverId: approver.id,
      expenseDate: parseDateOnly(data.expenseDate),
      amount: data.amount,
      description: data.description,
      attachmentFileId: data.attachmentFileId
    }
  });
}

export async function submitReimbursementRequest(id: string, ownerEmployeeId: string) {
  const reimbursement = await db.reimbursementRequest.findUnique({
    where: { id },
    include: { employee: true, reimbursementType: true }
  });
  if (!reimbursement) throw new Error("Pengajuan reimbursement tidak ditemukan.");
  if (reimbursement.employeeId !== ownerEmployeeId) throw new Error("Pengajuan ini bukan milik Anda.");
  if (reimbursement.status !== "DRAFT") throw new Error("Hanya draft yang bisa disubmit.");
  if (!reimbursement.selectedApproverId) throw new Error("Approver belum ditentukan.");

  const approval = await createApprovalRequest({
    companyId: reimbursement.employee.companyId,
    module: "reimbursement",
    referenceId: reimbursement.id,
    requesterId: reimbursement.employeeId,
    steps: [
      { approverType: "DIRECT_SPV", approverEmployeeId: reimbursement.selectedApproverId },
      { approverType: "HRD", approverRoleCode: "HRD" }
    ]
  });

  await db.reimbursementRequest.update({
    where: { id },
    data: { status: "WAITING_APPROVAL", submittedAt: new Date(), approvalRequestId: approval.id }
  });

  await notifyEmployee({
    employeeId: reimbursement.selectedApproverId,
    title: "Pengajuan reimbursement baru",
    body: `${reimbursement.employee.fullName} mengajukan ${reimbursement.reimbursementType.name} sebesar Rp ${Number(reimbursement.amount).toLocaleString("id-ID")}.`,
    link: "/my/approvals"
  });

  return approval;
}

export async function markReimbursementPaid(id: string, userId: string) {
  const reimbursement = await db.reimbursementRequest.findUnique({
    where: { id },
    include: { reimbursementType: true }
  });
  if (!reimbursement) throw new Error("Pengajuan reimbursement tidak ditemukan.");
  if (reimbursement.status !== "APPROVED") throw new Error("Hanya pengajuan APPROVED yang bisa ditandai dibayar.");

  await db.reimbursementRequest.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date(), paidBy: userId }
  });

  await notifyEmployee({
    employeeId: reimbursement.employeeId,
    title: "Reimbursement dibayar",
    body: `Reimbursement ${reimbursement.reimbursementType.name} sebesar Rp ${Number(reimbursement.amount).toLocaleString("id-ID")} sudah dibayarkan.`,
    link: "/my/reimbursement"
  });

  await audit({
    userId,
    module: "reimbursement",
    action: "mark-paid",
    referenceId: id,
    newData: { status: "PAID" }
  });
}
