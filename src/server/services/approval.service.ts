import crypto from "crypto";
import type { Prisma } from "@prisma/client";
import { addHours } from "date-fns";
import { db } from "@/lib/db";
import { audit } from "@/server/services/audit.service";
import { applyApprovedLeaveBalance } from "@/server/services/leave-balance.service";
import { notifyEmployee, notifyRole } from "@/server/services/notification-inapp.service";
import { queueNotification } from "@/server/services/notification.service";

type ApprovalStepInput = {
  approverType: "DIRECT_SPV" | "MANAGER" | "PARTNER" | "HRD" | "SPECIFIC_EMPLOYEE" | "ROLE";
  approverEmployeeId?: string;
  approverRoleCode?: string;
};

type ApprovalRequestWithSteps = Prisma.ApprovalRequestGetPayload<{ include: { steps: true } }>;

export async function createApprovalRequest(input: {
  companyId: string;
  module: string;
  referenceId: string;
  requesterId?: string;
  steps: ApprovalStepInput[];
}) {
  return db.$transaction(async (tx) => {
    const request = await tx.approvalRequest.create({
      data: {
        companyId: input.companyId,
        module: input.module,
        referenceId: input.referenceId,
        requesterId: input.requesterId,
        steps: {
          create: input.steps.map((step, index) => ({
            stepNo: index + 1,
            approverType: step.approverType,
            approverEmployeeId: step.approverEmployeeId,
            approverRoleCode: step.approverRoleCode
          }))
        }
      },
      include: { steps: true }
    });

    await tx.activityLog.create({
      data: {
        companyId: input.companyId,
        module: "approval",
        action: "create",
        referenceId: request.id,
        newData: request
      }
    });

    return request;
  });
}

export async function generateApprovalToken(approvalRequestId: string, stepId: string, action: "approve" | "reject") {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  await db.approvalToken.create({
    data: {
      approvalRequestId,
      stepId,
      action,
      tokenHash,
      expiresAt: addHours(new Date(), 48)
    }
  });
  return token;
}

export async function validateApprovalToken(token: string) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const approvalToken = await db.approvalToken.findFirst({
    where: { tokenHash },
    include: { approvalRequest: { include: { steps: true } } }
  });

  if (!approvalToken) throw new Error("TOKEN_NOT_FOUND");
  if (approvalToken.usedAt) throw new Error("TOKEN_ALREADY_USED");
  if (approvalToken.expiresAt < new Date()) throw new Error("TOKEN_EXPIRED");

  return approvalToken;
}

export async function approveStep(approvalRequestId: string, stepId: string, userId?: string, note?: string) {
  const request = await db.approvalRequest.findUnique({
    where: { id: approvalRequestId },
    include: { steps: { orderBy: { stepNo: "asc" } } }
  });
  if (!request) throw new Error("Approval request not found.");

  const step = request.steps.find((item) => item.id === stepId);
  if (!step || step.status !== "PENDING") throw new Error("Approval step is not pending.");

  const nextStep = request.steps.find((item) => item.stepNo === step.stepNo + 1);

  await db.$transaction([
    db.approvalStep.update({
      where: { id: stepId },
      data: { status: "APPROVED", actionBy: userId, actionAt: new Date(), note }
    }),
    db.approvalRequest.update({
      where: { id: approvalRequestId },
      data: nextStep
        ? { currentStepNo: nextStep.stepNo, status: "IN_PROGRESS" }
        : { status: "APPROVED", completedAt: new Date() }
    })
  ]);

  await audit({
    companyId: request.companyId,
    userId,
    module: "approval",
    action: "approve",
    referenceId: approvalRequestId,
    newData: { stepId, note }
  });

  await handleModuleApprovalAfterAction(request, nextStep ? "next" : "approved", nextStep?.id, note);
}

export async function rejectStep(approvalRequestId: string, stepId: string, userId?: string, note?: string) {
  const request = await db.approvalRequest.findUnique({
    where: { id: approvalRequestId },
    include: { steps: { orderBy: { stepNo: "asc" } } }
  });
  if (!request) throw new Error("Approval request not found.");

  await db.$transaction([
    db.approvalStep.update({
      where: { id: stepId },
      data: { status: "REJECTED", actionBy: userId, actionAt: new Date(), note }
    }),
    db.approvalRequest.update({
      where: { id: approvalRequestId },
      data: { status: "REJECTED", completedAt: new Date() }
    })
  ]);

  await audit({
    companyId: request.companyId,
    userId,
    module: "approval",
    action: "reject",
    referenceId: approvalRequestId,
    newData: { stepId, note }
  });

  await handleModuleApprovalAfterAction(request, "rejected", undefined, note);
}

