import { Clock, Send } from "lucide-react";
import { ApprovalTimeline } from "@/components/features/approvals/approval-timeline";
import { OvertimeRequestDialog } from "@/components/features/overtime/overtime-request-dialog";
import { MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

function formatHours(minutes: number) {
  return `${Math.round((minutes / 60) * 10) / 10} jam`;
}

export default async function MyOvertimePage() {
  const session = await getSession();
  if (!session?.employeeId) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <Clock className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-3 text-lg font-semibold">Akun belum terhubung ke data karyawan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Hubungi admin HR untuk menghubungkan akun Anda.</p>
      </div>
    );
  }
  const employeeId = session.employeeId;
  const yearStart = new Date(Date.UTC(new Date().getFullYear(), 0, 1));

  const [me, employees, requests] = await Promise.all([
    db.employee.findUnique({ where: { id: employeeId } }),
    db.employee.findMany({ where: { employmentStatus: "ACTIVE" }, orderBy: { fullName: "asc" }, take: 200 }),
    db.overtimeRequest.findMany({
      where: { employeeId },
      include: {
        selectedApprover: true,
        approvalRequest: { include: { steps: { orderBy: { stepNo: "asc" } } } }
      },
      orderBy: { createdAt: "desc" },
      take: 30
    })
  ]);

  const approvedThisYear = requests
    .filter((item) => item.status === "APPROVED" && item.overtimeDate >= yearStart)
    .reduce((sum, item) => sum + item.durationMinutes, 0);
  const waiting = requests.filter((item) => item.status === "WAITING_APPROVAL").length;

  const approverOptions = employees
    .filter((employee) => employee.id !== employeeId)
    .map((employee) => ({ value: employee.id, label: employee.fullName, description: employee.employeeNumber }));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={<><Clock className="h-4 w-4" />Area Pribadi</>}
        title="Lembur Saya"
        description="Ajukan lembur dan pantau status persetujuannya."
        action={<OvertimeRequestDialog approvers={approverOptions} defaultApproverId={me?.supervisorId ?? ""} />}
      />

      <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
        <MetricCard label={`Lembur Disetujui ${new Date().getFullYear()}`} value={formatHours(approvedThisYear)} tone="emerald" />
        <MetricCard label="Menunggu Approval" value={waiting} tone={waiting ? "amber" : "slate"} />
      </div>

      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-4 font-semibold">Riwayat Lembur</div>
        <div className="divide-y divide-border">
          {requests.map((request) => (
            <details key={request.id} className="group">
              <summary className="flex cursor-pointer list-none flex-col gap-2 p-4 transition hover:bg-accent/40 sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{request.overtimeDate.toISOString().slice(0, 10)}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {request.startTime} - {request.endTime} ({formatHours(request.durationMinutes)})
                    </span>
                    <StatusBadge status={request.status} />
                  </div>
                  <div className="mt-0.5 truncate text-sm text-muted-foreground">
                    {request.selectedApprover ? `Atasan: ${request.selectedApprover.fullName} - ` : ""}{request.reason}
                  </div>
                </div>
                {request.status === "DRAFT" && (
                  <form action={`/api/my/overtime/${request.id}/submit`} method="post" className="shrink-0">
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
            <div className="p-10 text-center text-sm text-muted-foreground">Belum ada pengajuan lembur.</div>
          )}
        </div>
      </section>
    </div>
  );
}
