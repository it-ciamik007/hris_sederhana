import { Card } from "@/components/ui/card";

export function PayrollSummaryCard({ label, amount }: { label: string; amount: string }) {
  return (
    <Card>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{amount}</div>
    </Card>
  );
}
