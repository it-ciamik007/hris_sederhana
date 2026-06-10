import { BadgeCheck, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

type LeaveDetail = {
  employeeName: string;
  leaveType: string;
  range: string;
  duration: string;
  reason: string;
};

export default async function MyApprovalsPage({ searchParams }: { searchParams: Promise<{ done?: string }> }) {
  const params = await searchParams;
  const session = await getSession();
  if (!session?.employeeId) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <BadgeCheck className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-3 text-lg font-semibold">Akun belum terhubung ke data karyawan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Hubungi admin HR untuk menghubungkan akun Anda.</p>
      </div>
    );
  }

  const [pendingStepsRaw, historySteps] = await Promise.all([
    db.approvalStep.findMany({
      where: {
        status: "PENDING",
        OR: [{ approverEmployeeId: session.employeeId }, { approverRoleCode: { in: session.roles } }]
      },
      include: { approvalRequest: true },
      orderBy: { createdAt: "asc" }
    }),
    db.approvalStep.findMany({
      where: { actionBy: session.id, status: { in: ["APPROVED", "REJECTED"] } },
      include: { approvalRequest: true },
      orderBy: { actionAt: "desc" },
      take: 20
    })
  ]);

  const pendingSteps = pendingStepsRaw.filter(
    (step) =>
      step.approvalRequest.currentStepNo === step.stepNo &&
      !["REJECTED", "APPROVED"].includes(step.approvalRequest.status)
  );

  const leaveIds = [...pendingSteps, ...historySteps]
    .filter((step) => step.approvalRequest.module === "leave")
    .map((step) => step.approvalRequest.referenceId);
  const leaves = leaveIds.length
    ? await db.leaveRequest.findMany({
        where: { id: { in: leaveIds } },
        include: { employee: true, leaveType: true }
      })
    : [];
  const leaveById = new Map<string, LeaveDetail>(
    leaves.map((leave) => [
      leave.id,
      {
        employeeName: leave.employee.fullName,
        leaveType: leave.leaveType.name,
        range: `${leave.startDate.toISOString().slice(0, 10)} s/d ${leave.endDate.toISOString().slice(0, 10)}`,
        duration: `${leave.durationDays.toString()} hari`,
        reason: leave.reason
      }
    ])
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={<><BadgeCheck className="h-4 w-4" />Area Pribadi</>}
        title="Approval Saya"
        description="Pengajuan yang menunggu tindakan Anda dan riwayat keputusan Anda."
      />

      {params.done && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-300/60 bg-emerald-50 p-3 text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
          <CheckCircle2 className="h-4 w-4" />
          Tindakan approval berhasil disimpan.
        </div>
      )}

      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-4">
          <div className="font-semibold">Menunggu Saya ({pendingSteps.length})</div>
          <div className="text-sm text-muted-foreground">Setujui atau tolak langsung dari sini.</div>
        </div>
        <div className="divide-y divide-border">
          {pendingSteps.map((step) => {
            const detail = step.approvalRequest.module === "leave" ? leaveById.get(step.approvalRequest.referenceId) : undefined;
            return (
              <div key={step.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium uppercase text-muted-foreground">
                    {step.approvalRequest.module}
                  </span>
                  <span className="text-xs text-muted-foreground">Step {step.stepNo}</span>
                </div>
                {detail ? (
                  <div className="mt-2">
                    <div className="font-medium">{detail.employeeName} - {detail.leaveType}</div>
                    <div className="text-sm text-muted-foreground">{detail.range} ({detail.duration})</div>
                    <div className="mt-1 text-sm"><span className="text-muted-foreground">Alasan:</span> {detail.reason}</div>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-muted-foreground">Referensi: {step.approvalRequest.referenceId}</div>
                )}

                <form action="/api/my/approvals/action" method="post" className="mt-3 grid gap-2 sm:flex sm:items-center">
                  <input type="hidden" name="approvalRequestId" value={step.approvalRequestId} />
                  <input type="hidden" name="stepId" value={step.id} />
                  <input
                    name="note"
                    placeholder="Catatan (opsional)"
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm sm:max-w-xs"
                  />
                  <div className="flex gap-2">
                    <button
                      name="action"
                      value="approve"
                      className="h-10 flex-1 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 sm:flex-none"
                    >
                      Setujui
                    </button>
                    <button
                      name="action"
                      value="reject"
                      className="h-10 flex-1 rounded-lg bg-rose-600 px-4 text-sm font-medium text-white hover:bg-rose-700 sm:flex-none"
                    >
                      Tolak
                    </button>
                  </div>
                </form>
              </div>
            );
          })}
          {!pendingSteps.length && (
            <div className="p-10 text-center text-sm text-muted-foreground">Tidak ada pengajuan yang menunggu Anda. 🎉</div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-4 font-semibold">Riwayat Tindakan Saya</div>
        <div className="divide-y divide-border">
          {historySteps.map((step) => {
            const detail = step.approvalRequest.module === "leave" ? leaveById.get(step.approvalRequest.referenceId) : undefined;
            return (
              <div key={step.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="font-medium">
                    {detail ? `${detail.employeeName} - ${detail.leaveType}` : `${step.approvalRequest.module} (${step.approvalRequest.referenceId.slice(0, 8)})`}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {detail?.range ?? ""} {step.actionAt ? `- ${step.actionAt.toISOString().slice(0, 16).replace("T", " ")}` : ""}
                    {step.note ? ` - Catatan: ${step.note}` : ""}
                  </div>
                </div>
                <StatusBadge status={step.status} />
              </div>
            );
          })}
          {!historySteps.length && <div className="p-10 text-center text-sm text-muted-foreground">Belum ada riwayat tindakan.</div>}
        </div>
      </section>
    </div>
  );
}
