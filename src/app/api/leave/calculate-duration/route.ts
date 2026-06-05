import { NextResponse } from "next/server";
import { calculateLeaveDuration } from "@/server/services/leave.service";

export async function POST(request: Request) {
  const body = await request.json();
  const duration = await calculateLeaveDuration(body.companyId, body.startDate, body.endDate);
  return NextResponse.json({ duration });
}
