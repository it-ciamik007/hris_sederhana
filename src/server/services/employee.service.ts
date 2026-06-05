import { z } from "zod";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { validateNik } from "@/server/services/nik.service";
import { audit } from "@/server/services/audit.service";
import { ensureEmployeeLeaveBalances } from "@/server/services/leave-balance.service";

export const employeeCreateSchema = z.object({
  companyId: z.string(),
  branchId: z.string().optional(),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  supervisorId: z.string().optional(),
  employeeNumber: z.string().min(1),
  fullName: z.string().min(2),
  nik: z.string().length(16).optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  birthDate: z.string().optional(),
  whatsappNumber: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  joinDate: z.string()
});

export async function listEmployees({ page = 1, q = "" }: { page?: number; q?: string }) {
  const take = 20;
  const skip = (page - 1) * take;
  const where = q
    ? {
        OR: [
          { fullName: { contains: q } },
          { employeeNumber: { contains: q } },
          { nik: { contains: q } }
        ]
      }
    : {};

  const [data, total] = await Promise.all([
    db.employee.findMany({
      where,
      include: { department: true, position: true },
      orderBy: { createdAt: "desc" },
      skip,
      take
    }),
    db.employee.count({ where })
  ]);

  return { data, pagination: { page, take, total, lastPage: Math.ceil(total / take) } };
}

export async function createEmployee(input: unknown, userId?: string) {
  const data = employeeCreateSchema.parse(input);

  if (data.nik) {
    const nikResult = await validateNik({
      nik: data.nik,
      birthDate: data.birthDate,
      gender: data.gender,
      companyId: data.companyId
    });
    if (nikResult.status !== "STRUCTURE_VALID") {
      throw new Error(`NIK validation failed: ${nikResult.status}`);
    }
  }

  const employee = await db.employee.create({
    data: {
      ...data,
      birthDate: data.birthDate ? new Date(`${data.birthDate}T00:00:00`) : undefined,
      joinDate: new Date(`${data.joinDate}T00:00:00`)
    }
  });
  await ensureEmployeeLeaveBalances(employee.id, employee.companyId);

  await audit({
    companyId: employee.companyId,
    userId,
    employeeId: employee.id,
    module: "employee",
    action: "create",
    referenceId: employee.id,
    newData: employee
  });

  return employee;
}

function value(row: Record<string, unknown>, keys: string[]) {
  const normalized = Object.fromEntries(
    Object.entries(row).map(([key, cell]) => [key.toLowerCase().replace(/[\s-]+/g, "_"), cell])
  );
  for (const key of keys) {
    const found = normalized[key];
    if (found !== undefined && found !== null && String(found).trim() !== "") return String(found).trim();
  }
  return "";
}

