"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { myNavigationItems, navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };

export function filterAdminNav(permissions: string[], roles: string[]) {
  return navigationItems.filter(
    (item) => roles.includes("SUPER_ADMIN") || permissions.includes(item.permission) || permissions.includes("setting.manage")
  );
}

export function isNavActive(pathname: string, href: string) {
  if (href === "/my") return pathname === "/my";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 overflow-hidden",
        active
          ? "text-primary shadow-sm ring-1 ring-border/50 bg-background"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
      )}
    >
      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-md"></span>}
      <span
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-all duration-200",
          active
            ? "bg-primary/10 text-primary shadow-inner"
            : "bg-transparent text-muted-foreground group-hover:bg-background group-hover:text-primary group-hover:shadow-sm"
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="truncate group-hover:translate-x-0.5 transition-transform duration-200">{item.label}</span>
    </Link>
  );
}

export function Sidebar({
  permissions,
  roles,
  hasEmployee
}: {
  permissions: string[];
  roles: string[];
  hasEmployee: boolean;
}) {
  const pathname = usePathname();
  const adminNav = filterAdminNav(permissions, roles);

  return (
    <aside className="z-50 hidden min-h-screen w-72 flex-col border-r border-border/40 bg-background/80 backdrop-blur-xl lg:flex">
      {/* Sidebar Header */}
      <div className="flex h-[72px] items-center gap-3 border-b border-border/40 px-6 backdrop-blur-md transition-all">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary shadow-sm shadow-primary/30 ring-1 ring-primary/20 bg-gradient-to-br from-primary to-primary/80">
          <span className="text-sm font-bold text-primary-foreground">HR</span>
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold text-foreground tracking-tight">HRIS Platform</span>
          <span className="text-xs text-muted-foreground">Premium Edition</span>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
        {hasEmployee && (
          <>
            <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              Menu Saya
            </div>
            <nav className="grid gap-2">
              {myNavigationItems.map((item) => (
                <NavLink key={item.href} item={item} active={isNavActive(pathname, item.href)} />
              ))}
            </nav>
          </>
        )}

        {!!adminNav.length && (
          <>
            <div className={cn("mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70", hasEmployee && "mt-6")}>
              Administrasi
            </div>
            <nav className="grid gap-2">
              {adminNav.map((item) => (
                <NavLink key={item.href} item={item} active={isNavActive(pathname, item.href)} />
              ))}
            </nav>
          </>
        )}
      </div>
    </aside>
  );
}
