import Link from "next/link";
import { CheckCircle2, ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function MyEvaluationsPage({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const params = await searchParams;
  const session = await getSession();
  if (!session?.employeeId) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-3 text-lg font-semibold">Akun belum terhubung ke data karyawan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Hubungi admin HR untuk menghubungkan akun Anda.</p>
      </div>
    );
  }

  const assignments = await db.evaluationAssignment.findMany({
    where: { evaluatorId: session.employeeId },
    include: { cycle: { include: { form: true } }, target: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={<><ClipboardList className="h-4 w-4" />Area Pribadi</>}
        title="Penilaian Saya"
        description="Tugas penilaian yang harus Anda isi sebagai evaluator."
      />

      {params.submitted && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-300/60 bg-emerald-50 p-3 text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
          <CheckCircle2 className="h-4 w-4" />
          Penilaian berhasil disubmit. Terima kasih!
        </div>
      )}

      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="divide-y divide-border">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{assignment.target.fullName}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{assignment.reviewType}</span>
                  <StatusBadge status={assignment.status} />
                </div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  {assignment.cycle.title} - {assignment.cycle.form.title}
                  {assignment.score != null ? ` - Skor: ${assignment.score.toString()}` : ""}
                </div>
              </div>
              {assignment.status !== "SUBMITTED" && (
                <Link
                  href={`/my/evaluations/${assignment.id}`}
                  className="inline-flex h-9 shrink-0 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Isi Penilaian
                </Link>
              )}
            </div>
          ))}
          {!assignments.length && (
            <div className="p-10 text-center text-sm text-muted-foreground">Belum ada tugas penilaian untuk Anda.</div>
          )}
        </div>
      </section>
    </div>
  );
}
