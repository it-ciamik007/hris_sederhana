import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type AuditInput = {
  companyId?: string | null;
  userId?: string | null;
  employeeId?: string | null;
  module: string;
  action: string;
  referenceId?: string | null;
  oldData?: unknown;
  newData?: unknown;
};

export async function audit(input: AuditInput) {
  await db.activityLog.create({
    data: {
      companyId: input.companyId,
      userId: input.userId,
      employeeId: input.employeeId,
      module: input.module,
      action: input.action,
      referenceId: input.referenceId,
      oldData: input.oldData as Prisma.InputJsonValue,
      newData: input.newData as Prisma.InputJsonValue
    }
  });
}
