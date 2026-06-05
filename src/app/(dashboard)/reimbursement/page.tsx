import { ReceiptText } from "lucide-react";
import { ModuleListPage } from "@/components/layout/module-list-page";

export default function ReimbursementPage() {
  return (
    <ModuleListPage
      icon={ReceiptText}
      eyebrow="Reimbursement"
      title="Reimbursement"
      description="Pengajuan reimbursement, upload bukti, approval, dan posting ke payroll."
      emptyTitle="Belum ada reimbursement"
      emptyDescription="Data reimbursement akan muncul setelah karyawan membuat pengajuan."
      columns={["Karyawan", "Jenis", "Tanggal", "Amount", "Status"]}
    />
  );
}
