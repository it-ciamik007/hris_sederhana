import { z } from "zod";

export const nikValidationInputSchema = z.object({
  nik: z.string().regex(/^\d{16}$/),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  companyId: z.string().optional()
});

export type NikValidationStatus =
  | "FORMAT_INVALID"
  | "REGION_INVALID"
  | "BIRTHDATE_MISMATCH"
  | "GENDER_MISMATCH"
  | "DUPLICATE_INTERNAL"
  | "STRUCTURE_VALID"
  | "VERIFIED_EXTERNAL";

export function extractNikParts(nik: string) {
  if (!/^\d{16}$/.test(nik)) return null;
  const regionCode = nik.slice(0, 6);
  const dayRaw = Number(nik.slice(6, 8));
  const month = Number(nik.slice(8, 10));
  const yearSuffix = Number(nik.slice(10, 12));
  const sequence = nik.slice(12, 16);
  const gender = dayRaw > 40 ? "FEMALE" : "MALE";
  const day = gender === "FEMALE" ? dayRaw - 40 : dayRaw;
  const currentYearSuffix = new Date().getFullYear() % 100;
  const fullYear = yearSuffix <= currentYearSuffix ? 2000 + yearSuffix : 1900 + yearSuffix;

  return {
    regionCode,
    birthDate: `${fullYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    gender,
    sequence
  };
}