async function handleModuleApprovalAfterAction(
  request: ApprovalRequestWithSteps | null,
  outcome: "next" | "approved" | "rejected",
  nextStepId?: string,
  note?: string
) {
  if (!request) return;
  if (request.module === "leave") return handleLeaveApprovalOutcome(request, outcome, nextStepId, note);
  if (request.module === "overtime") return handleOvertimeApprovalOutcome(request, outcome, nextStepId, note);
  if (request.module === "reimbursement") return handleReimbursementApprovalOutcome(request, outcome, nextStepId, note);
}

async function notifyNextStepApprover(
  request: ApprovalRequestWithSteps,
  nextStepId: string | undefined,
  notification: { title: string; body: string }
) {
  const nextStep = request.steps.find((step) => step.id === nextStepId);
  if (!nextStep) return;
  const payload = { ...notification, link: "/my/approvals" };
  if (nextStep.approverEmployeeId) {
    await notifyEmployee({ ...payload, employeeId: nextStep.approverEmployeeId });
  } else if (nextStep.approverRoleCode) {
    await notifyRole({ ...payload, roleCode: nextStep.approverRoleCode });
  }
}

async function handleOvertimeApprovalOutcome(
  request: ApprovalRequestWithSteps,
  outcome: "next" | "approved" | "rejected",
  nextStepId?: string,
  note?: string
) {
  const overtime = await db.overtimeRequest.findUnique({
    where: { id: request.referenceId },
    include: { employee: true }
  });
  if (!overtime) return;

  const dateLabel = overtime.overtimeDate.toISOString().slice(0, 10);

  if (outcome === "approved") {
    await db.overtimeRequest.update({ where: { id: overtime.id }, data: { status: "APPROVED" } });
    await notifyEmployee({
      employeeId: overtime.employeeId,
      title: "Lembur disetujui",
      body: `Lembur ${dateLabel} (${overtime.startTime}-${overtime.endTime}) disetujui.`,
      link: "/my/overtime"
    });
    return;
  }

  if (outcome === "rejected") {
    await db.overtimeRequest.update({ where: { id: overtime.id }, data: { status: "REJECTED" } });
    await notifyEmployee({
      employeeId: overtime.employeeId,
      title: "Lembur ditolak",
      body: `Lembur ${dateLabel} ditolak.${note ? ` Catatan: ${note}` : ""}`,
      link: "/my/overtime"
    });
    return;
  }

  await notifyNextStepApprover(request, nextStepId, {
    title: "Approval lembur menunggu Anda",
    body: `Lembur ${overtime.employee.fullName} tanggal ${dateLabel} menunggu persetujuan Anda.`
  });
}

async function handleReimbursementApprovalOutcome(
  request: ApprovalRequestWithSteps,
  outcome: "next" | "approved" | "rejected",
  nextStepId?: string,
  note?: string
) {
  const reimbursement = await db.reimbursementRequest.findUnique({
    where: { id: request.referenceId },
    include: { employee: true, reimbursementType: true }
  });
  if (!reimbursement) return;

  const amountLabel = `Rp ${Number(reimbursement.amount).toLocaleString("id-ID")}`;

  if (outcome === "approved") {
    await db.reimbursementRequest.update({ where: { id: reimbursement.id }, data: { status: "APPROVED" } });
    await notifyEmployee({
      employeeId: reimbursement.employeeId,
      title: "Reimbursement disetujui",
      body: `${reimbursement.reimbursementType.name} sebesar ${amountLabel} disetujui dan menunggu pembayaran.`,
      link: "/my/reimbursement"
    });
    return;
  }

  if (outcome === "rejected") {
    await db.reimbursementRequest.update({ where: { id: reimbursement.id }, data: { status: "REJECTED" } });
    await notifyEmployee({
      employeeId: reimbursement.employeeId,
      title: "Reimbursement ditolak",
      body: `${reimbursement.reimbursementType.name} sebesar ${amountLabel} ditolak.${note ? ` Catatan: ${note}` : ""}`,
      link: "/my/reimbursement"
    });
    return;
  }

  await notifyNextStepApprover(request, nextStepId, {
    title: "Approval reimbursement menunggu Anda",
    body: `${reimbursement.reimbursementType.name} ${reimbursement.employee.fullName} (${amountLabel}) menunggu persetujuan Anda.`
  });
}

