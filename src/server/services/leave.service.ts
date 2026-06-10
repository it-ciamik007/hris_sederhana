import { z } from "zod";
import { eachDateBetween, isWeekend, parseDateOnly } from "@/lib/validators/date";
import { db } from "@/lib/db";
import { createApprovalRequest, generateApprovalToken } from "@/server/services/approval.service";
import { assertLeaveBalanceAvailable } from "@/server/services/leave-balance.service";
import { notifyEmployee, notifyRole } from "@/server/services/notification-inapp.service";
import { queueNotification } from "@/server/services/notification.service";

export const leaveRequestSchema = z.object({
  employeeId: z.string(),
  leaveTypeId: z.string(),
  selectedApproverId: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(3)
});

export async function calculateLeaveDuration(companyId: string, startDate: string, endDate: string) {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  const holidays = await db.holiday.findMany({
    where: { companyId, holidayDate: { gte: start, lte: end } }
  });
  const holidaySet = new Set(holidays.map((holiday) => holiday.holidayDate.toISOString().slice(0, 10)));

  return eachDateBetween(start, end).filter((date) => {
    const key = date.toISOString().slice(0, 10);
    return !isWeekend(date) && !holidaySet.has(key);
  }).length;
}

export async function createLeaveRequest(input: unknown) {
  const data = leaveRequestSchema.parse(input);
  const employee = await db.employee.findUnique({ where: { id: data.employeeId }, include: { supervisor: true } });
  if (!employee) throw new Error("Employee not found.");
  const selectedApproverId = data.selectedApproverId || employee.supervisorId;
  if (!selectedApproverId) throw new Error("Atasan/SPV wajib dipilih untuk pengajuan cuti.");
  if (selectedApproverId === employee.id) throw new Error("Atasan tidak boleh sama dengan karyawan pengaju.");

  const selectedApprover = await db.employee.findUnique({ where: { id: selectedApproverId } });
  if (!selectedApprover || selectedApprover.companyId !== employee.companyId) {
    throw new Error("Atasan/SPV tidak valid untuk perusahaan karyawan ini.");
  }

  const duration = await calculateLeaveDuration(employee.companyId, data.startDate, data.endDate);

  return db.leaveRequest.create({
    data: {
      employeeId: data.employeeId,
      leaveTypeId: data.leaveTypeId,
      selectedApproverId,
      startDate: parseDateOnly(data.startDate),
      endDate: parseDateOnly(data.endDate),
      durationDays: duration,
      reason: data.reason
    }
  });
}

export async function submitLeaveRequest(leaveRequestId: string) {
  const leave = await db.leaveRequest.findUnique({
    where: { id: leaveRequestId },
    include: { employee: { include: { supervisor: true, position: true } }, selectedApprover: true, leaveType: true }
  });
  if (!leave) throw new Error("Leave request not found.");
  if (leave.status !== "DRAFT") throw new Error("Only draft leave request can be submitted.");
  await assertLeaveBalanceAvailable({
    employeeId: leave.employeeId,
    companyId: leave.employee.companyId,
    leaveTypeId: leave.leaveTypeId,
    durationDays: Number(leave.durationDays),
    periodYear: leave.startDate.getFullYear()
  });

  const selectedApproverId = leave.selectedApproverId ?? leave.employee.supervisorId;
  const firstApproverType = selectedApproverId
    ? "DIRECT_SPV"
    : leave.employee.position?.isSpvLevel
    ? "MANAGER"
    : "HRD";
  const approval = await createApprovalRequest({
    companyId: leave.employee.companyId,
    module: "leave",
    referenceId: leave.id,
    requesterId: leave.employeeId,
    steps: [
      {
        approverType: firstApproverType,
        approverEmployeeId: firstApproverType === "DIRECT_SPV" ? selectedApproverId ?? undefined : undefined,
        approverRoleCode: firstApproverType === "MANAGER" ? "MANAGER" : firstApproverType === "HRD" ? "HRD" : undefined
      },
      ...(firstApproverType === "HRD" ? [] : ([{ approverType: "HRD", approverRoleCode: "HRD" }] as const))
    ]
  });
  const firstStep = approval.steps.find((step) => step.stepNo === 1);
  const approveToken = firstStep ? await generateApprovalToken(approval.id, firstStep.id, "approve") : "";
  const rejectToken = firstStep ? await generateApprovalToken(approval.id, firstStep.id, "reject") : "";
  const approver = await resolveApproverContact({
    companyId: leave.employee.companyId,
    approverType: firstApproverType,
    approverEmployeeId: firstApproverType === "DIRECT_SPV" ? selectedApproverId : undefined,
    approverRoleCode: firstApproverType === "MANAGER" ? "MANAGER" : firstApproverType === "HRD" ? "HRD" : undefined
  });

  await db.leaveRequest.update({
    where: { id: leave.id },
    data: {
      status:
        firstApproverType === "DIRECT_SPV"
          ? "WAITING_SPV"
          : firstApproverType === "MANAGER"
            ? "WAITING_MANAGER"
            : "WAITING_HRD",
      submittedAt: new Date(),
      approvalRequestId: approval.id
    }
  });

  await queueNotification({
    companyId: leave.employee.companyId,
    templateCode: "LEAVE_APPROVAL_REQUEST",
    recipientPhone: approver?.whatsappNumber,
    payload: {
      approver_name: approver?.fullName ?? "Approver",
      employee_name: leave.employee.fullName,
      leave_type: leave.leaveType.name,
      start_date: leave.startDate.toISOString().slice(0, 10),
      end_date: leave.endDate.toISOString().slice(0, 10),
      duration: leave.durationDays.toString(),
      reason: leave.reason,
      approve_url: `${process.env.APP_URL ?? "http://localhost:3000"}/api/approval/action?token=${approveToken}`,
      reject_url: `${process.env.APP_URL ?? "http://localhost:3000"}/api/approval/action?token=${rejectToken}`
    }
  });

  const notification = {
    title: "Pengajuan cuti baru",
    body: `${leave.employee.fullName} mengajukan ${leave.leaveType.name} ${leave.startDate.toISOString().slice(0, 10)} s/d ${leave.endDate.toISOString().slice(0, 10)} (${leave.durationDays.toString()} hari).`,
    link: "/my/approvals"
  };
  if (approver?.id) {
    await notifyEmployee({ ...notification, employeeId: approver.id });
  } else if (firstStep?.approverRoleCode) {
    await notifyRole({ ...notification, roleCode: firstStep.approverRoleCode });
  }

  return approval;
}

async function resolveApproverContact(input: {
  companyId: string;
  approverType: string;
  approverEmployeeId?: string | null;
  approverRoleCode?: string;
}) {
  if (input.approverEmployeeId) {
    return db.employee.findUnique({ where: { id: input.approverEmployeeId } });
  }

  if (input.approverRoleCode) {
    const user = await db.user.findFirst({
      where: {
        isActive: true,
        employee: { companyId: input.companyId, whatsappNumber: { not: null } },
        roles: { some: { role: { code: input.approverRoleCode } } }
      },
      include: { employee: true },
      orderBy: { createdAt: "asc" }
    });
    if (user?.employee) return user.employee;
  }

  const fallback = await db.user.findFirst({
    where: {
      isActive: true,
      employee: { companyId: input.companyId, whatsappNumber: { not: null } },
      roles: { some: { role: { code: { in: ["HR_ADMIN", "HRD", "SUPER_ADMIN"] } } } }
    },
    include: { employee: true },
    orderBy: { createdAt: "asc" }
  });

  return fallback?.employee ?? null;
}
