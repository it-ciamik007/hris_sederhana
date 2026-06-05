import { GraduationCap } from "lucide-react";
import { ModuleListPage } from "@/components/layout/module-list-page";

export default function TrainingPage() {
  return (
    <ModuleListPage
      icon={GraduationCap}
      eyebrow="Training"
      title="Training"
      description="Master training, jadwal, peserta, nilai, sertifikat, dan evaluasi training."
      emptyTitle="Belum ada training"
      emptyDescription="Jadwal training dan peserta akan muncul sebagai list operasional."
      columns={["Training", "Tanggal", "Trainer", "Peserta", "Status"]}
    />
  );
}
