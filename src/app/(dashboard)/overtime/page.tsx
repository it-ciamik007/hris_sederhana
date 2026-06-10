import Link from "next/link";
import { Search, Timer } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/layout/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";

const pageSize = 15;

export default async function OvertimePage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(Number(params.page ?? 1), 1);
  const q = params.q?.trim() ?? "";
  const status = params.status ?? "";

  const where = {
    ...(status ? { status } : {}),
    ...(q ? { employee: { fullName: { contains: q } } } : {})
  };

  const [requests, total, totals, waitingCount] = await Promise.all([
    db.overtimeRequest.findMany({
      where,
      include: { employee: true, selectedApprover: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    db.overtimeRequest.count({ where }),
    db.overtimeRequest.aggregate({ where, _sum: { durationMinutes: true } }),
    db.overtimeRequest.count({ where: { status: "WAITING_APPROVAL" } })
  ]);
  const lastPage = Math.max(Math.ceil(total / pageSize), 1);
  const totalHours = Math.round(((totals._sum.durationMinutes ?? 0) / 60) * 10) / 10;

  const makeHref = (next: Record<string, string | number | undefined>) => {
    const query = new URLSearchParams();
    Object.entries({ q, status, page, ...next }).forEach(([key, value]) => {
      if (value) query.set(key, String(value));
    });
    return `/overtime?${query.toString()}`;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={<><Timer className="h-4 w-4" />Overtime</>}
        title="Lembur"
        description="Semua pengajuan lembur karyawan. Karyawan mengajukan dari menu Lembur Saya."
      />

      <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Hasil Filter" value={total} tone="slate" />
        <MetricCard label="Total Jam (Filter)" value={`${totalHours} jam`} tone="cyan" />
        <MetricCard label="Menunggu Approval" value={waitingCount} tone={waitingCount ? "amber" : "slate"} />
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
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Jam</th>
                <th className="px-4 py-3">Durasi</th>
                <th className="px-4 py-3">Alasan</th>
                <th className="px-4 py-3">Atasan</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-t border-border transition hover:bg-accent/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{request.employee.fullName}</div>
                    <div className="text-xs text-muted-foreground">{request.employee.employeeNumber}</div>
                  </td>
                  <td className="px-4 py-3">{request.overtimeDate.toISOString().slice(0, 10)}</td>
                  <td className="px-4 py-3">{request.startTime} - {request.endTime}</td>
                  <td className="px-4 py-3">{Math.round((request.durationMinutes / 60) * 10) / 10} jam</td>
                  <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">{request.reason}</td>
                  <td className="px-4 py-3">{request.selectedApprover?.fullName ?? "-"}</td>
                  <td className="px-4 py-3"><StatusBadge status={request.status} /></td>
                </tr>
              ))}
              {!requests.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Belum ada pengajuan lembur yang cocok.</td>
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
                {request.overtimeDate.toISOString().slice(0, 10)} - {request.startTime}-{request.endTime} ({Math.round((request.durationMinutes / 60) * 10) / 10} jam)
              </div>
              <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{request.reason}</div>
            </div>
          ))}
          {!requests.length && <div className="p-10 text-center text-sm text-muted-foreground">Belum ada pengajuan lembur yang cocok.</div>}
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
