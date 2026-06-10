import Link from "next/link";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EntityDialog, type FieldConfig } from "@/components/features/settings/entity-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

const tabs = [
  { key: "departments", label: "Departemen" },
  { key: "positions", label: "Posisi" },
  { key: "branches", label: "Cabang" },
  { key: "shifts", label: "Shift" },
  { key: "holidays", label: "Hari Libur" }
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default async function OrganizationPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams;
  const tab: TabKey = (tabs.find((item) => item.key === params.tab)?.key ?? "departments") as TabKey;

  const [departments, positions, branches, shifts, holidays] = await Promise.all([
    db.department.findMany({ include: { parent: true, _count: { select: { employees: true } } }, orderBy: { name: "asc" } }),
    db.position.findMany({ include: { _count: { select: { employees: true } } }, orderBy: [{ levelOrder: "asc" }, { name: "asc" }] }),
    db.branch.findMany({ include: { _count: { select: { employees: true } } }, orderBy: { name: "asc" } }),
    db.shift.findMany({ orderBy: { code: "asc" } }),
    db.holiday.findMany({ orderBy: { holidayDate: "asc" } })
  ]);

  const departmentFields = (excludeId?: string): FieldConfig[] => [
    { name: "name", label: "Nama Departemen", type: "text", required: true },
    {
      name: "parentDepartmentId",
      label: "Departemen Induk",
      type: "select",
      options: departments.filter((item) => item.id !== excludeId).map((item) => ({ value: item.id, label: item.name }))
    }
  ];
  const positionFields: FieldConfig[] = [
    { name: "name", label: "Nama Posisi", type: "text", required: true },
    { name: "levelOrder", label: "Urutan Level", type: "number", required: true },
    { name: "isSpvLevel", label: "Level Supervisor", type: "checkbox" },
    { name: "isManagerLevel", label: "Level Manager", type: "checkbox" },
    { name: "isPartnerLevel", label: "Level Partner", type: "checkbox" },
    { name: "isHrLevel", label: "Level HR", type: "checkbox" }
  ];
  const branchFields: FieldConfig[] = [
    { name: "name", label: "Nama Cabang", type: "text", required: true },
    { name: "address", label: "Alamat", type: "textarea" },
    { name: "latitude", label: "Latitude", type: "number", step: "0.0000001" },
    { name: "longitude", label: "Longitude", type: "number", step: "0.0000001" }
  ];
  const shiftFields: FieldConfig[] = [
    { name: "code", label: "Kode", type: "text", required: true },
    { name: "name", label: "Nama Shift", type: "text", required: true },
    { name: "startTime", label: "Jam Masuk", type: "time", required: true },
    { name: "endTime", label: "Jam Pulang", type: "time", required: true },
    { name: "lateToleranceMinutes", label: "Toleransi Telat (menit)", type: "number", required: true },
    { name: "isDefault", label: "Jadikan shift default", type: "checkbox" }
  ];
  const holidayFields: FieldConfig[] = [
    { name: "holidayDate", label: "Tanggal", type: "date", required: true },
    { name: "name", label: "Nama Hari Libur", type: "text", required: true },
    { name: "isNational", label: "Libur Nasional", type: "checkbox" }
  ];

  const addConfig: Record<TabKey, { title: string; fields: FieldConfig[] }> = {
    departments: { title: "Tambah Departemen", fields: departmentFields() },
    positions: { title: "Tambah Posisi", fields: positionFields },
    branches: { title: "Tambah Cabang", fields: branchFields },
    shifts: { title: "Tambah Shift", fields: shiftFields },
    holidays: { title: "Tambah Hari Libur", fields: holidayFields }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={<><Building2 className="h-4 w-4" />Master Data</>}
        title="Struktur Organisasi"
        description="Kelola departemen, posisi, cabang, shift kerja, dan hari libur perusahaan."
        action={<EntityDialog entity={tab} title={addConfig[tab].title} triggerLabel={`+ ${addConfig[tab].title}`} fields={addConfig[tab].fields} />}
      />

      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
        {tabs.map((item) => (
          <Link
            key={item.key}
            href={`/settings/organization?tab=${item.key}`}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition",
              tab === item.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-card shadow-sm">
        {tab === "departments" && (
          <Rows
            empty="Belum ada departemen."
            items={departments.map((item) => ({
              id: item.id,
              title: item.name,
              subtitle: item.parent ? `Induk: ${item.parent.name}` : "Tanpa induk",
              meta: `${item._count.employees} karyawan`,
              isActive: item.isActive,
              dialog: (
                <EntityDialog
                  entity="departments"
                  id={item.id}
                  title="Edit Departemen"
                  triggerLabel="Edit"
                  triggerClassName="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                  fields={departmentFields(item.id)}
                  initialValues={{ name: item.name, parentDepartmentId: item.parentDepartmentId ?? "" }}
                />
              ),
              toggle: { entity: "departments", isActive: item.isActive }
            }))}
          />
        )}

        {tab === "positions" && (
          <Rows
            empty="Belum ada posisi."
            items={positions.map((item) => {
              const levels = [
                item.isSpvLevel && "SPV",
                item.isManagerLevel && "Manager",
                item.isPartnerLevel && "Partner",
                item.isHrLevel && "HR"
              ].filter(Boolean);
              return {
                id: item.id,
                title: item.name,
                subtitle: `Level ${item.levelOrder}${levels.length ? ` - ${levels.join(", ")}` : ""}`,
                meta: `${item._count.employees} karyawan`,
                isActive: item.isActive,
                dialog: (
                  <EntityDialog
                    entity="positions"
                    id={item.id}
                    title="Edit Posisi"
                    triggerLabel="Edit"
                    triggerClassName="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                    fields={positionFields}
                    initialValues={{
                      name: item.name,
                      levelOrder: String(item.levelOrder),
                      isSpvLevel: item.isSpvLevel,
                      isManagerLevel: item.isManagerLevel,
                      isPartnerLevel: item.isPartnerLevel,
                      isHrLevel: item.isHrLevel
                    }}
                  />
                ),
                toggle: { entity: "positions", isActive: item.isActive }
              };
            })}
          />
        )}

        {tab === "branches" && (
          <Rows
            empty="Belum ada cabang."
            items={branches.map((item) => ({
              id: item.id,
              title: item.name,
              subtitle: item.address ?? "Alamat belum diisi",
              meta: `${item._count.employees} karyawan`,
              isActive: item.isActive,
              dialog: (
                <EntityDialog
                  entity="branches"
                  id={item.id}
                  title="Edit Cabang"
                  triggerLabel="Edit"
                  triggerClassName="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                  fields={branchFields}
                  initialValues={{
                    name: item.name,
                    address: item.address ?? "",
                    latitude: item.latitude?.toString() ?? "",
                    longitude: item.longitude?.toString() ?? ""
                  }}
                />
              ),
              toggle: { entity: "branches", isActive: item.isActive }
            }))}
          />
        )}

        {tab === "shifts" && (
          <Rows
            empty="Belum ada shift."
            items={shifts.map((item) => ({
              id: item.id,
              title: `${item.code} - ${item.name}`,
              subtitle: `${item.startTime} - ${item.endTime} (toleransi ${item.lateToleranceMinutes} menit)`,
              meta: item.isDefault ? "Default" : "",
              isActive: true,
              dialog: (
                <EntityDialog
                  entity="shifts"
                  id={item.id}
                  title="Edit Shift"
                  triggerLabel="Edit"
                  triggerClassName="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                  fields={shiftFields}
                  initialValues={{
                    code: item.code,
                    name: item.name,
                    startTime: item.startTime,
                    endTime: item.endTime,
                    lateToleranceMinutes: String(item.lateToleranceMinutes),
                    isDefault: item.isDefault
                  }}
                />
              )
            }))}
          />
        )}

        {tab === "holidays" && (
          <Rows
            empty="Belum ada hari libur."
            items={holidays.map((item) => ({
              id: item.id,
              title: item.name,
              subtitle: item.holidayDate.toISOString().slice(0, 10),
              meta: item.isNational ? "Nasional" : "Perusahaan",
              isActive: true,
              dialog: (
                <EntityDialog
                  entity="holidays"
                  id={item.id}
                  title="Edit Hari Libur"
                  triggerLabel="Edit"
                  triggerClassName="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                  fields={holidayFields}
                  initialValues={{
                    holidayDate: item.holidayDate.toISOString().slice(0, 10),
                    name: item.name,
                    isNational: item.isNational
                  }}
                />
              ),
              remove: { entity: "holidays" }
            }))}
          />
        )}
      </section>
    </div>
  );
}

function Rows({
  items,
  empty
}: {
  empty: string;
  items: {
    id: string;
    title: string;
    subtitle: string;
    meta?: string;
    isActive: boolean;
    dialog: React.ReactNode;
    toggle?: { entity: string; isActive: boolean };
    remove?: { entity: string };
  }[];
}) {
  if (!items.length) {
    return <div className="p-10 text-center text-sm text-muted-foreground">{empty}</div>;
  }

  return (
    <div className="divide-y divide-border">
      {items.map((item) => (
        <div key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{item.title}</span>
              {!item.isActive && <StatusBadge status="INACTIVE" />}
              {item.meta && <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{item.meta}</span>}
            </div>
            <div className="mt-0.5 text-sm text-muted-foreground">{item.subtitle}</div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {item.dialog}
            {item.toggle && (
              <form action={`/api/settings/organization/${item.toggle.entity}`} method="post">
                <input type="hidden" name="_action" value="toggle" />
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="isActive" value={item.toggle.isActive ? "0" : "1"} />
                <button className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent">
                  {item.toggle.isActive ? "Nonaktifkan" : "Aktifkan"}
                </button>
              </form>
            )}
            {item.remove && (
              <form action={`/api/settings/organization/${item.remove.entity}`} method="post">
                <input type="hidden" name="_action" value="delete" />
                <input type="hidden" name="id" value={item.id} />
                <button className="rounded-md border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10">
                  Hapus
                </button>
              </form>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
