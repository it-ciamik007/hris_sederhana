import type React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-border/50 bg-card p-6 shadow-sm shadow-slate-200/40 transition-all duration-200", className)} {...props} />;
}
