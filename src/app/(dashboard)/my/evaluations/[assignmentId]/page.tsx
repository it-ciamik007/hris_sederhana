import { notFound, redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { DynamicFormRenderer } from "@/components/features/evaluations/dynamic-form-renderer";
import { PageHeader } from "@/components/layout/page-header";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

type RendererOptions = { placeholder?: string; required?: boolean; options?: string[] };

export default async function FillEvaluationPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const session = await getSession();
  if (!session?.employeeId) redirect("/my");

  const assignment = await db.evaluationAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      target: true,
      cycle: {
        include: {
          form: {
            include: {
              sections: {
                orderBy: { sortOrder: "asc" },
                include: { questions: { orderBy: { sortOrder: "asc" } } }
              }
            }
          }
        }
      }
    }
  });

  if (!assignment || assignment.evaluatorId !== session.employeeId) notFound();
  if (assignment.status === "SUBMITTED") redirect("/my/evaluations");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        eyebrow={<><ClipboardList className="h-4 w-4" />Penilaian</>}
        title={`Menilai: ${assignment.target.fullName}`}
        description={`${assignment.cycle.title} - ${assignment.cycle.form.title} (${assignment.reviewType})`}
      />

      <form action={`/api/my/evaluations/${assignment.id}`} method="post" className="space-y-5">
        {assignment.cycle.form.sections.map((section) => (
          <section key={section.id} className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border p-4">
              <div className="font-semibold">{section.title}</div>
              {section.description && <div className="mt-0.5 text-sm text-muted-foreground">{section.description}</div>}
            </div>
            <div className="p-4">
              <DynamicFormRenderer
                questions={section.questions.map((question) => ({
                  id: question.id,
                  question: question.question,
                  answerType: question.answerType,
                  optionsJson: (question.optionsJson as RendererOptions | null) ?? undefined
                }))}
              />
            </div>
          </section>
        ))}

        <button
          type="submit"
          className="h-11 w-full rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 sm:w-auto"
        >
          Submit Penilaian
        </button>
      </form>
    </div>
  );
}
