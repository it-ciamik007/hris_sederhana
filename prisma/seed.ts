import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const roles = [
  "SUPER_ADMIN",
  "HR_ADMIN",
  "HRD",
  "PARTNER",
  "DIRECTOR",
  "MANAGER",
  "SPV",
  "EMPLOYEE",
  "AUDITOR"
];

const permissions = [
  "employee.view",
  "employee.create",
  "employee.update",
  "employee.delete",
  "leave.view",
  "leave.create",
  "leave.approve.spv",
  "leave.approve.manager",
  "leave.approve.hrd",
  "attendance.view",
  "attendance.import",
  "attendance.correct",
  "evaluation.form.create",
  "evaluation.fill",
  "evaluation.result.view",
  "test.template.create",
  "test.check",
  "payroll.process",
  "payroll.view",
  "setting.manage",
  "approval.view",
  "approval.action",
  "whatsapp.manage",
  "document.view",
  "document.upload"
];

const leaveTypes = [
  { code: "CUTI_TAHUNAN", name: "Cuti Tahunan", deductsBalance: true },
  { code: "SAKIT", name: "Sakit", requiresAttachment: true, deductsBalance: false },
  { code: "IZIN_PRIBADI", name: "Izin Pribadi", deductsBalance: false },
  { code: "SETENGAH_HARI", name: "Setengah Hari", deductsBalance: true },
  { code: "PULANG_LEBIH_DULU", name: "Pulang Lebih Dulu", deductsBalance: false },
  { code: "DINAS_LUAR", name: "Dinas Luar", deductsBalance: false },
  { code: "WFH", name: "Work From Home", deductsBalance: false },
  { code: "UNPAID_LEAVE", name: "Unpaid Leave", deductsBalance: false }
];

const templates = [
  {
    code: "LEAVE_APPROVAL_REQUEST",
    body:
      "Halo {approver_name}, ada pengajuan izin dari {employee_name}.\nTipe: {leave_type}\nTanggal: {start_date} s/d {end_date}\nDurasi: {duration}\nAlasan: {reason}\n\nApprove:\n{approve_url}\n\nReject:\n{reject_url}"
  },
  {
    code: "LEAVE_APPROVED",
    body: "Halo {employee_name}, pengajuan izin {leave_type} tanggal {start_date} s/d {end_date} sudah disetujui."
  },
  {
    code: "LEAVE_REJECTED",
    body: "Halo {employee_name}, pengajuan izin {leave_type} tanggal {start_date} s/d {end_date} ditolak. Catatan: {note}"
  },
  {
    code: "ATTENDANCE_CORRECTION_APPROVAL",
    body: "Halo {approver_name}, ada koreksi absensi dari {employee_name}. Silakan review: {approval_url}"
  },
  {
    code: "EVALUATION_ASSIGNMENT",
    body: "Halo {employee_name}, Anda mendapat tugas penilaian karyawan. Buka: {evaluation_url}"
  }
];

async function main() {
  const company =
    (await prisma.company.findFirst({ where: { name: "Perusahaan Default" } })) ??
    (await prisma.company.create({
      data: {
        name: "Perusahaan Default",
        legalName: "PT Perusahaan Default",
        email: "hr@example.com",
        phone: "+6280000000000"
      }
    }));

  const createdPermissions = await Promise.all(
    permissions.map((code) =>
      prisma.permission.upsert({
        where: { companyId_code: { companyId: company.id, code } },
        update: {},
        create: {
          companyId: company.id,
          code,
          module: code.split(".")[0],
          name: code
        }
      })
    )
  );

  const createdRoles = await Promise.all(
    roles.map((code) =>
      prisma.role.upsert({
        where: { companyId_code: { companyId: company.id, code } },
        update: {},
        create: {
          companyId: company.id,
          code,
          name: code.replaceAll("_", " ")
        }
      })
    )
  );

  const superAdminRole = createdRoles.find((role) => role.code === "SUPER_ADMIN");
  if (!superAdminRole) throw new Error("SUPER_ADMIN role was not created");

  await prisma.rolePermission.createMany({
    data: createdPermissions.map((permission) => ({
      roleId: superAdminRole.id,
      permissionId: permission.id
    })),
    skipDuplicates: true
  });

  const passwordHash = await bcrypt.hash("Admin123!", 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { passwordHash, name: "Super Admin", isActive: true },
    create: {
      email: "admin@example.com",
      passwordHash,
      name: "Super Admin",
      isActive: true
    }
  });

  await prisma.userRole.createMany({
    data: [{ userId: superAdmin.id, roleId: superAdminRole.id }],
    skipDuplicates: true
  });

  for (const leaveType of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { companyId_code: { companyId: company.id, code: leaveType.code } },
      update: leaveType,
      create: {
        companyId: company.id,
        ...leaveType
      }
    });
  }

  const existingPolicy = await prisma.leavePolicy.findFirst({
    where: { companyId: company.id, name: "Default Leave Policy" }
  });

  if (!existingPolicy) {
    await prisma.leavePolicy.create({
      data: {
        companyId: company.id,
        name: "Default Leave Policy",
        annualQuota: "16.00",
        allowNegativeBalance: false,
        excludeHolidays: true,
        excludeWeekends: true,
        isDefault: true
      }
    });
  }

  await prisma.shift.upsert({
    where: { companyId_code: { companyId: company.id, code: "REGULAR" } },
    update: {},
    create: {
      companyId: company.id,
      code: "REGULAR",
      name: "Regular",
      startTime: "08:00",
      endTime: "17:00",
      lateToleranceMinutes: 15,
      isDefault: true
    }
  });

  for (const template of templates) {
    await prisma.notificationTemplate.upsert({
      where: {
        companyId_code_channel: {
          companyId: company.id,
          code: template.code,
          channel: "WHATSAPP"
        }
      },
      update: { body: template.body },
      create: {
        companyId: company.id,
        code: template.code,
        channel: "WHATSAPP",
        body: template.body
      }
    });
  }

  await prisma.activityLog.create({
    data: {
      companyId: company.id,
      userId: superAdmin.id,
      module: "seed",
      action: "initial_seed",
      newData: {
        roles: roles.length,
        permissions: permissions.length,
        leaveTypes: leaveTypes.length
      }
    }
  });

  console.log("Seed complete");
  console.log("Login: admin@example.com / Admin123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
