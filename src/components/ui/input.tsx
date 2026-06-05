import type React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-md border bg-white px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/25",
        className
      )}
      {...props}
    />
  );
}
