import { StatusBadge } from "@/components/ui/status-badge";

export function ApprovalTimeline({ steps }: { steps: { id: string; stepNo: number; approverType: string; status: string }[] }) {
  return (
    <ol className="grid gap-2">
      {steps.map((step) => (
        <li key={step.id} className="flex items-center justify-between rounded-md border bg-white p-3 text-sm">
          <span>{step.stepNo}. {step.approverType}</span>
          <StatusBadge status={step.status} />
        </li>
      ))}
    </ol>
  );
}
