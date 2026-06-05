import { db } from "@/lib/db";

const defaultAnnualQuota = 16;

export async function getDefaultLeaveQuota(companyId: string) {
  const policy = await db.leavePolicy.findFirst({
    where: { companyId, isDefault: true },
    orderBy: { createdAt: "desc" }
  });
  return {
    quota: Number(policy?.annualQuota ?? defaultAnnualQuota),
    allowNegativeBalance: policy?.allowNegativeBalance ?? false
  };
}

export async function ensureEmployeeLeaveBalances(employeeId: string, companyId: string, periodYear = new Date().getFullYear()) {
  const [leaveTypes, policy] = await Promise.all([
    db.leaveType.findMany({ where: { companyId, deductsBalance: true, isActive: true } }),
    getDefaultLeaveQuota(companyId)
  ]);

  for (const leaveType of leaveTypes) {
    await db.leaveBalance.upsert({
      where: {
        employeeId_leaveTypeId_periodYear: {
          employeeId,
          leaveTypeId: leaveType.id,
          periodYear
        }
      },
      update: {},
      create: {
        employeeId,
        leaveTypeId: leaveType.id,
        periodYear,
        quota: policy.quota,
        used: 0,
        remaining: policy.quota
      }
    });
  }
}

export async function getOrCreateLeaveBalance(input: {
  employeeId: string;
  companyId: string;
  leaveTypeId: string;
  periodYear: number;
}) {
  const policy = await getDefaultLeaveQuota(input.companyId);
  return db.leaveBalance.upsert({
    where: {
      employeeId_leaveTypeId_periodYear: {
        employeeId: input.employeeId,
        leaveTypeId: input.leaveTypeId,
        periodYear: input.periodYear
      }
    },
    update: {},
    create: {
      employeeId: input.employeeId,
      leaveTypeId: input.leaveTypeId,
      periodYear: input.periodYear,
      quota: policy.quota,
      used: 0,
      remaining: policy.quota
    }
  });
}

export async function assertLeaveBalanceAvailable(input: {
  employeeId: string;
  companyId: string;
  leaveTypeId: string;
  durationDays: number;
  periodYear: number;
}) {
  const leaveType = await db.leaveType.findUnique({ where: { id: input.leaveTypeId } });
  if (!leaveType?.deductsBalance) return;

  const [balance, policy] = await Promise.all([
    getOrCreateLeaveBalance(input),
    getDefaultLeaveQuota(input.companyId)
  ]);

  if (!policy.allowNegativeBalance && Number(balance.remaining) < input.durationDays) {
    throw new Error(`Sisa cuti tidak cukup. Sisa saat ini ${balance.remaining.toString()} hari.`);
  }
}

export async function applyApprovedLeaveBalance(input: {
  employeeId: string;
  companyId: string;
  leaveTypeId: string;
  durationDays: number;
  periodYear: number;
}) {
  const leaveType = await db.leaveType.findUnique({ where: { id: input.leaveTypeId } });
  if (!leaveType?.deductsBalance) return null;

  const [balance, policy] = await Promise.all([
    getOrCreateLeaveBalance(input),
    getDefaultLeaveQuota(input.companyId)
  ]);

  const nextUsed = Number(balance.used) + input.durationDays;
  const nextRemaining = Number(balance.remaining) - input.durationDays;
  if (!policy.allowNegativeBalance && nextRemaining < 0) {
    throw new Error(`Sisa cuti tidak cukup. Sisa saat ini ${balance.remaining.toString()} hari.`);
  }

  return db.leaveBalance.update({
    where: { id: balance.id },
    data: {
      used: nextUsed,
      remaining: nextRemaining
    }
  });
}
