import { NextResponse } from "next/server";
import { updateEvaluationForm } from "@/server/services/evaluation.service";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const form = await updateEvaluationForm(id, await request.json());
  return NextResponse.json({ success: true, data: form });
}
