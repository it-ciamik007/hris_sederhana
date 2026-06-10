import { CalendarDays, Send } from "lucide-react";
import { ApprovalTimeline } from "@/components/features/approvals/approval-timeline";
import { LeaveRequestDialog } from "@/components/features/leave/leave-request-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function MyLeavePage() {
  const session = await getSession();
  if (!session?.employeeId) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-3 text-lg font-semibold">Akun belum terhubung ke data karyawan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Hubungi admin HR untuk menghubungkan akun Anda.</p>
      </div>
    );
  }
  const employeeId = session.employeeId;
  const currentYear = new Date().getFullYear();

  const [me, employees, leaveTypes, balances, requests] = await Promise.all([
    db.employee.findUnique({ where: { id: employeeId } }),
    db.employee.findMany({ where: { employmentStatus: "ACTIVE" }, orderBy: { fullName: "asc" }, take: 200 }),
    db.leaveType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.leaveBalance.findMany({
      where: { employeeId, periodYear: currentYear },
      include: { leaveType: true },
      orderBy: { leaveType: { name: "asc" } }
    }),
    db.leaveRequest.findMany({
      where: { employeeId },
      include: {
        leaveType: true,
        selectedApprover: true,
        approvalRequest: { include: { steps: { orderBy: { stepNo: "asc" } } } }
      },
      orderBy: { createdAt: "desc" },
      take: 30
    })
  ]);

  const meOption = me ? { value: me.id, label: me.fullName, description: me.employeeNumber } : null;
  const approverOptions = employees
    .filter((employee) => employee.id !== employeeId)
    .map((employee) => ({ value: employee.id, label: employee.fullName, description: employee.employeeNumber }));
  const leaveTypeOptions = leaveTypes.map((leaveType) => ({ value: leaveType.id, label: leaveType.name, description: leaveType.code }));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={<><CalendarDays className="h-4 w-4" />Area Pribadi</>}
        title="Izin & Cuti Saya"
        description="Pantau saldo, riwayat, dan status approval pengajuan Anda."
        action={
          <LeaveRequestDialog
            employees={meOption ? [meOption] : []}
            approvers={approverOptions}
            leaveTypes={leaveTypeOptions}
            canChooseEmployee={false}
            currentEmployee={meOption}
            defaultApproverId={me?.supervisorId ?? ""}
          />
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {balances.map((balance) => (
          <div key={balance.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="text-sm font-semibold">{balance.leaveType.name}</div>
            <div className="mt-2 text-3xl font-semibold text-primary">{balance.remaining.toString()}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Quota {balance.quota.toString()} - terpakai {balance.used.toString()} hari
            </div>
          </div>
        ))}
        {!balances.length && (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground sm:col-span-2 lg:col-span-4">
            Saldo cuti {currentYear} belum terbentuk. Hubungi HR bila perlu inisialisasi saldo.
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-4 font-semibold">Riwayat Pengajuan</div>
        <div className="divide-y divide-border">
          {requests.map((request) => (
            <details key={request.id} className="group">
              <summary className="flex cursor-pointer list-none flex-col gap-2 p-4 transition hover:bg-accent/40 sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{request.leaveType.name}</span>
                    <StatusBadge status={request.status} />
                  </div>
                  <div className="mt-0.5 text-sm text-muted-foreground">
                    {request.startDate.toISOString().slice(0, 10)} s/d {request.endDate.toISOString().slice(0, 10)} ({request.durationDays.toString()} hari)
                    {request.selectedApprover ? ` - Atasan: ${request.selectedApprover.fullName}` : ""}
                  </div>
                </div>
                {request.status === "DRAFT" && (
                  <form action={`/api/leave/requests/${request.id}/submit`} method="post" className="shrink-0">
                    <button className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                      <Send className="h-3.5 w-3.5" />
                      Submit
                    </button>
                  </form>
                )}
              </summary>
              <div className="space-y-3 border-t border-border/60 bg-muted/30 p-4">
                <div className="text-sm"><span className="font-medium">Alasan:</span> {request.reason}</div>
                {request.approvalRequest?.steps.length ? (
                  <ApprovalTimeline steps={request.approvalRequest.steps} />
                ) : (
                  <div className="text-sm text-muted-foreground">Belum disubmit untuk approval.</div>
                )}
              </div>
            </details>
          ))}
          {!requests.length && (
            <div className="p-10 text-center text-sm text-muted-foreground">Belum ada pengajuan. Klik tombol Pengajuan untuk membuat.</div>
          )}
        </div>
      </section>
    </div>
  );
}
