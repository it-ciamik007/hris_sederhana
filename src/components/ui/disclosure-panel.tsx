"use client";

import type React from "react";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DisclosurePanel({
  buttonLabel,
  children
}: {
  buttonLabel: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Button type="button" onClick={() => setOpen((value) => !value)}>
        {open ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {open ? "Tutup Builder" : buttonLabel}
      </Button>
      {open && children}
    </div>
  );
}
