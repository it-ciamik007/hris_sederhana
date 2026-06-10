import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/server/services/audit.service";

const numericTypes = ["RATING_1_5", "RATING_1_10", "NUMBER", "MATRIX_RATING"];

export async function POST(request: Request, context: { params: Promise<{ assignmentId: string }> }) {
  const session = await getSession();
  if (!session?.employeeId) {
    return NextResponse.json({ message: "Akun belum terhubung ke data karyawan." }, { status: 403 });
  }

  try {
    const { assignmentId } = await context.params;
    const assignment = await db.evaluationAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        cycle: {
          include: {
            form: { include: { sections: { include: { questions: true } } } }
          }
        }
      }
    });

    if (!assignment) return NextResponse.json({ message: "Penugasan tidak ditemukan." }, { status: 404 });
    if (assignment.evaluatorId !== session.employeeId) {
      return NextResponse.json({ message: "Anda bukan evaluator penugasan ini." }, { status: 403 });
    }
    if (assignment.status === "SUBMITTED") {
      return NextResponse.json({ message: "Penilaian ini sudah disubmit." }, { status: 400 });
    }

    const form = await request.formData();
    const questions = assignment.cycle.form.sections.flatMap((section) => section.questions);

    let weightedSum = 0;
    let weightTotal = 0;
    const responses = questions.map((question) => {
      const values = form.getAll(question.id).map(String).filter(Boolean);
      const value = values.length > 1 ? values : values[0] ?? "";
      let score: number | null = null;
      if (numericTypes.includes(question.answerType) && typeof value === "string" && value !== "") {
        const numeric = Number(value);
        if (!Number.isNaN(numeric)) {
          score = numeric;
          weightedSum += numeric * Number(question.weight);
          weightTotal += Number(question.weight);
        }
      }
      return { questionId: question.id, answerJson: { value } as Prisma.InputJsonValue, score };
    });

    const finalScore = weightTotal > 0 ? Math.round((weightedSum / weightTotal) * 100) / 100 : null;

    await db.$transaction([
      db.evaluationResponse.deleteMany({ where: { assignmentId } }),
      db.evaluationResponse.createMany({
        data: responses.map((response) => ({ assignmentId, ...response }))
      }),
      db.evaluationAssignment.update({
        where: { id: assignmentId },
        data: { status: "SUBMITTED", score: finalScore, submittedAt: new Date() }
      })
    ]);

    await audit({
      userId: session.id,
      employeeId: session.employeeId,
      module: "evaluation",
      action: "submit-assignment",
      referenceId: assignmentId,
      newData: { finalScore }
    });

    return NextResponse.redirect(new URL("/my/evaluations?submitted=1", request.url), 303);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Gagal menyimpan penilaian" },
      { status: 400 }
    );
  }
}
