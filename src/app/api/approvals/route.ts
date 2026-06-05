import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const data = await db.approvalRequest.findMany({
    include: { steps: true },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  return NextResponse.json({ data });
}
