import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  Download,
  FileSpreadsheet,
  MessageCircle,
  Settings2,
  Upload,
} from "lucide-react";
import { MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const currentYear = new Date().getFullYear();
  const [
    activeEmployees,
    totalEmployees,
    pendingLeave,
    approvedLeave,
    attendanceImports,
    queuedNotifications,
    failedNotifications,
    defaultPolicy,
    leaveBalances,
    recentLeaveRequests,
    recentBatches
  ] = await Promise.all([
    db.employee.count({ where: { employmentStatus: "ACTIVE" } }),
    db.employee.count(),
    db.leaveRequest.count({ where: { status: { in: ["WAITING_SPV", "WAITING_MANAGER", "WAITING_HRD"] } } }),
    db.leaveRequest.count({ where: { status: "APPROVED" } }),
    db.attendanceImportBatch.count(),
    db.notificationQueue.count({ where: { status: "QUEUED" } }),
    db.notificationQueue.count({ where: { status: "FAILED" } }),
    db.leavePolicy.findFirst({ where: { isDefault: true }, orderBy: { createdAt: "desc" } }),
    db.leaveBalance.findMany({
      where: { periodYear: currentYear },
      include: { employee: true, leaveType: true },
      orderBy: { updatedAt: "desc" },
      take: 5
    }),
    db.leaveRequest.findMany({
      include: { employee: true, leaveType: true },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    db.attendanceImportBatch.findMany({ orderBy: { createdAt: "desc" }, take: 4 })
  ]);

  const quickActions = [
    {
      href: "/employees",
      icon: Upload,
      title: "Import Karyawan Excel",
      description: "Upload .xlsx/.csv dan upsert berdasarkan employee_number."
    },
    {
      href: "/api/employees/export",
      icon: Download,
      title: "Export Karyawan",
      description: "Download data/template Excel karyawan."
    },
    {
      href: "/tests/scan",
      icon: FileSpreadsheet,
      title: "Scan Deret Angka",
      description: "Kamera ponsel, OCR, lalu cek pola naik/turun tanpa answer key."
    },
    {
      href: "/settings/defaults",
      icon: Settings2,
      title: "Global Default",
      description: `Quota cuti default ${defaultPolicy?.annualQuota.toString() ?? "16"} hari.`
    }
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={<><BadgeCheck className="h-4 w-4" />HRIS Control Center</>}
        title="Dashboard Operasional HRIS"
        description="Ringkasan live untuk karyawan, cuti, saldo cuti, WhatsApp WAM, import Excel, dan scan OCR."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/leave/requests" className="inline-flex h-10 items-center gap-2 rounded-lg bg-cyan-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-cyan-700">
              <CalendarDays className="h-4 w-4" />
              Pengajuan Cuti
            </Link>
            <Link href="/settings/whatsapp" className="inline-flex h-10 items-center gap-2 rounded-lg border bg-white px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
              <MessageCircle className="h-4 w-4" />
              WAM Settings
            </Link>
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Karyawan Aktif" value={`${activeEmployees}/${totalEmployees}`} tone="emerald" />
        <MetricCard label="Cuti Pending" value={pendingLeave} tone="amber" />
        <MetricCard label="Cuti Approved" value={approvedLeave} tone="cyan" />
        <MetricCard label="WA Queue / Failed" value={`${queuedNotifications}/${failedNotifications}`} tone={failedNotifications ? "rose" : "slate"} />
      </div>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.title} href={action.href} className="rounded-xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-3 font-semibold text-slate-900">{action.title}</div>
              <p className="mt-1 text-sm text-slate-500">{action.description}</p>
            </Link>
          );
        })}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b bg-slate-50/80 p-4">
            <div>
              <div className="font-semibold">Pengajuan Cuti Terbaru</div>
              <div className="text-sm text-muted-foreground">Approval akan mengurangi saldo saat final approved.</div>
            </div>
            <Link href="/leave/requests" className="text-sm font-medium text-cyan-700 hover:text-cyan-900">Lihat semua</Link>
          </div>
          <div className="divide-y">
            {recentLeaveRequests.map((request) => (
              <div key={request.id} className="grid gap-2 p-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="font-medium">{request.employee.fullName}</div>
                  <div className="text-sm text-muted-foreground">
                    {request.leaveType.name} - {request.startDate.toISOString().slice(0, 10)} s/d {request.endDate.toISOString().slice(0, 10)}
                  </div>
                </div>
                <StatusBadge status={request.status} />
              </div>
            ))}
            {!recentLeaveRequests.length && <div className="p-8 text-center text-sm text-muted-foreground">Belum ada pengajuan cuti.</div>}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-xl border bg-white shadow-sm">
            <div className="border-b bg-slate-50/80 p-4">
              <div className="font-semibold">Sisa Cuti {currentYear}</div>
              <div className="text-sm text-muted-foreground">Default global: {defaultPolicy?.annualQuota.toString() ?? "16"} hari.</div>
            </div>
            <div className="divide-y">
              {leaveBalances.map((balance) => (
                <div key={balance.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{balance.employee.fullName}</div>
                    <div className="text-xs text-muted-foreground">{balance.leaveType.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-cyan-700">{balance.remaining.toString()}</div>
                    <div className="text-xs text-muted-foreground">sisa</div>
                  </div>
                </div>
              ))}
              {!leaveBalances.length && <div className="p-8 text-center text-sm text-muted-foreground">Saldo cuti belum terbentuk.</div>}
            </div>
          </section>

          <section className="rounded-xl border bg-white shadow-sm">
            <div className="border-b bg-slate-50/80 p-4">
              <div className="font-semibold">Import Absensi</div>
              <div className="text-sm text-muted-foreground">{attendanceImports} batch tersimpan.</div>
            </div>
            <div className="divide-y">
              {recentBatches.map((batch) => (
                <div key={batch.id} className="flex items-center justify-between p-4 text-sm">
                  <div>
                    <div className="font-medium">{batch.createdAt.toISOString().slice(0, 10)}</div>
                    <div className="text-muted-foreground">{batch.importedRows}/{batch.totalRows} rows</div>
                  </div>
                  <StatusBadge status={batch.status} />
                </div>
              ))}
              {!recentBatches.length && <div className="p-8 text-center text-sm text-muted-foreground">Belum ada batch absensi.</div>}
            </div>
          </section>
        </aside>
      </div>

      <section className="rounded-xl border border-cyan-100 bg-cyan-50 p-4 text-sm text-cyan-900">
        Build aktif harus memuat teks ini: import/export karyawan, scan OCR deret angka, dan saldo cuti default 16. Jika tidak terlihat, browser masih membuka port/build lama.
      </section>
    </div>
  );
}
