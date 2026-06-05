import type React from "react";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed bg-white px-6 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-cyan-50 text-cyan-700">
        <Icon className="h-6 w-6" />
      </div>
      <div className="mt-4 text-base font-semibold text-slate-900">{title}</div>
      <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
