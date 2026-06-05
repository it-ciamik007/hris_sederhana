import Link from "next/link";
import { CalendarDays, Filter, Send, Search } from "lucide-react";
import { LeaveRequestDialog } from "@/components/features/leave/leave-request-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAdminRole } from "@/lib/permissions";

const pageSize = 10;

export default async function LeaveRequestsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string; type?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(Number(params.page ?? 1), 1);
  const q = params.q?.trim() ?? "";
  const status = params.status ?? "";
  const type = params.type ?? "";
  const session = await getSession();
  const canChooseEmployee = isAdminRole(session?.roles ?? []);

  const where = {
    ...(!canChooseEmployee && session?.employeeId ? { employeeId: session.employeeId } : {}),
    ...(status ? { status } : {}),
    ...(type ? { leaveTypeId: type } : {}),
    ...(q
      ? {
          OR: [
            { reason: { contains: q } },
            { employee: { fullName: { contains: q } } },
            { leaveType: { name: { contains: q } } }
          ]
        }
      : {})
  };

  const currentYear = new Date().getFullYear();
  const [employees, leaveTypes, requests, total, pendingCount, approvedCount, rejectedCount, myBalances] = await Promise.all([
    db.employee.findMany({ orderBy: { fullName: "asc" }, take: 100 }),
    db.leaveType.findMany({ orderBy: { name: "asc" } }),
    db.leaveRequest.findMany({
      where,
      include: { employee: true, leaveType: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    db.leaveRequest.count({ where }),
    db.leaveRequest.count({ where: { status: { in: ["WAITING_SPV", "WAITING_MANAGER", "WAITING_HRD"] } } }),
    db.leaveRequest.count({ where: { status: "APPROVED" } }),
    db.leaveRequest.count({ where: { status: "REJECTED" } }),
    session?.employeeId
      ? db.leaveBalance.findMany({
          where: { employeeId: session.employeeId, periodYear: currentYear },
          include: { leaveType: true },
          orderBy: { leaveType: { name: "asc" } }
        })
      : Promise.resolve([])
  ]);
  const lastPage = Math.max(Math.ceil(total / pageSize), 1);

  const makeHref = (next: Record<string, string | number | undefined>) => {
    const query = new URLSearchParams();
    Object.entries({ q, status, type, page, ...next }).forEach(([key, value]) => {
      if (value) query.set(key, String(value));
    });
    return `/leave/requests?${query.toString()}`;
  };

  const employeeOptions = employees.map((employee) => ({
    value: employee.id,
    label: employee.fullName,
    description: employee.employeeNumber
  }));
  const currentEmployee = session?.employeeId ? employeeOptions.find((employee) => employee.value === session.employeeId) : null;
  const leaveTypeOptions = leaveTypes.map((leaveType) => ({
    value: leaveType.id,
    label: leaveType.name,
    description: leaveType.code
  }));

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_45%,#ecfeff_100%)] p-5 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-cyan-700">
              <CalendarDays className="h-4 w-4" />
              Leave Management
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Pengajuan Izin/Cuti</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Pantau pengajuan, filter status, dan buat draft izin dari satu layar.
            </p>
          </div>
          <LeaveRequestDialog
            employees={employeeOptions}
            leaveTypes={leaveTypeOptions}
            canChooseEmployee={canChooseEmployee}
            currentEmployee={currentEmployee}
          />
        </div>

        <div className="grid gap-3 p-4 md:grid-cols-4">
          <Metric label="Total hasil" value={total} tone="slate" />
          <Metric label="Menunggu approval" value={pendingCount} tone="amber" />
          <Metric label="Disetujui" value={approvedCount} tone="emerald" />
          <Metric label="Ditolak" value={rejectedCount} tone="rose" />
        </div>
      </section>

      {!!myBalances.length && (
        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-3 text-sm font-semibold text-slate-700">Sisa Cuti {currentYear}</div>
          <div className="grid gap-3 md:grid-cols-3">
            {myBalances.map((balance) => (
              <div key={balance.id} className="rounded-lg border bg-slate-50 p-3">
                <div className="text-sm font-semibold">{balance.leaveType.name}</div>
                <div className="mt-2 text-2xl font-semibold text-cyan-700">{balance.remaining.toString()}</div>
                <div className="text-xs text-muted-foreground">
                  Quota {balance.quota.toString()} - terpakai {balance.used.toString()} hari
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-lg border bg-white shadow-sm">
        <form className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Cari karyawan, tipe izin, atau alasan"
              className="h-10 w-full rounded-md border bg-white pl-9 pr-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring/25"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select name="status" defaultValue={status} className="h-10 min-w-48 rounded-md border bg-white pl-9 pr-8 text-sm shadow-sm">
                <option value="">Semua status</option>
                <option value="DRAFT">Draft</option>
                <option value="WAITING_SPV">Waiting SPV</option>
                <option value="WAITING_MANAGER">Waiting Manager</option>
                <option value="WAITING_HRD">Waiting HRD</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </label>

            <select name="type" defaultValue={type} className="h-10 min-w-48 rounded-md border bg-white px-3 text-sm shadow-sm">
              <option value="">Semua tipe</option>
              {leaveTypes.map((leaveType) => (
                <option key={leaveType.id} value={leaveType.id}>
                  {leaveType.name}
                </option>
              ))}
            </select>

            <button className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-800" type="submit">
              Terapkan
            </button>
          </div>
        </form>

        <div className="overflow-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Karyawan</th>
              <th className="px-4 py-3">Tipe</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Durasi</th>
              <th className="px-4 py-3">Alasan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id} className="border-t transition hover:bg-cyan-50/40">
                <td className="px-4 py-3">
                  <div className="font-medium">{request.employee.fullName}</div>
                  <div className="text-xs text-muted-foreground">{request.employee.employeeNumber}</div>
                </td>
                <td className="px-4 py-3">{request.leaveType.name}</td>
                <td className="px-4 py-3">
                  <div>{request.startDate.toISOString().slice(0, 10)}</div>
                  <div className="text-xs text-muted-foreground">s/d {request.endDate.toISOString().slice(0, 10)}</div>
                </td>
                <td className="px-4 py-3">{request.durationDays.toString()} hari</td>
                <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">{request.reason}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={request.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  {request.status === "DRAFT" && (
                    <form action={`/api/leave/requests/${request.id}/submit`} method="post">
                      <button className="inline-flex h-8 items-center gap-1.5 rounded-md bg-cyan-600 px-3 text-xs font-medium text-white hover:bg-cyan-700">
                        <Send className="h-3.5 w-3.5" />
                        Submit
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {!requests.length && (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center">
                  <div className="text-base font-medium">Belum ada pengajuan yang cocok</div>
                  <p className="mt-1 text-sm text-muted-foreground">Ubah filter atau buat pengajuan baru.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

        <div className="flex flex-col justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground md:flex-row md:items-center">
          <div>
            Menampilkan {requests.length ? (page - 1) * pageSize + 1 : 0}-
            {(page - 1) * pageSize + requests.length} dari {total} data
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={makeHref({ page: Math.max(page - 1, 1) })}
              className={`rounded-md border px-3 py-1.5 ${page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-muted"}`}
            >
              Sebelumnya
            </Link>
            <span className="rounded-md bg-muted px-3 py-1.5 text-foreground">
              {page} / {lastPage}
            </span>
            <Link
              href={makeHref({ page: Math.min(page + 1, lastPage) })}
              className={`rounded-md border px-3 py-1.5 ${page >= lastPage ? "pointer-events-none opacity-50" : "hover:bg-muted"}`}
            >
              Berikutnya
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "slate" | "amber" | "emerald" | "rose" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700"
  };

  return (
    <div className={`rounded-md border p-3 ${tones[tone]}`}>
      <div className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
