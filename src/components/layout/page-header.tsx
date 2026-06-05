import type React from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="flex flex-col justify-between gap-4 bg-[linear-gradient(135deg,#ffffff_0%,#f0fdfa_48%,#eef2ff_100%)] p-5 md:flex-row md:items-center dark:bg-[linear-gradient(135deg,#0f172a_0%,#164e63_48%,#312e81_100%)]">
        <div>
          {eyebrow && <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-700 dark:text-cyan-200">{eyebrow}</div>}
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">{title}</h1>
          {description && <p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-slate-300">{description}</p>}
        </div>
        {action}
      </div>
    </section>
  );
}
