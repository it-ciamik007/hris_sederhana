import type { Prisma } from "@prisma/client";
import * as XLSX from "xlsx";
import { z } from "zod";
import { db } from "@/lib/db";

export const testTemplateSchema = z.object({
  companyId: z.string(),
  name: z.string().min(3),
  testType: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "NUMBER_GRID", "MIXED", "ESSAY_SHORT"]),
  layoutConfig: z.record(z.unknown()).default({}),
  questions: z.array(
    z.object({
      number: z.number().int().positive(),
      answerType: z.string(),
      answerKey: z.string().optional(),
      weight: z.coerce.number().default(1)
    })
  )
});

export async function createTestTemplate(input: unknown) {
  const data = testTemplateSchema.parse(input);
  return db.testTemplate.create({
    data: {
      companyId: data.companyId,
      name: data.name,
      testType: data.testType,
      layoutConfig: data.layoutConfig as Prisma.InputJsonObject,
      questions: {
        create: data.questions
      }
    },
    include: { questions: true }
  });
}

export async function updateTestTemplate(id: string, input: unknown) {
  const data = testTemplateSchema.parse(input);
  return db.$transaction(async (tx) => {
    await tx.testQuestion.deleteMany({ where: { templateId: id } });
    return tx.testTemplate.update({
      where: { id },
      data: {
        name: data.name,
        testType: data.testType,
        layoutConfig: data.layoutConfig as Prisma.InputJsonObject,
        questions: {
          create: data.questions
        }
      },
      include: { questions: true }
    });
  });
}

function normalizeKey(key: string) {
  return key.toLowerCase().replace(/[\s-]+/g, "_");
}

function cell(row: Record<string, unknown>, keys: string[]) {
  const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [normalizeKey(key), value]));
  for (const key of keys) {
    const value = normalized[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return String(value).trim();
  }
  return "";
}

export async function processUploadedScan(input: { templateId: string; file: ArrayBuffer }) {
  const template = await db.testTemplate.findUnique({
    where: { id: input.templateId },
    include: { questions: { orderBy: { number: "asc" } } }
  });
  if (!template) throw new Error("Template tes tidak ditemukan.");

  const workbook = XLSX.read(input.file, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const answerKey = new Map(template.questions.map((question) => [question.number, String(question.answerKey ?? "").trim().toUpperCase()]));
  const weights = new Map(template.questions.map((question) => [question.number, Number(question.weight)]));

  const participants = rows.map((row, index) => {
    const participantName = cell(row, ["name", "nama", "participant", "peserta"]) || `Peserta ${index + 1}`;
    const numberColumn = Number(cell(row, ["number", "no", "nomor", "soal"]));
    const rowAnswers = new Map<number, string>();

    if (numberColumn) {
      rowAnswers.set(numberColumn, cell(row, ["answer", "jawaban", "detected", "hasil"]).toUpperCase());
    } else {
      for (const question of template.questions) {
        const direct = row[String(question.number)] ?? row[`Q${question.number}`] ?? row[`q${question.number}`] ?? row[`Soal ${question.number}`];
        const detected = String(direct ?? "").trim().toUpperCase();
        if (detected) rowAnswers.set(question.number, detected);
      }
    }

    let score = 0;
    let maxScore = 0;
    const items = template.questions.map((question) => {
      const expected = answerKey.get(question.number) ?? "";
      const detected = rowAnswers.get(question.number) ?? "";
      const weight = weights.get(question.number) ?? 1;
      const correct = !!expected && detected === expected;
      maxScore += weight;
      if (correct) score += weight;
      return {
        id: `${index + 1}-${question.number}`,
        question: `Soal ${question.number}`,
        expected,
        detected,
        confidence: detected ? 0.95 : 0.3,
        correct
      };
    });

    return {
      name: participantName,
      score,
      maxScore,
      finalScore: maxScore ? Number(((score / maxScore) * 100).toFixed(2)) : 0,
      items
    };
  });

  return {
    status: participants.some((participant) => participant.items.some((item) => item.confidence < 0.82)) ? "REVIEW_REQUIRED" : "OK",
    engine: "Excel OMR bridge",
    template: { id: template.id, name: template.name, questionCount: template.questions.length },
    participants
  };
}
