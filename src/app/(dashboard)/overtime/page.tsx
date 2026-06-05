import { Timer } from "lucide-react";
import { ModuleListPage } from "@/components/layout/module-list-page";

export default function OvertimePage() {
  return (
    <ModuleListPage
      icon={Timer}
      eyebrow="Overtime"
      title="Lembur"
      description="Pengajuan lembur, approval SPV/Manager/HRD, dan integrasi ke payroll."
      emptyTitle="Belum ada pengajuan lembur"
      emptyDescription="Pengajuan lembur akan tampil sebagai list dengan approval dan status payroll."
      columns={["Karyawan", "Tanggal", "Durasi", "Approver", "Status"]}
    />
  );
}
