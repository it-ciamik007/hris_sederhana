"use client";

import { Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

type PermissionItem = {
  id: string;
  code: string;
  module: string;
  name: string;
};

type RoleItem = {
  id: string;
  code: string;
  name: string;
  permissions: string[];
};

export function RolePermissionTabs({
  roles,
  permissions
}: {
  roles: RoleItem[];
  permissions: PermissionItem[];
}) {
  const [activeRoleId, setActiveRoleId] = useState(roles[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const activeRole = roles.find((role) => role.id === activeRoleId) ?? roles[0];
  const grouped = useMemo(
    () => {
      const normalized = query.trim().toLowerCase();
      return permissions
        .filter((permission) =>
          !normalized ||
          `${permission.module} ${permission.code} ${permission.name}`.toLowerCase().includes(normalized)
        )
        .reduce<Record<string, PermissionItem[]>>((acc, permission) => {
        acc[permission.module] = [...(acc[permission.module] ?? []), permission];
        return acc;
      }, {});
    },
    [permissions, query]
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
      <aside className="rounded-2xl border bg-white p-3 shadow-sm">
        <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Roles</div>
        <div className="grid gap-1">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setActiveRoleId(role.id)}
              className={cn(
                "flex items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition",
                activeRole?.id === role.id ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/20" : "hover:bg-slate-50"
              )}
            >
              <span>
                <span className="block font-semibold">{role.code}</span>
                <span className={cn("text-xs", activeRole?.id === role.id ? "text-cyan-50" : "text-slate-500")}>{role.name}</span>
              </span>
              <ShieldCheck className="h-4 w-4" />
            </button>
          ))}
        </div>
      </aside>

      <section className="rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b bg-slate-50/80 p-4 md:flex-row md:items-center">
          <div>
            <div className="text-lg font-semibold">{activeRole?.code}</div>
            <div className="text-sm text-slate-500">{activeRole?.permissions.length ?? 0} permission aktif</div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari permission..."
                className="h-10 w-full rounded-lg border bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-cyan-100 sm:w-64"
              />
            </label>
            {activeRole?.code === "SUPER_ADMIN" && <StatusBadge status="ALL_ACCESS" />}
          </div>
        </div>
        <div className="grid gap-4 p-4">
          {Object.entries(grouped).map(([module, modulePermissions]) => (
            <div key={module} className="rounded-xl border">
              <div className="border-b bg-cyan-50/70 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-cyan-700">
                {module}
              </div>
              <div className="grid gap-2 p-3 md:grid-cols-2">
                {modulePermissions.map((permission) => {
                  const checked = activeRole?.code === "SUPER_ADMIN" || activeRole?.permissions.includes(permission.id);
                  return (
                    <form key={permission.id} action="/api/settings/role-permissions" method="post">
                      <input type="hidden" name="roleId" value={activeRole?.id ?? ""} />
                      <input type="hidden" name="permissionId" value={permission.id} />
                      <input type="hidden" name="enabled" value={checked ? "0" : "1"} />
                      <button
                        disabled={activeRole?.code === "SUPER_ADMIN"}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition",
                          checked ? "border-emerald-200 bg-emerald-50" : "bg-white hover:bg-slate-50",
                          activeRole?.code === "SUPER_ADMIN" && "cursor-not-allowed opacity-80"
                        )}
                      >
                        <span>
                          <span className="block text-sm font-medium">{permission.code}</span>
                          <span className="block text-xs text-slate-500">{permission.name}</span>
                        </span>
                        <StatusBadge status={checked ? "ACTIVE" : "INACTIVE"} />
                      </button>
                    </form>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
