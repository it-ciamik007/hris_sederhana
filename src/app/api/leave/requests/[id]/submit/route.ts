import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { submitLeaveRequest } from "@/server/services/leave.service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });

  const { id } = await params;
  try {
    await submitLeaveRequest(id);
    return NextResponse.redirect(new URL("/leave/requests", request.url));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Submit leave request failed" },
      { status: 400 }
    );
  }
}
