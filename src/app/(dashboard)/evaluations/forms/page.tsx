import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { EvaluationBuilder } from "@/components/features/evaluations/evaluation-builder";
import { StatusBadge } from "@/components/ui/status-badge";
import { DisclosurePanel } from "@/components/ui/disclosure-panel";
import { db } from "@/lib/db";

export default async function EvaluationFormsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const [company, forms] = await Promise.all([
    db.company.findFirst(),
    db.evaluationForm.findMany({
      where: q ? { title: { contains: q } } : {},
      include: { sections: { include: { questions: true } } },
      orderBy: { createdAt: "desc" },
      take: 12
    })
  ]);

  return (
    <div className="space-y-5">
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-700">
              <FileText className="h-4 w-4" />
              Evaluation Center
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Dynamic Evaluation Forms</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Buat form penilaian dengan section, field, tipe jawaban, bobot, opsi, dan layout dinamis.
            </p>
          </div>
          <form className="flex gap-2">
            <input name="q" defaultValue={q} placeholder="Cari form..." className="h-10 rounded-lg border bg-slate-50 px-3 text-sm outline-none focus:ring-2 focus:ring-cyan-100" />
            <button className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white">Cari</button>
          </form>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {forms.map((form) => {
            const questionCount = form.sections.reduce((total, section) => total + section.questions.length, 0);
            return (
              <div key={form.id} className="rounded-lg border bg-slate-50/70 p-4 transition hover:border-cyan-200 hover:bg-white hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{form.title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      v{form.version} - {form.sections.length} section - {questionCount} field
                    </div>
                  </div>
                  <StatusBadge status={form.status} />
                </div>
                <Link href={`/evaluations/forms/${form.id}/edit`} className="mt-4 inline-flex h-9 items-center rounded-lg border bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Edit Builder
                </Link>
              </div>
            );
          })}
          {!forms.length && (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              <Plus className="mb-2 h-5 w-5" />
              Belum ada form yang cocok.
            </div>
          )}
        </div>
      </section>

      <DisclosurePanel buttonLabel="Buat Form Baru">
        <EvaluationBuilder companyId={company?.id ?? ""} />
      </DisclosurePanel>
    </div>
  );
}
