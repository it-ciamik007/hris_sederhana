import { Megaphone } from "lucide-react";
import { ModuleListPage } from "@/components/layout/module-list-page";

export default function AnnouncementsPage() {
  return (
    <ModuleListPage
      icon={Megaphone}
      eyebrow="Company Broadcast"
      title="Announcements"
      description="Pengumuman perusahaan dengan target semua karyawan, cabang, atau departemen tertentu."
      emptyTitle="Belum ada pengumuman"
      emptyDescription="Buat pengumuman untuk mengirim informasi internal dan membaca read receipt."
      columns={["Judul", "Target", "Published By", "Published At", "Read"]}
    />
  );
}
