import Link from "next/link";
import { CheckCircle2, Paperclip, ReceiptText, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/layout/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const pageSize = 15;

function rupiah(value: number | string) {
  return `Rp ${Number(value).toLocaleString("id-ID")}`;
}

export default async function ReimbursementPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; paid?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const canPay = session ? session.roles.includes("SUPER_ADMIN") || session.permissions.includes("payroll.process") : false;
  const page = Math.max(Number(params.page ?? 1), 1);
  const q = params.q?.trim() ?? "";
  const status = params.status ?? "";

  const where = {
    ...(status ? { status } : {}),
    ...(q ? { employee: { fullName: { contains: q } } } : {})
  };

  const [requests, total, totals, waitingPayment] = await Promise.all([
    db.reimbursementRequest.findMany({
      where,
      include: { employee: true, reimbursementType: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    db.reimbursementRequest.count({ where }),
    db.reimbursementRequest.aggregate({ where, _sum: { amount: true } }),
    db.reimbursementRequest.count({ where: { status: "APPROVED" } })
  ]);
  const lastPage = Math.max(Math.ceil(total / pageSize), 1);

  const makeHref = (next: Record<string, string | number | undefined>) => {
    const query = new URLSearchParams();
    Object.entries({ q, status, page, ...next }).forEach(([key, value]) => {
      if (value) query.set(key, String(value));
    });
    return `/reimbursement?${query.toString()}`;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={<><ReceiptText className="h-4 w-4" />Reimbursement</>}
        title="Reimbursement"
        description="Semua pengajuan reimbursement. Tandai pembayaran setelah dana ditransfer."
      />

      {params.paid && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-300/60 bg-emerald-50 p-3 text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
          <CheckCircle2 className="h-4 w-4" />
          Pembayaran berhasil ditandai.
        </div>
      )}

      <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Hasil Filter" value={total} tone="slate" />
        <MetricCard label="Nominal (Filter)" value={rupiah(Number(totals._sum.amount ?? 0))} tone="cyan" />
        <MetricCard label="Menunggu Pembayaran" value={waitingPayment} tone={waitingPayment ? "amber" : "slate"} />
      </div>

      <section className="rounded-xl border border-border bg-card shadow-sm">
        <form className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Cari nama karyawan"
              className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm"
            />
          </div>
          <select name="status" defaultValue={status} className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
            <option value="">Semua status</option>
            <option value="DRAFT">Draft</option>
            <option value="WAITING_APPROVAL">Waiting Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="PAID">Paid</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <button className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Terapkan
          </button>
        </form>

        {/* Desktop table */}
        <div className="hidden overflow-auto md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Karyawan</th>
                <th className="px-4 py-3">Tipe</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Nominal</th>
                <th className="px-4 py-3">Bukti</th>
                <th className="px-4 py-3">Status</th>
                {canPay && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-t border-border transition hover:bg-accent/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{request.employee.fullName}</div>
                    <div className="text-xs text-muted-foreground">{request.employee.employeeNumber}</div>
                  </td>
                  <td className="px-4 py-3">{request.reimbursementType.name}</td>
                  <td className="px-4 py-3">{request.expenseDate.toISOString().slice(0, 10)}</td>
                  <td className="px-4 py-3 font-medium">{rupiah(request.amount.toString())}</td>
                  <td className="px-4 py-3">
                    {request.attachmentFileId ? (
                      <a href={`/api/files/${request.attachmentFileId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                        <Paperclip className="h-3.5 w-3.5" />
                        Lihat
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={request.status} /></td>
                  {canPay && (
                    <td className="px-4 py-3 text-right">
                      {request.status === "APPROVED" && (
                        <form action={`/api/reimbursement/${request.id}/pay`} method="post">
                          <button className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
                            Tandai Dibayar
                          </button>
                        </form>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {!requests.length && (
                <tr>
                  <td colSpan={canPay ? 7 : 6} className="px-4 py-12 text-center text-muted-foreground">Belum ada reimbursement yang cocok.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="divide-y divide-border md:hidden">
          {requests.map((request) => (
            <div key={request.id} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">{request.employee.fullName}</div>
                <StatusBadge status={request.status} />
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {request.reimbursementType.name} - {rupiah(request.amount.toString())} - {request.expenseDate.toISOString().slice(0, 10)}
              </div>
              <div className="mt-2 flex items-center gap-3">
                {request.attachmentFileId && (
                  <a href={`/api/files/${request.attachmentFileId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    <Paperclip className="h-3.5 w-3.5" />
                    Bukti
                  </a>
                )}
                {canPay && request.status === "APPROVED" && (
                  <form action={`/api/reimbursement/${request.id}/pay`} method="post">
                    <button className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
                      Tandai Dibayar
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
          {!requests.length && <div className="p-10 text-center text-sm text-muted-foreground">Belum ada reimbursement yang cocok.</div>}
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground md:flex-row md:items-center">
          <div>Halaman {page} dari {lastPage} ({total} data)</div>
          <div className="flex items-center gap-2">
            <Link href={makeHref({ page: Math.max(page - 1, 1) })} className={`rounded-md border border-border px-3 py-1.5 ${page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-accent"}`}>
              Sebelumnya
            </Link>
            <Link href={makeHref({ page: Math.min(page + 1, lastPage) })} className={`rounded-md border border-border px-3 py-1.5 ${page >= lastPage ? "pointer-events-none opacity-50" : "hover:bg-accent"}`}>
              Berikutnya
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