function excelDate(input: unknown, fallback?: Date) {
  if (input instanceof Date && !Number.isNaN(input.getTime())) return input;
  if (typeof input === "number") {
    const parsed = XLSX.SSF.parse_date_code(input);
    if (parsed) return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
  }
  const text = String(input ?? "").trim();
  if (!text) return fallback;
  const normalized = text.includes("/") ? text.split("/").reverse().join("-") : text;
  const date = new Date(`${normalized.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

async function findOrCreateDepartment(companyId: string, name: string) {
  if (!name) return null;
  return (
    (await db.department.findFirst({ where: { companyId, name } })) ??
    (await db.department.create({ data: { companyId, name } }))
  );
}

async function findOrCreatePosition(companyId: string, name: string) {
  if (!name) return null;
  return (
    (await db.position.findFirst({ where: { companyId, name } })) ??
    (await db.position.create({ data: { companyId, name } }))
  );
}

async function findOrCreateBranch(companyId: string, name: string) {
  if (!name) return null;
  return (
    (await db.branch.findFirst({ where: { companyId, name } })) ??
    (await db.branch.create({ data: { companyId, name } }))
  );
}

export async function importEmployeesFromExcel(companyId: string, file: ArrayBuffer, userId?: string) {
  const workbook = XLSX.read(file, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const result = { total: rows.length, imported: 0, updated: 0, errors: [] as Array<{ row: number; message: string }> };
  const supervisorLinks: Array<{ employeeId: string; supervisorNumber: string }> = [];

  for (const [index, row] of rows.entries()) {
    try {
      const employeeNumber = value(row, ["employee_number", "nomor_karyawan", "nomor", "nik_karyawan"]);
      const fullName = value(row, ["full_name", "nama", "nama_lengkap"]);
      if (!employeeNumber || !fullName) throw new Error("employee_number/nomor_karyawan dan full_name/nama wajib diisi.");

      const branch = await findOrCreateBranch(companyId, value(row, ["branch", "cabang"]));
      const department = await findOrCreateDepartment(companyId, value(row, ["department", "departemen"]));
      const position = await findOrCreatePosition(companyId, value(row, ["position", "jabatan"]));
      const joinDate = excelDate(row.join_date ?? row["Join Date"] ?? row.tanggal_masuk, new Date()) ?? new Date();
      const birthDate = excelDate(row.birth_date ?? row["Birth Date"] ?? row.tanggal_lahir);
      const resignedDate = excelDate(row.resigned_date ?? row["Resigned Date"] ?? row.tanggal_resign);
      const existing = await db.employee.findUnique({ where: { companyId_employeeNumber: { companyId, employeeNumber } } });

      const employee = await db.employee.upsert({
        where: { companyId_employeeNumber: { companyId, employeeNumber } },
        update: {
          fullName,
          branchId: branch?.id,
          departmentId: department?.id,
          positionId: position?.id,
          nik: value(row, ["nik"]) || null,
          gender: value(row, ["gender", "jenis_kelamin"]) || null,
          birthPlace: value(row, ["birth_place", "tempat_lahir"]) || null,
          birthDate,
          phone: value(row, ["phone", "telepon"]) || null,
          whatsappNumber: value(row, ["whatsapp_number", "whatsapp", "wa"]) || null,
          email: value(row, ["email"]) || null,
          address: value(row, ["address", "alamat"]) || null,
          joinDate,
          resignedDate,
          employmentStatus: value(row, ["employment_status", "status"]) || "ACTIVE",
          bankName: value(row, ["bank_name", "bank"]) || null,
          bankAccountNumber: value(row, ["bank_account_number", "nomor_rekening"]) || null,
          npwp: value(row, ["npwp"]) || null,
          bpjsKesehatan: value(row, ["bpjs_kesehatan"]) || null,
          bpjsKetenagakerjaan: value(row, ["bpjs_ketenagakerjaan"]) || null,
          fingerprintUserId: value(row, ["fingerprint_user_id", "pin_absen", "fingerprint"]) || null
        },
        create: {
          companyId,
          employeeNumber,
          fullName,
          branchId: branch?.id,
          departmentId: department?.id,
          positionId: position?.id,
          nik: value(row, ["nik"]) || null,
          gender: value(row, ["gender", "jenis_kelamin"]) || null,
          birthPlace: value(row, ["birth_place", "tempat_lahir"]) || null,
          birthDate,
          phone: value(row, ["phone", "telepon"]) || null,
          whatsappNumber: value(row, ["whatsapp_number", "whatsapp", "wa"]) || null,
          email: value(row, ["email"]) || null,
          address: value(row, ["address", "alamat"]) || null,
          joinDate,
          resignedDate,
          employmentStatus: value(row, ["employment_status", "status"]) || "ACTIVE",
          bankName: value(row, ["bank_name", "bank"]) || null,
          bankAccountNumber: value(row, ["bank_account_number", "nomor_rekening"]) || null,
          npwp: value(row, ["npwp"]) || null,
          bpjsKesehatan: value(row, ["bpjs_kesehatan"]) || null,
          bpjsKetenagakerjaan: value(row, ["bpjs_ketenagakerjaan"]) || null,
          fingerprintUserId: value(row, ["fingerprint_user_id", "pin_absen", "fingerprint"]) || null
        }
      });

      const supervisorNumber = value(row, ["supervisor_employee_number", "atasan_nomor", "nomor_atasan"]);
      if (supervisorNumber) supervisorLinks.push({ employeeId: employee.id, supervisorNumber });
      await ensureEmployeeLeaveBalances(employee.id, companyId);
      if (existing) result.updated += 1;
      else result.imported += 1;
    } catch (error) {
      result.errors.push({ row: index + 2, message: error instanceof Error ? error.message : "Import row failed" });
    }
  }

  for (const link of supervisorLinks) {
    const supervisor = await db.employee.findUnique({
      where: { companyId_employeeNumber: { companyId, employeeNumber: link.supervisorNumber } }
    });
    if (supervisor) {
      await db.employee.update({ where: { id: link.employeeId }, data: { supervisorId: supervisor.id } });
    }
  }

  await audit({ companyId, userId, module: "employee", action: "import_excel", newData: result });
  return result;
}

export async function exportEmployeesToExcel(companyId?: string) {
  const employees = await db.employee.findMany({
    where: companyId ? { companyId } : {},
    include: { branch: true, department: true, position: true, supervisor: true },
    orderBy: { employeeNumber: "asc" }
  });
  const rows = employees.map((employee) => ({
    employee_number: employee.employeeNumber,
    full_name: employee.fullName,
    nik: employee.nik ?? "",
    gender: employee.gender ?? "",
    birth_place: employee.birthPlace ?? "",
    birth_date: employee.birthDate?.toISOString().slice(0, 10) ?? "",
    phone: employee.phone ?? "",
    whatsapp_number: employee.whatsappNumber ?? "",
    email: employee.email ?? "",
    address: employee.address ?? "",
    join_date: employee.joinDate.toISOString().slice(0, 10),
    resigned_date: employee.resignedDate?.toISOString().slice(0, 10) ?? "",
    employment_status: employee.employmentStatus,
    branch: employee.branch?.name ?? "",
    department: employee.department?.name ?? "",
    position: employee.position?.name ?? "",
    supervisor_employee_number: employee.supervisor?.employeeNumber ?? "",
    bank_name: employee.bankName ?? "",
    bank_account_number: employee.bankAccountNumber ?? "",
    npwp: employee.npwp ?? "",
    bpjs_kesehatan: employee.bpjsKesehatan ?? "",
    bpjs_ketenagakerjaan: employee.bpjsKetenagakerjaan ?? "",
    fingerprint_user_id: employee.fingerprintUserId ?? ""
  }));
  const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{
    employee_number: "",
    full_name: "",
    join_date: "",
    whatsapp_number: "",
    department: "",
    position: ""
  }]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "employees");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
