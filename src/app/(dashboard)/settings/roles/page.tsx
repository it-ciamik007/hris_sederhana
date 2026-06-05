import { ShieldCheck } from "lucide-react";
import { RolePermissionTabs } from "@/components/features/settings/role-permission-tabs";
import { PageHeader } from "@/components/layout/page-header";
import { db } from "@/lib/db";

export default async function RolesPage() {
  const [roles, permissions] = await Promise.all([
    db.role.findMany({
      include: { permissions: { include: { permission: true } } },
      orderBy: { code: "asc" }
    }),
    db.permission.findMany({ orderBy: [{ module: "asc" }, { code: "asc" }] })
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={<><ShieldCheck className="h-4 w-4" />Access Control</>}
        title="Role & Permission Matrix"
        description="Kelola hak akses granular per role. Super admin tetap memiliki semua akses."
      />

      <RolePermissionTabs
        roles={roles.map((role) => ({
          id: role.id,
          code: role.code,
          name: role.name,
          permissions: role.permissions.map((item) => item.permissionId)
        }))}
        permissions={permissions.map((permission) => ({
          id: permission.id,
          code: permission.code,
          module: permission.module,
          name: permission.name
        }))}
      />
    </div>
  );
}
