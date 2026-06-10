import Link from "next/link";
import { BadgeCheck, CalendarCheck, CalendarDays, House, UserRound } from "lucide-react";
import { MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function MyDashboardPage() {
  const session = await getSession();
  if (!session?.employeeId) {
    return <NoEmployeeCard />;
  }
  const employeeId = session.employeeId;

  const now = new Date();
  const currentYear = now.getFullYear();
  const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0));

  const [employee, leaveBalances, attendance, pendingSteps, recentLeaves] = await Promise.all([
    db.employee.findUnique({
      where: { id: employeeId },
      include: { position: true, department: true }
    }),
    db.leaveBalance.findMany({
      where: { employeeId, periodYear: currentYear },
      include: { leaveType: true },
      orderBy: { leaveType: { name: "asc" } }
    }),
    db.attendanceDaily.findMany({
      where: { employeeId, attendanceDate: { gte: monthStart, lte: monthEnd } }
    }),
    db.approvalStep.findMany({
      where: {
        status: "PENDING",
        OR: [{ approverEmployeeId: employeeId }, { approverRoleCode: { in: session.roles } }]
      },
      include: { approvalRequest: true }
    }),
    db.leaveRequest.findMany({
      where: { employeeId },
      include: { leaveType: true },
      orderBy: { createdAt: "desc" },
      take: 5
    })
  ]);

  const actionableSteps = pendingSteps.filter((step) => step.approvalRequest.currentStepNo === step.stepNo && step.approvalRequest.status !== "REJECTED");
  const present = attendance.filter((item) => item.status === "PRESENT" || item.status === "LATE").length;
  const late = attendance.filter((item) => item.status === "LATE" || item.lateMinutes > 0).length;
  const totalRemaining = leaveBalances.reduce((sum, balance) => sum + Number(balance.remaining), 0);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={<><House className="h-4 w-4" />Area Pribadi</>}
        title={`Halo, ${employee?.fullName ?? session.name}`}
        description={[employee?.position?.name, employee?.department?.name].filter(Boolean).join(" - ") || "Selamat bekerja."}
        action={
          <Link href="/my/leave" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90">
            <CalendarDays className="h-4 w-4" />
            Ajukan Cuti
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={`Sisa Cuti ${currentYear}`} value={totalRemaining} tone="cyan" />
        <MetricCard label="Hadir Bulan Ini" value={present} tone="emerald" />
        <MetricCard label="Telat Bulan Ini" value={late} tone={late ? "amber" : "slate"} />
        <MetricCard label="Menunggu Approval Saya" value={actionableSteps.length} tone={actionableSteps.length ? "rose" : "slate"} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="font-semibold">Pengajuan Cuti Terakhir</div>
            <Link href="/my/leave" className="text-sm font-medium text-primary hover:underline">Lihat semua</Link>
          </div>
          <div className="divide-y divide-border">
            {recentLeaves.map((leave) => (
              <div key={leave.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="font-medium">{leave.leaveType.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {leave.startDate.toISOString().slice(0, 10)} s/d {leave.endDate.toISOString().slice(0, 10)} ({leave.durationDays.toString()} hari)
                  </div>
                </div>
                <StatusBadge status={leave.status} />
              </div>
            ))}
            {!recentLeaves.length && <div className="p-8 text-center text-sm text-muted-foreground">Belum ada pengajuan cuti.</div>}
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="font-semibold">Saldo Cuti {currentYear}</div>
              <Link href="/my/leave" className="text-sm font-medium text-primary hover:underline">Detail</Link>
            </div>
            <div className="divide-y divide-border">
              {leaveBalances.map((balance) => (
                <div key={balance.id} className="flex items-center justify-between p-4">
                  <div className="text-sm font-medium">{balance.leaveType.name}</div>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-primary">{balance.remaining.toString()}</span>
                    <span className="ml-1 text-xs text-muted-foreground">/ {balance.quota.toString()} hari</span>
                  </div>
                </div>
              ))}
              {!leaveBalances.length && <div className="p-8 text-center text-sm text-muted-foreground">Saldo cuti belum terbentuk.</div>}
            </div>
          </section>

          {actionableSteps.length > 0 && (
            <Link href="/my/approvals" className="flex items-center gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-amber-900 shadow-sm transition hover:-translate-y-0.5 dark:bg-amber-950/40 dark:text-amber-100">
              <BadgeCheck className="h-6 w-6 shrink-0" />
              <div>
                <div className="font-semibold">{actionableSteps.length} pengajuan menunggu persetujuan Anda</div>
                <div className="text-sm opacity-80">Klik untuk membuka inbox approval.</div>
              </div>
            </Link>
          )}

          <Link href="/my/attendance" className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5">
            <CalendarCheck className="h-6 w-6 shrink-0 text-primary" />
            <div>
              <div className="font-semibold">Kalender Absensi</div>
              <div className="text-sm text-muted-foreground">Lihat rekap kehadiran bulanan Anda.</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function NoEmployeeCard() {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
      <UserRound className="mx-auto h-10 w-10 text-muted-foreground" />
      <h1 className="mt-3 text-lg font-semibold">Akun belum terhubung ke data karyawan</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Hubungi admin HR untuk menghubungkan akun login Anda dengan data karyawan agar fitur area pribadi aktif.
      </p>
    </div>
  );
}
