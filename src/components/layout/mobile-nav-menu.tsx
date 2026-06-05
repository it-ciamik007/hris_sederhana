"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function MobileNavMenu({ permissions, roles }: { permissions: string[]; roles: string[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const nav = navigationItems.filter(
    (item) => roles.includes("SUPER_ADMIN") || permissions.includes(item.permission) || permissions.includes("setting.manage")
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border/60 bg-background/70 text-foreground shadow-sm transition hover:bg-accent lg:hidden"
        aria-label="Buka menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            aria-label="Tutup menu"
            onClick={() => setOpen(false)}
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
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-xl border border-border/60 bg-background/80 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="grid gap-2 overflow-y-auto p-4">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
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
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
