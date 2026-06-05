import { db } from "@/lib/db";
import { extractNikParts, nikValidationInputSchema, type NikValidationStatus } from "@/lib/validators/nik";

const knownRegionCodes = new Set(["317101", "317102", "327301", "337201", "357801"]);

export async function validateNik(input: unknown) {
  const parsed = nikValidationInputSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "FORMAT_INVALID" as NikValidationStatus, details: parsed.error.flatten() };
  }

  const { nik, birthDate, gender, companyId } = parsed.data;
  const parts = extractNikParts(nik);
  if (!parts) return { status: "FORMAT_INVALID" as NikValidationStatus };

  if (!knownRegionCodes.has(parts.regionCode)) {
    return { status: "REGION_INVALID" as NikValidationStatus, parts };
  }

  if (birthDate && parts.birthDate !== birthDate) {
    return { status: "BIRTHDATE_MISMATCH" as NikValidationStatus, parts };
  }

  if (gender && parts.gender !== gender) {
    return { status: "GENDER_MISMATCH" as NikValidationStatus, parts };
  }

  if (companyId) {
    const duplicate = await db.employee.findFirst({ where: { companyId, nik } });
    if (duplicate) return { status: "DUPLICATE_INTERNAL" as NikValidationStatus, parts };
  }

  return { status: "STRUCTURE_VALID" as NikValidationStatus, parts };
}
