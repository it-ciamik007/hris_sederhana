import { Paperclip, Receipt, Send } from "lucide-react";
import { ApprovalTimeline } from "@/components/features/approvals/approval-timeline";
import {
  ReimbursementRequestDialog,
  type ReimbursementTypeOption
} from "@/components/features/reimbursement/reimbursement-request-dialog";
import { MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

function rupiah(value: number | string) {
  return `Rp ${Number(value).toLocaleString("id-ID")}`;
}

export default async function MyReimbursementPage() {
  const session = await getSession();
  if (!session?.employeeId) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <Receipt className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-3 text-lg font-semibold">Akun belum terhubung ke data karyawan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Hubungi admin HR untuk menghubungkan akun Anda.</p>
      </div>
    );
  }
  const employeeId = session.employeeId;
  const yearStart = new Date(Date.UTC(new Date().getFullYear(), 0, 1));

  const [me, employees, types, requests] = await Promise.all([
    db.employee.findUnique({ where: { id: employeeId } }),
    db.employee.findMany({ where: { employmentStatus: "ACTIVE" }, orderBy: { fullName: "asc" }, take: 200 }),
    db.reimbursementType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.reimbursementRequest.findMany({
      where: { employeeId },
      include: {
        reimbursementType: true,
        selectedApprover: true,
        approvalRequest: { include: { steps: { orderBy: { stepNo: "asc" } } } }
      },
      orderBy: { createdAt: "desc" },
      take: 30
    })
  ]);

  const approvedThisYear = requests
    .filter((item) => ["APPROVED", "PAID"].includes(item.status) && item.expenseDate >= yearStart)
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const waiting = requests.filter((item) => item.status === "WAITING_APPROVAL").length;

  const typeOptions: ReimbursementTypeOption[] = types.map((type) => ({
    value: type.id,
    label: type.name,
    maxAmount: type.maxAmount?.toString() ?? null,
    requiresAttachment: type.requiresAttachment
  }));
  const approverOptions = employees
    .filter((employee) => employee.id !== employeeId)
    .map((employee) => ({ value: employee.id, label: employee.fullName, description: employee.employeeNumber }));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={<><Receipt className="h-4 w-4" />Area Pribadi</>}
        title="Reimbursement Saya"
        description="Ajukan penggantian biaya dengan bukti dan pantau status pembayarannya."
        action={
          typeOptions.length ? (
            <ReimbursementRequestDialog types={typeOptions} approvers={approverOptions} defaultApproverId={me?.supervisorId ?? ""} />
          ) : undefined
        }
      />

      {!typeOptions.length && (
        <div className="rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          Belum ada tipe reimbursement aktif. Hubungi admin untuk menambahkannya di menu Organisasi.
        </div>
      )}

      <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
        <MetricCard label={`Disetujui ${new Date().getFullYear()}`} value={rupiah(approvedThisYear)} tone="emerald" />
        <MetricCard label="Menunggu Approval" value={waiting} tone={waiting ? "amber" : "slate"} />
      </div>

      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-4 font-semibold">Riwayat Reimbursement</div>
        <div className="divide-y divide-border">
          {requests.map((request) => (
            <details key={request.id} className="group">
              <summary className="flex cursor-pointer list-none flex-col gap-2 p-4 transition hover:bg-accent/40 sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{request.reimbursementType.name}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{rupiah(request.amount.toString())}</span>
                    <StatusBadge status={request.status} />
                  </div>
                  <div className="mt-0.5 truncate text-sm text-muted-foreground">
                    {request.expenseDate.toISOString().slice(0, 10)}
                    {request.selectedApprover ? ` - Atasan: ${request.selectedApprover.fullName}` : ""}
                    {request.paidAt ? ` - Dibayar ${request.paidAt.toISOString().slice(0, 10)}` : ""}
                  </div>
                </div>
                {request.status === "DRAFT" && (
                  <form action={`/api/my/reimbursement/${request.id}/submit`} method="post" className="shrink-0">
                    <button className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                      <Send className="h-3.5 w-3.5" />
                      Submit
                    </button>
                  </form>
                )}
              </summary>
              <div className="space-y-3 border-t border-border/60 bg-muted/30 p-4">
                <div className="text-sm"><span className="font-medium">Keterangan:</span> {request.description}</div>
                {request.attachmentFileId && (
                  <a
                    href={`/api/files/${request.attachmentFileId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    <Paperclip className="h-4 w-4" />
                    Lihat bukti
                  </a>
                )}
                {request.approvalRequest?.steps.length ? (
                  <ApprovalTimeline steps={request.approvalRequest.steps} />
                ) : (
                  <div className="text-sm text-muted-foreground">Belum disubmit untuk approval.</div>
                )}
              </div>
            </details>
          ))}
          {!requests.length && (
            <div className="p-10 text-center text-sm text-muted-foreground">Belum ada pengajuan reimbursement.</div>
          )}
        </div>
      </section>
    </div>
  );
}
