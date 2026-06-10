import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { approveStep, rejectStep } from "@/server/services/approval.service";

const actionSchema = z.object({
  approvalRequestId: z.string().min(1),
  stepId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  note: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined))
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });

  try {
    const form = Object.fromEntries(await request.formData());
    const input = actionSchema.parse(form);

    const step = await db.approvalStep.findUnique({
      where: { id: input.stepId },
      include: { approvalRequest: true }
    });
    if (!step || step.approvalRequestId !== input.approvalRequestId) {
      return NextResponse.json({ message: "Step approval tidak ditemukan." }, { status: 404 });
    }
    if (step.status !== "PENDING" || step.approvalRequest.currentStepNo !== step.stepNo) {
      return NextResponse.json({ message: "Step ini tidak sedang menunggu persetujuan." }, { status: 400 });
    }

    const isAssignedToMe =
      (step.approverEmployeeId && step.approverEmployeeId === session.employeeId) ||
      (step.approverRoleCode && session.roles.includes(step.approverRoleCode)) ||
      session.roles.includes("SUPER_ADMIN");
    if (!isAssignedToMe) {
      return NextResponse.json({ message: "Anda bukan approver untuk step ini." }, { status: 403 });
    }

    if (input.action === "approve") {
      await approveStep(input.approvalRequestId, input.stepId, session.id, input.note);
    } else {
      await rejectStep(input.approvalRequestId, input.stepId, session.id, input.note);
    }

    return NextResponse.redirect(new URL("/my/approvals?done=1", request.url), 303);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Aksi approval gagal" },
      { status: 400 }
    );
  }
}
