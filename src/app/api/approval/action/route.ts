import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { approveStep, rejectStep, validateApprovalToken } from "@/server/services/approval.service";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return NextResponse.json({ message: "Token required" }, { status: 400 });

  try {
    const result = await runApprovalToken(token);
    return new Response(
      `<!doctype html><html><head><meta charset="utf-8"><title>Approval ${result.action}</title></head><body style="font-family:Arial,sans-serif;padding:32px;background:#f8fafc;color:#0f172a"><main style="max-width:560px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px"><h1 style="margin-top:0">Approval ${result.action === "approve" ? "disetujui" : "ditolak"}</h1><p>Aksi token berhasil diproses. Anda dapat menutup halaman ini.</p></main></body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Invalid token" }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  try {
    return NextResponse.json(await runApprovalToken(body.token, body.note));
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Invalid token" }, { status: 400 });
  }
}

async function runApprovalToken(token: string, note?: string) {
  const approvalToken = await validateApprovalToken(token);
  if (approvalToken.action === "approve") {
    await approveStep(approvalToken.approvalRequestId, approvalToken.stepId, undefined, note);
  } else {
    await rejectStep(approvalToken.approvalRequestId, approvalToken.stepId, undefined, note);
  }
  await db.approvalToken.update({ where: { id: approvalToken.id }, data: { usedAt: new Date() } });
  return { success: true, action: approvalToken.action };
}
