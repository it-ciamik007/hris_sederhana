import { z } from "zod";
import { db } from "@/lib/db";
import { parseDateOnly } from "@/lib/validators/date";
import { createApprovalRequest } from "@/server/services/approval.service";
import { notifyEmployee } from "@/server/services/notification-inapp.service";

const timePattern = /^\d{2}:\d{2}$/;

export const overtimeRequestSchema = z.object({
  employeeId: z.string().min(1),
  selectedApproverId: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
  overtimeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal lembur wajib diisi."),
  startTime: z.string().regex(timePattern, "Jam mulai harus format HH:MM."),
  endTime: z.string().regex(timePattern, "Jam selesai harus format HH:MM."),
  reason: z.string().min(3, "Alasan lembur minimal 3 karakter.")
});

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function calculateOvertimeMinutes(startTime: string, endTime: string) {
  let duration = toMinutes(endTime) - toMinutes(startTime);
  if (duration <= 0) duration += 24 * 60; // lembur lintas tengah malam
  return duration;
}

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

export async function createOvertimeRequest(input: unknown) {
  const data = overtimeRequestSchema.parse(input);
  const { approver } = await resolveApprover(data.employeeId, data.selectedApproverId);

  const durationMinutes = calculateOvertimeMinutes(data.startTime, data.endTime);
  if (durationMinutes > 720) throw new Error("Durasi lembur maksimal 12 jam.");

  return db.overtimeRequest.create({
    data: {
      employeeId: data.employeeId,
      selectedApproverId: approver.id,
      overtimeDate: parseDateOnly(data.overtimeDate),
      startTime: data.startTime,
      endTime: data.endTime,
      durationMinutes,
      reason: data.reason
    }
  });
}

export async function submitOvertimeRequest(id: string, ownerEmployeeId: string) {
  const overtime = await db.overtimeRequest.findUnique({
    where: { id },
    include: { employee: true, selectedApprover: true }
  });
  if (!overtime) throw new Error("Pengajuan lembur tidak ditemukan.");
  if (overtime.employeeId !== ownerEmployeeId) throw new Error("Pengajuan ini bukan milik Anda.");
  if (overtime.status !== "DRAFT") throw new Error("Hanya draft yang bisa disubmit.");
  if (!overtime.selectedApproverId) throw new Error("Approver belum ditentukan.");

  const approval = await createApprovalRequest({
    companyId: overtime.employee.companyId,
    module: "overtime",
    referenceId: overtime.id,
    requesterId: overtime.employeeId,
    steps: [
      { approverType: "DIRECT_SPV", approverEmployeeId: overtime.selectedApproverId },
      { approverType: "HRD", approverRoleCode: "HRD" }
    ]
  });

  await db.overtimeRequest.update({
    where: { id },
    data: { status: "WAITING_APPROVAL", submittedAt: new Date(), approvalRequestId: approval.id }
  });

  await notifyEmployee({
    employeeId: overtime.selectedApproverId,
    title: "Pengajuan lembur baru",
    body: `${overtime.employee.fullName} mengajukan lembur ${overtime.overtimeDate.toISOString().slice(0, 10)} (${overtime.startTime}-${overtime.endTime}, ${Math.round(overtime.durationMinutes / 6) / 10} jam).`,
    link: "/my/approvals"
  });

  return approval;
}
