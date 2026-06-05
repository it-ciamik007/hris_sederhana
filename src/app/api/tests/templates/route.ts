import { NextResponse } from "next/server";
import { createTestTemplate } from "@/server/services/test-checker.service";
import { db } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ data: await db.testTemplate.findMany({ include: { questions: true } }) });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const input = contentType.includes("form")
    ? Object.fromEntries(await request.formData())
    : await request.json();

  const template = await createTestTemplate({
    ...input,
    layoutConfig: input.layoutConfig ?? { paper: "A4", detector: "opencv-js", confidenceThreshold: 0.82 },
    questions: input.questions ?? [
      { number: 1, answerType: input.testType === "NUMBER_GRID" ? "NUMBER" : "MULTIPLE_CHOICE", answerKey: "A", weight: 1 }
    ]
  });

  if (contentType.includes("form")) {
    return NextResponse.redirect(new URL("/tests/templates", request.url));
  }

  return NextResponse.json({ success: true, data: template });
}
