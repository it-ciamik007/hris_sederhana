import { Files } from "lucide-react";
import { ModuleListPage } from "@/components/layout/module-list-page";

export default function DocumentsPage() {
  return (
    <ModuleListPage
      icon={Files}
      eyebrow="Document Center"
      title="Documents"
      description="Kelola dokumen perusahaan dan dokumen karyawan, termasuk expiry reminder dan hak akses."
      emptyTitle="Belum ada dokumen"
      emptyDescription="Dokumen perusahaan dan karyawan akan muncul di sini setelah upload."
      columns={["Dokumen", "Kategori", "Owner", "Expired", "Status"]}
    />
  );
}
