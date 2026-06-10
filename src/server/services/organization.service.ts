import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/server/services/audit.service";

export const organizationEntities = ["departments", "positions", "branches", "shifts", "holidays"] as const;
export type OrganizationEntity = (typeof organizationEntities)[number];

const optionalText = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value.trim() : undefined));

const checkbox = z
  .union([z.string(), z.boolean()])
  .optional()
  .transform((value) => value === true || value === "1" || value === "on" || value === "true");

const schemas = {
  departments: z.object({
    name: z.string().trim().min(1, "Nama departemen wajib diisi."),
    parentDepartmentId: optionalText
  }),
  positions: z.object({
    name: z.string().trim().min(1, "Nama posisi wajib diisi."),
    levelOrder: z.coerce.number().int().min(1).default(1),
    isSpvLevel: checkbox,
    isManagerLevel: checkbox,
    isPartnerLevel: checkbox,
    isHrLevel: checkbox
  }),
  branches: z.object({
    name: z.string().trim().min(1, "Nama cabang wajib diisi."),
    address: optionalText,
    latitude: z.coerce.number().min(-90).max(90).optional().or(z.literal("").transform(() => undefined)),
    longitude: z.coerce.number().min(-180).max(180).optional().or(z.literal("").transform(() => undefined))
  }),
  shifts: z.object({
    code: z.string().trim().min(1, "Kode shift wajib diisi."),
    name: z.string().trim().min(1, "Nama shift wajib diisi."),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Jam mulai harus format HH:MM."),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Jam selesai harus format HH:MM."),
    lateToleranceMinutes: z.coerce.number().int().min(0).default(15),
    isDefault: checkbox
  }),
  holidays: z.object({
    holidayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal libur wajib diisi."),
    name: z.string().trim().min(1, "Nama hari libur wajib diisi."),
    isNational: checkbox
  })
} satisfies Record<OrganizationEntity, z.ZodTypeAny>;

export function assertEntity(value: string): OrganizationEntity {
  if (!organizationEntities.includes(value as OrganizationEntity)) {
    throw new Error(`Master data tidak dikenal: ${value}`);
  }
  return value as OrganizationEntity;
}

async function requireCompanyId() {
  const company = await db.company.findFirst();
  if (!company) throw new Error("Data perusahaan belum dibuat.");
  return company.id;
}

export async function createOrganizationEntity(entity: OrganizationEntity, input: unknown, userId?: string) {
  const companyId = await requireCompanyId();
  const data = schemas[entity].parse(input);

  let created: { id: string };
  if (entity === "departments") {
    const parsed = data as z.infer<(typeof schemas)["departments"]>;
    created = await db.department.create({ data: { companyId, name: parsed.name, parentDepartmentId: parsed.parentDepartmentId } });
  } else if (entity === "positions") {
    const parsed = data as z.infer<(typeof schemas)["positions"]>;
    created = await db.position.create({ data: { companyId, ...parsed } });
  } else if (entity === "branches") {
    const parsed = data as z.infer<(typeof schemas)["branches"]>;
    created = await db.branch.create({ data: { companyId, ...parsed } });
  } else if (entity === "shifts") {
    const parsed = data as z.infer<(typeof schemas)["shifts"]>;
    if (parsed.isDefault) {
      await db.shift.updateMany({ where: { companyId }, data: { isDefault: false } });
    }
    created = await db.shift.create({ data: { companyId, ...parsed } });
  } else {
    const parsed = data as z.infer<(typeof schemas)["holidays"]>;
    created = await db.holiday.create({
      data: { companyId, holidayDate: new Date(`${parsed.holidayDate}T00:00:00.000Z`), name: parsed.name, isNational: parsed.isNational }
    });
  }

  await audit({ companyId, userId, module: "organization", action: `create-${entity}`, referenceId: created.id, newData: data });
  return created;
}

export async function updateOrganizationEntity(entity: OrganizationEntity, id: string, input: unknown, userId?: string) {
  const companyId = await requireCompanyId();
  const data = schemas[entity].parse(input);

  if (entity === "departments") {
    const parsed = data as z.infer<(typeof schemas)["departments"]>;
    if (parsed.parentDepartmentId === id) throw new Error("Departemen tidak boleh menjadi induk dirinya sendiri.");
    await db.department.update({ where: { id }, data: { name: parsed.name, parentDepartmentId: parsed.parentDepartmentId ?? null } });
  } else if (entity === "positions") {
    await db.position.update({ where: { id }, data: data as z.infer<(typeof schemas)["positions"]> });
  } else if (entity === "branches") {
    const parsed = data as z.infer<(typeof schemas)["branches"]>;
    await db.branch.update({
      where: { id },
      data: { name: parsed.name, address: parsed.address ?? null, latitude: parsed.latitude ?? null, longitude: parsed.longitude ?? null }
    });
  } else if (entity === "shifts") {
    const parsed = data as z.infer<(typeof schemas)["shifts"]>;
    if (parsed.isDefault) {
      await db.shift.updateMany({ where: { companyId, id: { not: id } }, data: { isDefault: false } });
    }
    await db.shift.update({ where: { id }, data: parsed });
  } else {
    const parsed = data as z.infer<(typeof schemas)["holidays"]>;
    await db.holiday.update({
      where: { id },
      data: { holidayDate: new Date(`${parsed.holidayDate}T00:00:00.000Z`), name: parsed.name, isNational: parsed.isNational }
    });
  }

  await audit({ companyId, userId, module: "organization", action: `update-${entity}`, referenceId: id, newData: data });
}

export async function toggleOrganizationEntity(entity: OrganizationEntity, id: string, isActive: boolean, userId?: string) {
  const companyId = await requireCompanyId();

  if (entity === "departments") {
    await db.department.update({ where: { id }, data: { isActive } });
  } else if (entity === "positions") {
    await db.position.update({ where: { id }, data: { isActive } });
  } else if (entity === "branches") {
    await db.branch.update({ where: { id }, data: { isActive } });
  } else {
    throw new Error("Entitas ini tidak mendukung aktif/nonaktif.");
  }

  await audit({ companyId, userId, module: "organization", action: `toggle-${entity}`, referenceId: id, newData: { isActive } });
}

export async function deleteHoliday(id: string, userId?: string) {
  const companyId = await requireCompanyId();
  await db.holiday.delete({ where: { id } });
  await audit({ companyId, userId, module: "organization", action: "delete-holidays", referenceId: id });
}
