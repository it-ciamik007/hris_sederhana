import type { LucideIcon } from "lucide-react";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";

export function ModuleListPage({
  icon: Icon,
  eyebrow,
  title,
  description,
  emptyTitle,
  emptyDescription,
  columns
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  columns: string[];
}) {
  return (
    <div className="space-y-5">
      <PageHeader eyebrow={<><Icon className="h-4 w-4" />{eyebrow}</>} title={title} description={description} />
      <section className="rounded-2xl border bg-white shadow-sm">
        <form className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input placeholder="Search..." className="h-10 w-full rounded-lg border bg-slate-50 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-cyan-100" />
          </div>
          <select className="h-10 rounded-lg border bg-slate-50 px-3 text-sm">
            <option>Semua status</option>
          </select>
          <button className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white">Filter</button>
        </form>
        <div className="overflow-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>{columns.map((column) => <th key={column} className="px-4 py-3">{column}</th>)}</tr>
            </thead>
          </table>
        </div>
        <div className="p-4">
          <EmptyState icon={Icon} title={emptyTitle} description={emptyDescription} />
        </div>
      </section>
    </div>
  );
}
