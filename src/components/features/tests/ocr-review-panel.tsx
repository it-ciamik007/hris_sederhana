import { StatusBadge } from "@/components/ui/status-badge";

export function OCRReviewPanel({ items }: { items: { id: string; question: string; detected: string; confidence: number }[] }) {
  return (
    <div className="rounded-md border bg-white">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between border-b p-3 text-sm last:border-b-0">
          <span>{item.question}: {item.detected}</span>
          <StatusBadge status={item.confidence < 0.82 ? "REVIEW" : "OK"} />
        </div>
      ))}
    </div>
  );
}
