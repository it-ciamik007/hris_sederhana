import { Wallet } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";

export default function MyPayrollPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={<><Wallet className="h-4 w-4" />Area Pribadi</>}
        title="Payroll Saya"
        description="Slip gaji dan riwayat pembayaran Anda."
      />
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <EmptyState
          icon={Wallet}
          title="Slip gaji belum tersedia"
          description="Modul payroll sedang disiapkan. Slip gaji Anda akan muncul di sini setelah modul payroll diaktifkan."
        />
      </div>
    </div>
  );
}
