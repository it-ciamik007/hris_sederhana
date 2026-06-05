import { cn } from "@/lib/utils";

const colors: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ALL_ACCESS: "bg-cyan-50 text-cyan-700 border-cyan-200",
  INACTIVE: "bg-slate-50 text-slate-600 border-slate-200",
  REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
  OK: "bg-emerald-50 text-emerald-700 border-emerald-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SENT: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  WAITING_SPV: "bg-amber-50 text-amber-700 border-amber-200",
  WAITING_MANAGER: "bg-amber-50 text-amber-700 border-amber-200",
  WAITING_HRD: "bg-amber-50 text-amber-700 border-amber-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  DRAFT: "bg-slate-50 text-slate-700 border-slate-200",
  QUEUED: "bg-cyan-50 text-cyan-700 border-cyan-200"
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-medium", colors[status] ?? colors.DRAFT)}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
