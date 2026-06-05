import { Building2, CalendarClock, Plus, Settings2 } from "lucide-react";
import { MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";

export default async function DefaultsPage() {
  const [company, policies, shifts, leaveTypes] = await Promise.all([
    db.company.findFirst(),
    db.leavePolicy.findMany({ orderBy: { createdAt: "desc" } }),
    db.shift.findMany({ orderBy: { createdAt: "desc" } }),
    db.leaveType.findMany({ orderBy: { name: "asc" } })
  ]);
  const defaultPolicy = policies.find((policy) => policy.isDefault);
  const defaultShift = shifts.find((shift) => shift.isDefault);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={<><Settings2 className="h-4 w-4" />System Defaults</>}
        title="Default Settings"
        description="Konfigurasi bawaan untuk company, shift, leave policy, dan tipe izin."
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Company" value={company?.name ?? "-"} tone="cyan" />
        <MetricCard label="Default Shift" value={defaultShift?.code ?? "-"} tone="slate" />
        <MetricCard label="Annual Quota" value={defaultPolicy?.annualQuota.toString() ?? "-"} tone="emerald" />
        <MetricCard label="Leave Types" value={leaveTypes.length} tone="amber" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <form action="/api/settings/defaults" method="post" className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 font-semibold">
            <Building2 className="h-4 w-4 text-cyan-700" />
            Company Default
          </div>
          <div className="grid gap-3">
            <label className="text-sm font-medium">
              Nama Company
              <Input name="companyName" defaultValue={company?.name ?? ""} required className="mt-1" />
            </label>
            <label className="text-sm font-medium">
              Legal Name
              <Input name="legalName" defaultValue={company?.legalName ?? ""} className="mt-1" />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-medium">
                Email
                <Input name="email" defaultValue={company?.email ?? ""} className="mt-1" />
              </label>
              <label className="text-sm font-medium">
                Phone
                <Input name="phone" defaultValue={company?.phone ?? ""} className="mt-1" />
              </label>
            </div>
            <input type="hidden" name="shiftId" value={defaultShift?.id ?? ""} />
            <input type="hidden" name="leavePolicyId" value={defaultPolicy?.id ?? ""} />
            <input type="hidden" name="annualQuota" value={defaultPolicy?.annualQuota.toString() ?? "16"} />
            <input type="hidden" name="allowNegativeBalance" value={defaultPolicy?.allowNegativeBalance ? "1" : "0"} />
            <input type="hidden" name="excludeWeekends" value={defaultPolicy?.excludeWeekends ? "1" : "0"} />
            <input type="hidden" name="excludeHolidays" value={defaultPolicy?.excludeHolidays ? "1" : "0"} />
            <Button type="submit">Simpan Company</Button>
          </div>
        </form>

        <form action="/api/settings/defaults" method="post" className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 font-semibold">
            <CalendarClock className="h-4 w-4 text-cyan-700" />
            Shift & Leave Policy
          </div>
          <input type="hidden" name="companyName" value={company?.name ?? ""} />
          <input type="hidden" name="legalName" value={company?.legalName ?? ""} />
          <input type="hidden" name="email" value={company?.email ?? ""} />
          <input type="hidden" name="phone" value={company?.phone ?? ""} />
          <div className="grid gap-3">
            <label className="text-sm font-medium">
              Default Shift
              <select name="shiftId" defaultValue={defaultShift?.id ?? ""} className="mt-1 h-10 w-full rounded-lg border bg-white px-3 text-sm">
                {shifts.map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {shift.code} - {shift.name} ({shift.startTime}-{shift.endTime})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Leave Policy
              <select name="leavePolicyId" defaultValue={defaultPolicy?.id ?? ""} className="mt-1 h-10 w-full rounded-lg border bg-white px-3 text-sm">
                {policies.map((policy) => (
                  <option key={policy.id} value={policy.id}>
                    {policy.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Annual Quota
              <Input name="annualQuota" type="number" step="0.5" defaultValue={defaultPolicy?.annualQuota.toString() ?? "16"} className="mt-1" />
            </label>
            <div className="grid gap-2 rounded-lg bg-slate-50 p-3 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="allowNegativeBalance" value="1" defaultChecked={defaultPolicy?.allowNegativeBalance} />
                Allow negative balance
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="excludeWeekends" value="1" defaultChecked={defaultPolicy?.excludeWeekends} />
                Exclude weekends
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="excludeHolidays" value="1" defaultChecked={defaultPolicy?.excludeHolidays} />
                Exclude holidays
              </label>
            </div>
            <Button type="submit">Simpan Policy Default</Button>
          </div>
        </form>
      </div>

      <section className="rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b bg-slate-50/80 p-4 md:flex-row md:items-center">
          <div>
            <div className="font-semibold">Leave Types</div>
            <div className="text-sm text-muted-foreground">Tipe izin yang muncul di form pengajuan.</div>
          </div>
          <StatusBadge status={`${leaveTypes.length} DATA`} />
        </div>

        <form action="/api/settings/leave-types" method="post" className="grid gap-3 border-b p-4 lg:grid-cols-[180px_1fr_repeat(3,auto)_auto] lg:items-end">
          <label className="text-sm font-medium">
            Code
            <Input name="code" placeholder="CUTI_BERSAMA" className="mt-1" required />
          </label>
          <label className="text-sm font-medium">
            Nama
            <Input name="name" placeholder="Cuti Bersama" className="mt-1" required />
          </label>
          <label className="flex items-center gap-2 text-sm lg:pb-2">
            <input type="checkbox" name="requiresAttachment" value="1" />
            Attachment
          </label>
          <label className="flex items-center gap-2 text-sm lg:pb-2">
            <input type="checkbox" name="deductsBalance" value="1" />
            Potong saldo
          </label>
          <label className="flex items-center gap-2 text-sm lg:pb-2">
            <input type="checkbox" name="isActive" value="1" defaultChecked />
            Aktif
          </label>
          <Button type="submit">
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        </form>

        <div className="grid gap-3 p-4">
          {leaveTypes.map((type) => (
            <form
              key={type.id}
              action="/api/settings/leave-types"
              method="post"
              className="grid gap-3 rounded-xl border bg-white p-3 shadow-sm lg:grid-cols-[180px_1fr_repeat(3,auto)_auto] lg:items-center"
            >
              <input type="hidden" name="id" value={type.id} />
              <Input name="code" defaultValue={type.code} className="font-mono text-xs" required />
              <Input name="name" defaultValue={type.name} required />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="requiresAttachment" value="1" defaultChecked={type.requiresAttachment} />
                Attachment
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="deductsBalance" value="1" defaultChecked={type.deductsBalance} />
                Potong saldo
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isActive" value="1" defaultChecked={type.isActive} />
                Aktif
              </label>
              <Button type="submit" variant="secondary">Simpan</Button>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
