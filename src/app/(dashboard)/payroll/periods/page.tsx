import { PayrollSummaryCard } from "@/components/features/payroll/payroll-summary-card";

export default function PayrollPeriodsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Payroll</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <PayrollSummaryCard label="Periode terbuka" amount="0" />
        <PayrollSummaryCard label="Run draft" amount="0" />
        <PayrollSummaryCard label="Slip siap publish" amount="0" />
      </div>
    </div>
  );
}
