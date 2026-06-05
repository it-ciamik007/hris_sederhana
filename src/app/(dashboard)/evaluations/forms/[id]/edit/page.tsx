import { notFound } from "next/navigation";
import { EvaluationBuilder, type EvaluationBuilderInitialSection } from "@/components/features/evaluations/evaluation-builder";
import { PageHeader } from "@/components/layout/page-header";
import { db } from "@/lib/db";

type OptionsJson = {
  placeholder?: string;
  width?: "FULL" | "HALF" | "THIRD";
  required?: boolean;
  options?: string[];
};

export default async function EvaluationFormEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const form = await db.evaluationForm.findUnique({
    where: { id },
    include: { sections: { include: { questions: true }, orderBy: { sortOrder: "asc" } } }
  });
  if (!form) notFound();

  const sections: EvaluationBuilderInitialSection[] = form.sections.map((section) => ({
    title: section.title,
    description: section.description ?? "",
    columns: (section.columns === 1 || section.columns === 2 || section.columns === 3 ? section.columns : 2),
    questions: section.questions.map((question) => {
      const options = (question.optionsJson ?? {}) as OptionsJson;
      return {
        label: question.question,
        answerType: question.answerType,
        placeholder: options.placeholder,
        width: options.width,
        required: options.required,
        weight: Number(question.weight),
        options: options.options
      };
    })
  }));

  return (
    <div className="space-y-5">
      <PageHeader title={`Edit ${form.title}`} description="Perubahan akan mengganti struktur section dan field pada form draft ini." />
      <EvaluationBuilder
        companyId={form.companyId}
        formId={form.id}
        initialTitle={form.title}
        initialIsAnonymous={form.isAnonymous}
        initialSections={sections}
      />
    </div>
  );
}
