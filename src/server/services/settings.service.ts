import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";

export const whatsappSettingsSchema = z.object({
  baseUrl: z.string().url().default("https://wam.duodinamika.com"),
  apiKey: z.string().optional().default(""),
  instanceId: z.string().optional().default(""),
  pairingPhone: z.string().optional().default(""),
  fallbackApprovalPhone: z.string().optional().default("")
});

export type WhatsAppSettings = z.infer<typeof whatsappSettingsSchema>;

export const defaultsSettingsSchema = z.object({
  companyName: z.string().min(2),
  legalName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  shiftId: z.string().optional(),
  leavePolicyId: z.string().optional(),
  annualQuota: z.coerce.number().min(0).optional(),
  allowNegativeBalance: z.coerce.boolean().optional(),
  excludeWeekends: z.coerce.boolean().optional(),
  excludeHolidays: z.coerce.boolean().optional()
});

export async function getSetting<T>(settingKey: string, fallback: T, companyId?: string | null): Promise<T> {
  const setting = await db.appSetting.findFirst({
    where: {
      settingKey,
      OR: [{ companyId: companyId ?? null }, { companyId: null }]
    },
    orderBy: { companyId: "desc" }
  });
  return (setting?.settingValue as T | undefined) ?? fallback;
}

export async function setSetting(input: {
  settingKey: string;
  settingValue: Prisma.InputJsonValue;
  companyId?: string | null;
  isSecret?: boolean;
}) {
  const existing = await db.appSetting.findFirst({
    where: { companyId: input.companyId ?? null, settingKey: input.settingKey }
  });

  if (existing) {
    return db.appSetting.update({
      where: { id: existing.id },
      data: { settingValue: input.settingValue, isSecret: input.isSecret ?? existing.isSecret }
    });
  }

  return db.appSetting.create({
    data: {
      companyId: input.companyId,
      settingKey: input.settingKey,
      settingValue: input.settingValue,
      isSecret: input.isSecret ?? false
    }
  });
}

export async function getWhatsAppSettings(companyId?: string | null): Promise<WhatsAppSettings> {
  const fromDb = await getSetting<Partial<WhatsAppSettings>>("whatsapp.wam", {}, companyId);
  return whatsappSettingsSchema.parse({
    baseUrl: process.env.WAM_BASE_URL ?? "https://wam.duodinamika.com",
    apiKey: process.env.WAM_API_KEY ?? "",
    instanceId: process.env.WAM_INSTANCE_ID ?? "",
    ...fromDb
  });
}

export async function saveWhatsAppSettings(companyId: string | null, input: unknown) {
  const data = whatsappSettingsSchema.parse(input);
  return setSetting({
    companyId,
    settingKey: "whatsapp.wam",
    settingValue: data,
    isSecret: true
  });
}

export async function saveDefaultSettings(input: unknown) {
  const data = defaultsSettingsSchema.parse(input);
  const company = await db.company.findFirst();
  if (!company) throw new Error("Company default belum ada.");

  return db.$transaction(async (tx) => {
    await tx.company.update({
      where: { id: company.id },
      data: {
        name: data.companyName,
        legalName: data.legalName || null,
        email: data.email || null,
        phone: data.phone || null
      }
    });

    if (data.shiftId) {
      await tx.shift.updateMany({ where: { companyId: company.id }, data: { isDefault: false } });
      await tx.shift.update({ where: { id: data.shiftId }, data: { isDefault: true } });
    }

    if (data.leavePolicyId) {
      await tx.leavePolicy.updateMany({ where: { companyId: company.id }, data: { isDefault: false } });
      await tx.leavePolicy.update({
        where: { id: data.leavePolicyId },
        data: {
          isDefault: true,
          annualQuota: data.annualQuota,
          allowNegativeBalance: data.allowNegativeBalance,
          excludeWeekends: data.excludeWeekends,
          excludeHolidays: data.excludeHolidays
        }
      });
    }
  });
}
