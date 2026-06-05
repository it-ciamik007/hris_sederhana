import Link from "next/link";
import { Download, Search, Upload, Users } from "lucide-react";
import { MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";

const pageSize = 10;

export default async function EmployeesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string; imported?: string; updated?: string; errors?: string }> }) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status ?? "";
  const page = Math.max(Number(params.page ?? 1), 1);
  const where = {
    ...(status ? { employmentStatus: status } : {}),
    ...(q
      ? {
          OR: [
            { fullName: { contains: q } },
            { employeeNumber: { contains: q } },
            { nik: { contains: q } }
          ]
        }
      : {})
  };
  const [employees, total, active, probation, resigned] = await Promise.all([
    db.employee.findMany({
      where,
      include: { department: true, position: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    db.employee.count({ where }),
    db.employee.count({ where: { employmentStatus: "ACTIVE" } }),
    db.employee.count({ where: { employmentStatus: "PROBATION" } }),
    db.employee.count({ where: { employmentStatus: "RESIGNED" } })
  ]);
  const lastPage = Math.max(Math.ceil(total / pageSize), 1);
  const makeHref = (next: Record<string, string | number | undefined>) => {
    const query = new URLSearchParams();
    Object.entries({ q, status, page, ...next }).forEach(([key, value]) => {
      if (value) query.set(key, String(value));
    });
    return `/employees?${query.toString()}`;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={<><Users className="h-4 w-4" />Employee Directory</>}
        title="Employees"
        description="Data karyawan, status kerja, struktur organisasi, dokumen, dan data payroll awal."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href="/api/employees/export"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-white px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </a>
            <Link
              href="/employees/create"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-cyan-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-cyan-700"
            >
              Tambah Karyawan
            </Link>
          </div>
        }
      />

      {(params.imported || params.updated || params.errors) && (
        <section className="rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
          Import selesai: {params.imported ?? "0"} baru, {params.updated ?? "0"} update, {params.errors ?? "0"} error.
        </section>
      )}

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Total hasil" value={total} tone="slate" />
        <MetricCard label="Aktif" value={active} tone="emerald" />
        <MetricCard label="Probation" value={probation} tone="amber" />
        <MetricCard label="Resigned" value={resigned} tone="rose" />
      </div>

      <section className="rounded-2xl border bg-white shadow-sm">
        <form action="/api/employees/import" method="post" encType="multipart/form-data" className="flex flex-col gap-3 border-b bg-slate-50/70 p-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Upload className="h-4 w-4 text-cyan-700" />
            Import Excel Karyawan
          </div>
          <input name="file" type="file" accept=".xlsx,.xls,.csv" required className="text-sm" />
          <button className="h-10 rounded-lg bg-cyan-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-cyan-700" type="submit">
            Upload & Import
          </button>
          <a href="/api/employees/export" className="text-sm font-medium text-cyan-700 hover:text-cyan-900">
            Download template
          </a>
        </form>
        <form className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Cari nama, NIK, nomor karyawan"
              className="h-10 w-full rounded-lg border bg-slate-50 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-cyan-100"
            />
          </div>
          <select name="status" defaultValue={status} className="h-10 rounded-lg border bg-slate-50 px-3 text-sm">
            <option value="">Semua status</option>
            <option value="ACTIVE">Active</option>
            <option value="PROBATION">Probation</option>
            <option value="CONTRACT">Contract</option>
            <option value="PERMANENT">Permanent</option>
            <option value="RESIGNED">Resigned</option>
            <option value="TERMINATED">Terminated</option>
          </select>
          <button className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white">Filter</button>
        </form>
        <div className="overflow-auto">
          <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Nomor</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Departemen</th>
              <th className="px-4 py-3">Jabatan</th>
              <th className="px-4 py-3">WhatsApp</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id} className="border-t transition hover:bg-cyan-50/40">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{employee.employeeNumber}</td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{employee.fullName}</div>
                  <div className="text-xs text-slate-500">{employee.email ?? "-"}</div>
                </td>
                <td className="px-4 py-3">{employee.department?.name ?? "-"}</td>
                <td className="px-4 py-3">{employee.position?.name ?? "-"}</td>
                <td className="px-4 py-3">{employee.whatsappNumber ?? "-"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={employee.employmentStatus} />
                </td>
              </tr>
            ))}
            {!employees.length && (
              <tr>
                <td colSpan={6} className="px-4 py-14 text-center text-slate-500">
                  Belum ada data karyawan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
        <div className="flex flex-col justify-between gap-3 border-t px-4 py-3 text-sm text-slate-500 md:flex-row md:items-center">
          <div>Menampilkan {employees.length ? (page - 1) * pageSize + 1 : 0}-{(page - 1) * pageSize + employees.length} dari {total}</div>
          <div className="flex items-center gap-2">
            <Link href={makeHref({ page: Math.max(page - 1, 1) })} className={`rounded-lg border px-3 py-1.5 ${page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-slate-50"}`}>Sebelumnya</Link>
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-slate-900">{page} / {lastPage}</span>
            <Link href={makeHref({ page: Math.min(page + 1, lastPage) })} className={`rounded-lg border px-3 py-1.5 ${page >= lastPage ? "pointer-events-none opacity-50" : "hover:bg-slate-50"}`}>Berikutnya</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
