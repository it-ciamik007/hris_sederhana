import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { markReimbursementPaid } from "@/server/services/reimbursement.service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });

  const canPay = session.roles.includes("SUPER_ADMIN") || session.permissions.includes("payroll.process");
  if (!canPay) {
    return NextResponse.json({ message: "Anda tidak punya izin menandai pembayaran." }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    await markReimbursementPaid(id, session.id);
    return NextResponse.redirect(new URL("/reimbursement?paid=1", request.url), 303);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Gagal menandai pembayaran" },
      { status: 400 }
    );
  }
}
