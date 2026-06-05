import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isAdminRole } from "@/lib/permissions";
import { createLeaveRequest, submitLeaveRequest } from "@/server/services/leave.service";

export async function GET() {
  return NextResponse.json({ message: "Use UI for paginated leave requests." });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });

  const contentType = request.headers.get("content-type") ?? "";
  const inputRaw = contentType.includes("form")
    ? Object.fromEntries(await request.formData())
    : await request.json();
  const input = {
    ...inputRaw,
    employeeId: isAdminRole(session.roles) ? inputRaw.employeeId : session.employeeId
  };

  try {
    if (!input.employeeId) throw new Error("User login belum terhubung ke data karyawan.");
    const leave = await createLeaveRequest(input);
    if (inputRaw.intent === "submit") {
      await submitLeaveRequest(leave.id);
    }
    return NextResponse.redirect(new URL("/leave/requests", request.url));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Create leave request failed" },
      { status: 400 }
    );
  }
}
