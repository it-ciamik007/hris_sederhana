import { NextResponse } from "next/server";
import { createEvaluationForm } from "@/server/services/evaluation.service";
import { db } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ data: await db.evaluationForm.findMany({ include: { sections: true } }) });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const input = contentType.includes("form")
    ? Object.fromEntries(await request.formData())
    : await request.json();

  const form = await createEvaluationForm({
    ...input,
    isAnonymous: input.isAnonymous === "true" || input.isAnonymous === true
  });

  if (contentType.includes("form")) {
    return NextResponse.redirect(new URL("/evaluations/forms", request.url));
  }

  return NextResponse.json({ success: true, data: form });
}