async function handleLeaveApprovalOutcome(
  request: ApprovalRequestWithSteps,
  outcome: "next" | "approved" | "rejected",
  nextStepId?: string,
  note?: string
) {
  const leave = await db.leaveRequest.findUnique({
    where: { id: request.referenceId },
    include: { employee: true, leaveType: true }
  });
  if (!leave) return;

  if (outcome === "approved") {
    await applyApprovedLeaveBalance({
      employeeId: leave.employeeId,
      companyId: leave.employee.companyId,
      leaveTypeId: leave.leaveTypeId,
      durationDays: Number(leave.durationDays),
      periodYear: leave.startDate.getFullYear()
    });
    await db.leaveRequest.update({ where: { id: leave.id }, data: { status: "APPROVED" } });
    await queueNotification({
      companyId: leave.employee.companyId,
      templateCode: "LEAVE_APPROVED",
      recipientPhone: leave.employee.whatsappNumber,
      payload: leavePayload(leave)
    });
    await notifyEmployee({
      employeeId: leave.employeeId,
      title: "Cuti disetujui",
      body: `Pengajuan ${leave.leaveType.name} ${leave.startDate.toISOString().slice(0, 10)} s/d ${leave.endDate.toISOString().slice(0, 10)} disetujui.`,
      link: "/my/leave"
    });
    return;
  }

  if (outcome === "rejected") {
    await db.leaveRequest.update({ where: { id: leave.id }, data: { status: "REJECTED" } });
    await queueNotification({
      companyId: leave.employee.companyId,
      templateCode: "LEAVE_REJECTED",
      recipientPhone: leave.employee.whatsappNumber,
      payload: { ...leavePayload(leave), note: note ?? "-" }
    });
    await notifyEmployee({
      employeeId: leave.employeeId,
      title: "Cuti ditolak",
      body: `Pengajuan ${leave.leaveType.name} ${leave.startDate.toISOString().slice(0, 10)} s/d ${leave.endDate.toISOString().slice(0, 10)} ditolak.${note ? ` Catatan: ${note}` : ""}`,
      link: "/my/leave"
    });
    return;
  }

  const nextStep = request.steps.find((step) => step.id === nextStepId);
  if (!nextStep) return;

  await db.leaveRequest.update({
    where: { id: leave.id },
    data: { status: statusForStep(nextStep.approverType, nextStep.approverRoleCode) }
  });

  const approver = await resolveStepApprover({
    companyId: leave.employee.companyId,
    approverEmployeeId: nextStep.approverEmployeeId,
    approverRoleCode: nextStep.approverRoleCode
  });
  const approveToken = await generateApprovalToken(request.id, nextStep.id, "approve");
  const rejectToken = await generateApprovalToken(request.id, nextStep.id, "reject");

  await queueNotification({
    companyId: leave.employee.companyId,
    templateCode: "LEAVE_APPROVAL_REQUEST",
    recipientPhone: approver?.whatsappNumber,
    payload: {
      ...leavePayload(leave),
      approver_name: approver?.fullName ?? "Approver",
      approve_url: `${process.env.APP_URL ?? "http://localhost:3000"}/api/approval/action?token=${approveToken}`,
      reject_url: `${process.env.APP_URL ?? "http://localhost:3000"}/api/approval/action?token=${rejectToken}`
    }
  });

  const nextNotification = {
    title: "Approval cuti menunggu Anda",
    body: `Pengajuan ${leave.leaveType.name} dari ${leave.employee.fullName} menunggu persetujuan Anda.`,
    link: "/my/approvals"
  };
  if (nextStep.approverEmployeeId) {
    await notifyEmployee({ ...nextNotification, employeeId: nextStep.approverEmployeeId });
  } else if (nextStep.approverRoleCode) {
    await notifyRole({ ...nextNotification, roleCode: nextStep.approverRoleCode });
  } else if (approver?.id) {
    await notifyEmployee({ ...nextNotification, employeeId: approver.id });
  }
}

function leavePayload(leave: {
  employee: { fullName: string };
  leaveType: { name: string };
  startDate: Date;
  endDate: Date;
  durationDays: { toString(): string };
  reason: string;
}) {
  return {
    employee_name: leave.employee.fullName,
    leave_type: leave.leaveType.name,
    start_date: leave.startDate.toISOString().slice(0, 10),
    end_date: leave.endDate.toISOString().slice(0, 10),
    duration: leave.durationDays.toString(),
    reason: leave.reason
  };
}

function statusForStep(approverType: string, roleCode?: string | null) {
  if (approverType === "DIRECT_SPV") return "WAITING_SPV";
  if (approverType === "MANAGER" || roleCode === "MANAGER") return "WAITING_MANAGER";
  if (approverType === "HRD" || roleCode === "HRD") return "WAITING_HRD";
  return "WAITING_APPROVAL";
}

async function resolveStepApprover(input: {
  companyId: string;
  approverEmployeeId?: string | null;
  approverRoleCode?: string | null;
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
