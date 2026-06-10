"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { myNavigationItems } from "@/lib/navigation";
import { filterAdminNav, isNavActive } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };

function MobileNavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all",
        active ? "bg-primary/10 text-primary ring-1 ring-primary/15" : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <span
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
          active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground"
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function MobileNavMenu({
  permissions,
  roles,
  hasEmployee
}: {
  permissions: string[];
  roles: string[];
  hasEmployee: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const adminNav = filterAdminNav(permissions, roles);
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-accent lg:hidden"
        aria-label="Buka menu"
      >
        <Menu className="h-5 w-5" />
        <span className="hidden min-[360px]:inline">Menu</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[90]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            aria-label="Tutup menu"
            onClick={close}
          />
          <aside className="relative z-10 flex h-full w-[min(88vw,340px)] flex-col border-r border-border/40 bg-background shadow-2xl">
            <div className="flex h-[72px] items-center gap-3 border-b border-border/40 px-5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-sm shadow-primary/30">
                <span className="text-sm font-bold text-primary-foreground">HR</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-bold text-foreground">HRIS Platform</div>
                <div className="text-xs text-muted-foreground">Premium Edition</div>
              </div>
              <button
                type="button"
                onClick={close}
                className="grid h-10 w-10 place-items-center rounded-xl border border-border/60 bg-background/80 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {hasEmployee && (
                <>
                  <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Menu Saya
                  </div>
                  <nav className="grid gap-2">
                    {myNavigationItems.map((item) => (
                      <MobileNavLink key={item.href} item={item} active={isNavActive(pathname, item.href)} onNavigate={close} />
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
                      <MobileNavLink key={item.href} item={item} active={isNavActive(pathname, item.href)} onNavigate={close} />
                    ))}
                  </nav>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
