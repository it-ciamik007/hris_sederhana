import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/server/services/audit.service";

const optionalText = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value.trim() : null));

const profileSchema = z.object({
  phone: optionalText,
  whatsappNumber: optionalText,
  email: optionalText,
  address: optionalText,
  bankName: optionalText,
  bankAccountNumber: optionalText
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  if (!session.employeeId) {
    return NextResponse.json({ message: "Akun belum terhubung ke data karyawan." }, { status: 403 });
  }

  try {
    const form = Object.fromEntries(await request.formData());
    const data = profileSchema.parse(form);

    const before = await db.employee.findUnique({
      where: { id: session.employeeId },
      select: { phone: true, whatsappNumber: true, email: true, address: true, bankName: true, bankAccountNumber: true }
    });

    await db.employee.update({ where: { id: session.employeeId }, data });
    await audit({
      userId: session.id,
      employeeId: session.employeeId,
      module: "employee",
      action: "self-update",
      referenceId: session.employeeId,
      oldData: before ?? undefined,
      newData: data
    });

    return NextResponse.redirect(new URL("/my/profile?saved=1", request.url), 303);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Gagal menyimpan profil" },
      { status: 400 }
    );
  }
}
