import { Laptop } from "lucide-react";
import { ModuleListPage } from "@/components/layout/module-list-page";

export default function AssetsPage() {
  return (
    <ModuleListPage
      icon={Laptop}
      eyebrow="Employee Assets"
      title="Assets"
      description="Master asset, assignment ke karyawan, return asset, kondisi, dan riwayat asset."
      emptyTitle="Belum ada asset"
      emptyDescription="Asset perusahaan akan muncul di sini setelah dibuat atau diassign ke karyawan."
      columns={["Kode", "Asset", "Kategori", "Assigned To", "Status"]}
    />
  );
}
