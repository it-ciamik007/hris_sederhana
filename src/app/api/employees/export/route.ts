import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exportEmployeesToExcel } from "@/server/services/employee.service";

export async function GET() {
  const company = await db.company.findFirst();
  const buffer = await exportEmployeesToExcel(company?.id);
  const body = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="employees.xlsx"`
    }
  });
}
