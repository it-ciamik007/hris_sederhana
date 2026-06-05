import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";

export const evaluationFormSchema = z.object({
  companyId: z.string(),
  title: z.string().min(3),
  isAnonymous: z.boolean().default(false),
  sections: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        columns: z.number().optional(),
        questions: z.array(
          z.object({
            question: z.string().min(1),
            answerType: z.string(),
            weight: z.number().default(1),
            optionsJson: z.unknown().optional()
          })
        )
      })
    )
    .default([])
});

export async function createEvaluationForm(input: unknown) {
  const data = evaluationFormSchema.parse(input);
  return db.evaluationForm.create({
    data: {
      companyId: data.companyId,
      title: data.title,
      isAnonymous: data.isAnonymous,
      sections: {
        create: data.sections.map((section, sectionIndex) => ({
          title: section.title,
          description: section.description,
          columns: section.columns ?? 2,
          sortOrder: sectionIndex + 1,
          questions: {
            create: section.questions.map((question, questionIndex) => ({
              question: question.question,
              answerType: question.answerType,
              weight: question.weight,
              optionsJson: question.optionsJson as Prisma.InputJsonValue,
              sortOrder: questionIndex + 1
            }))
          }
        }))
      }
    },
    include: { sections: { include: { questions: true } } }
  });
}

export async function updateEvaluationForm(id: string, input: unknown) {
  const data = evaluationFormSchema.parse(input);
  return db.$transaction(async (tx) => {
    const sections = await tx.evaluationSection.findMany({ where: { formId: id }, select: { id: true } });
    const sectionIds = sections.map((section) => section.id);

    if (sectionIds.length) {
      await tx.evaluationQuestion.deleteMany({ where: { sectionId: { in: sectionIds } } });
      await tx.evaluationSection.deleteMany({ where: { id: { in: sectionIds } } });
    }

    return tx.evaluationForm.update({
      where: { id },
      data: {
        title: data.title,
        isAnonymous: data.isAnonymous,
        sections: {
          create: data.sections.map((section, sectionIndex) => ({
            title: section.title,
            description: section.description,
            columns: section.columns ?? 2,
            sortOrder: sectionIndex + 1,
            questions: {
              create: section.questions.map((question, questionIndex) => ({
                question: question.question,
                answerType: question.answerType,
                weight: question.weight,
                optionsJson: question.optionsJson as Prisma.InputJsonValue,
                sortOrder: questionIndex + 1
              }))
            }
          }))
        }
      },
      include: { sections: { include: { questions: true } } }
    });
  });
}
