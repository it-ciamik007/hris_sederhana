"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function Sidebar({ permissions, roles }: { permissions: string[]; roles: string[] }) {
  const pathname = usePathname();
  const nav = navigationItems.filter(
    (item) => roles.includes("SUPER_ADMIN") || permissions.includes(item.permission) || permissions.includes("setting.manage")
  );

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
        <nav className="grid gap-2">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 overflow-hidden",
                  active 
                    ? "text-primary shadow-sm ring-1 ring-border/50 bg-background" 
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-md"></span>
                )}
                
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
                <span className="truncate group-hover:translate-x-0.5 transition-transform duration-200">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
