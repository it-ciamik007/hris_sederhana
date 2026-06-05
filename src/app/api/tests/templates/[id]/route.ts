import { NextResponse } from "next/server";
import { updateTestTemplate } from "@/server/services/test-checker.service";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = await updateTestTemplate(id, await request.json());
  return NextResponse.json({ success: true, data: template });
}
