import Link from "next/link";
import { ClipboardCheck, FileSpreadsheet, Search, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/layout/empty-state";
import { MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";

const pageSize = 10;

export default async function AttendanceImportPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status ?? "";
  const page = Math.max(Number(params.page ?? 1), 1);
  const where = {
    ...(status ? { status } : {})
  };

  const [company, batches, total, rawLogs, dailyRows] = await Promise.all([
    db.company.findFirst(),
    db.attendanceImportBatch.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    db.attendanceImportBatch.count({ where }),
    db.attendanceRawLog.count(),
    db.attendanceDaily.count()
  ]);
  const lastPage = Math.max(Math.ceil(total / pageSize), 1);

  const makeHref = (next: Record<string, string | number | undefined>) => {
    const query = new URLSearchParams();
    Object.entries({ q, status, page, ...next }).forEach(([key, value]) => {
      if (value) query.set(key, String(value));
    });
    return `/attendance/import?${query.toString()}`;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={<><ClipboardCheck className="h-4 w-4" />Attendance Operations</>}
        title="Import & Normalisasi Absensi"
        description="Mulai dari list batch import, simpan raw log permanen, lalu worker menormalisasi ke attendance daily."
        action={
          <form action="/api/attendance/import" method="post" encType="multipart/form-data" className="flex flex-col gap-2 rounded-xl border bg-white p-3 shadow-sm sm:flex-row sm:items-center">
            <input type="hidden" name="companyId" value={company?.id ?? ""} />
            <input name="file" type="file" accept=".xlsx,.xls,.csv" required className="max-w-64 text-sm" />
            <Button type="submit"><UploadCloud className="h-4 w-4" />Import</Button>
          </form>
        }
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Batch Import" value={total} tone="cyan" />
        <MetricCard label="Raw Logs" value={rawLogs} tone="slate" />
        <MetricCard label="Daily Rows" value={dailyRows} tone="emerald" />
        <MetricCard label="Errors" value={batches.reduce((sum, batch) => sum + batch.errorRows, 0)} tone="rose" />
      </div>

      <section className="rounded-2xl border bg-white shadow-sm">
        <form className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="q" defaultValue={q} placeholder="Cari batch atau file" className="h-10 w-full rounded-lg border bg-slate-50 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-cyan-100" />
          </div>
          <select name="status" defaultValue={status} className="h-10 rounded-lg border bg-slate-50 px-3 text-sm">
            <option value="">Semua status</option>
            <option value="UPLOADED">Uploaded</option>
            <option value="PROCESSING">Processing</option>
            <option value="IMPORTED">Imported</option>
            <option value="FAILED">Failed</option>
          </select>
          <button className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white">Filter</button>
        </form>

        {batches.length ? (
          <>
            <div className="overflow-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Batch</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Imported</th>
                    <th className="px-4 py-3">Error</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch) => (
                    <tr key={batch.id} className="border-t transition hover:bg-cyan-50/40">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{batch.id}</td>
                      <td className="px-4 py-3">{batch.createdAt.toISOString().slice(0, 10)}</td>
                      <td className="px-4 py-3">{batch.totalRows}</td>
                      <td className="px-4 py-3">{batch.importedRows}</td>
                      <td className="px-4 py-3">{batch.errorRows}</td>
                      <td className="px-4 py-3"><StatusBadge status={batch.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col justify-between gap-3 border-t px-4 py-3 text-sm text-slate-500 md:flex-row md:items-center">
              <div>Menampilkan {(page - 1) * pageSize + 1}-{(page - 1) * pageSize + batches.length} dari {total}</div>
              <div className="flex items-center gap-2">
                <Link href={makeHref({ page: Math.max(page - 1, 1) })} className={`rounded-lg border px-3 py-1.5 ${page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-slate-50"}`}>Sebelumnya</Link>
                <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-slate-900">{page} / {lastPage}</span>
                <Link href={makeHref({ page: Math.min(page + 1, lastPage) })} className={`rounded-lg border px-3 py-1.5 ${page >= lastPage ? "pointer-events-none opacity-50" : "hover:bg-slate-50"}`}>Berikutnya</Link>
              </div>
            </div>
          </>
        ) : (
          <div className="p-4">
            <EmptyState icon={FileSpreadsheet} title="Belum ada batch import" description="Upload file Excel fingerprint untuk mulai mengisi raw attendance log." />
          </div>
        )}
      </section>
    </div>
  );
}
