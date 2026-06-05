import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { importEmployeesFromExcel } from "@/server/services/employee.service";

export async function POST(request: Request) {
  const session = await getSession();
  const form = await request.formData();
  const file = form.get("file");
  const company = await db.company.findFirst();
  if (!company) return NextResponse.json({ message: "Company default belum ada." }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ message: "File Excel wajib diupload." }, { status: 400 });

  const result = await importEmployeesFromExcel(company.id, await file.arrayBuffer(), session?.id);
  const url = new URL("/employees", request.url);
  url.searchParams.set("imported", String(result.imported));
  url.searchParams.set("updated", String(result.updated));
  url.searchParams.set("errors", String(result.errors.length));
  return NextResponse.redirect(url);
}
