import { Card } from "@/components/ui/card";

export function LeaveBalanceCard({ label, remaining }: { label: string; remaining: string }) {
  return (
    <Card>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{remaining}</div>
    </Card>
  );
}
