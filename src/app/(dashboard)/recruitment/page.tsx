import { UserPlus } from "lucide-react";
import { ModuleListPage } from "@/components/layout/module-list-page";

export default function RecruitmentPage() {
  return (
    <ModuleListPage
      icon={UserPlus}
      eyebrow="Recruitment"
      title="Recruitment"
      description="Lowongan, kandidat, interview, tes kandidat, offering, dan convert kandidat menjadi employee."
      emptyTitle="Belum ada kandidat"
      emptyDescription="Pipeline kandidat akan muncul di sini setelah lowongan dan aplikasi dibuat."
      columns={["Kandidat", "Lowongan", "Stage", "Interview", "Status"]}
    />
  );
}
