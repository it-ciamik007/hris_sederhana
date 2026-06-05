import Link from "next/link";
import { Clock3, FileCheck2, Search, ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import { MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";

const pageSize = 10;

export default async function ApprovalsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string; module?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status ?? "";
  const moduleFilter = params.module ?? "";
  const page = Math.max(Number(params.page ?? 1), 1);
  const where = {
    ...(status ? { status } : {}),
    ...(moduleFilter ? { module: moduleFilter } : {}),
    ...(q ? { OR: [{ referenceId: { contains: q } }, { module: { contains: q } }] } : {})
  };

  const [approvals, total, pending, approved, rejected] = await Promise.all([
    db.approvalRequest.findMany({
      where,
      include: { steps: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    db.approvalRequest.count({ where }),
    db.approvalRequest.count({ where: { status: { in: ["SUBMITTED", "IN_PROGRESS"] } } }),
    db.approvalRequest.count({ where: { status: "APPROVED" } }),
    db.approvalRequest.count({ where: { status: "REJECTED" } })
  ]);
  const lastPage = Math.max(Math.ceil(total / pageSize), 1);

  const makeHref = (next: Record<string, string | number | undefined>) => {
    const query = new URLSearchParams();
    Object.entries({ q, status, module: moduleFilter, page, ...next }).forEach(([key, value]) => {
      if (value) query.set(key, String(value));
    });
    return `/approvals?${query.toString()}`;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={<><ShieldCheck className="h-4 w-4" />Approval Center</>}
        title="Approval Requests"
        description="Semua approval generic dari cuti, koreksi absensi, lembur, reimbursement, payroll adjustment, dan modul lain."
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Total hasil" value={total} tone="slate" />
        <MetricCard label="Menunggu" value={pending} tone="amber" />
        <MetricCard label="Disetujui" value={approved} tone="emerald" />
        <MetricCard label="Ditolak" value={rejected} tone="rose" />
      </div>

      <section className="rounded-2xl border bg-white shadow-sm">
        <form className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Cari module atau reference id"
              className="h-10 w-full rounded-lg border bg-slate-50 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-cyan-100"
            />
          </div>
          <select name="module" defaultValue={moduleFilter} className="h-10 rounded-lg border bg-slate-50 px-3 text-sm">
            <option value="">Semua modul</option>
            <option value="leave">Leave</option>
            <option value="attendance">Attendance</option>
            <option value="overtime">Overtime</option>
            <option value="reimbursement">Reimbursement</option>
            <option value="payroll">Payroll</option>
          </select>
          <select name="status" defaultValue={status} className="h-10 rounded-lg border bg-slate-50 px-3 text-sm">
            <option value="">Semua status</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <button className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white">Filter</button>
        </form>

        {approvals.length ? (
          <>
            <div className="overflow-auto">
              <table className="w-full min-w-[920px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Module</th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Current step</th>
                    <th className="px-4 py-3">Timeline</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {approvals.map((approval) => (
                    <tr key={approval.id} className="border-t transition hover:bg-cyan-50/40">
                      <td className="px-4 py-3 font-semibold capitalize">{approval.module}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{approval.referenceId}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                          <Clock3 className="h-3.5 w-3.5" />
                          Step {approval.currentStepNo}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {approval.steps.map((step) => (
                            <span key={step.id} className="rounded-md border bg-white px-2 py-1 text-xs">
                              {step.stepNo}. {step.approverType} - {step.status}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={approval.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col justify-between gap-3 border-t px-4 py-3 text-sm text-slate-500 md:flex-row md:items-center">
              <div>Menampilkan {(page - 1) * pageSize + 1}-{(page - 1) * pageSize + approvals.length} dari {total}</div>
              <div className="flex items-center gap-2">
                <Link href={makeHref({ page: Math.max(page - 1, 1) })} className={`rounded-lg border px-3 py-1.5 ${page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-slate-50"}`}>Sebelumnya</Link>
                <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-slate-900">{page} / {lastPage}</span>
                <Link href={makeHref({ page: Math.min(page + 1, lastPage) })} className={`rounded-lg border px-3 py-1.5 ${page >= lastPage ? "pointer-events-none opacity-50" : "hover:bg-slate-50"}`}>Berikutnya</Link>
              </div>
            </div>
          </>
        ) : (
          <div className="p-4">
            <EmptyState
              icon={FileCheck2}
              title="Belum ada approval"
              description="Approval akan muncul setelah request cuti, koreksi absensi, lembur, reimbursement, atau modul lain disubmit."
              action={<Link href="/leave/requests" className="inline-flex h-10 items-center rounded-lg bg-cyan-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-cyan-700">Buka Leave Request</Link>}
            />
          </div>
        )}
      </section>
    </div>
  );
}
