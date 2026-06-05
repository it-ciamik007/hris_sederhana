"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export type SearchableSelectOption = {
  value: string;
  label: string;
  description?: string;
};

export function SearchableSelect({
  name,
  options,
  placeholder,
  required,
  defaultValue = ""
}: {
  name: string;
  options: SearchableSelectOption[];
  placeholder: string;
  required?: boolean;
  defaultValue?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const selected = options.find((option) => option.value === selectedValue);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) =>
      `${option.label} ${option.description ?? ""}`.toLowerCase().includes(normalized)
    );
  }, [options, query]);

  return (
    <div className="relative">
      <input name={name} value={selectedValue} required={required} className="sr-only" readOnly />
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-full items-center justify-between rounded-md border bg-white px-3 text-left text-sm shadow-sm outline-none transition hover:bg-muted/40 focus:ring-2 focus:ring-ring/25"
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-md border bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari..."
              className="h-8 min-w-0 flex-1 text-sm outline-none"
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-auto p-1">
            {filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setSelectedValue(option.value);
                  setOpen(false);
                  setQuery("");
                }}
                className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-muted"
              >
                <Check className={cn("mt-0.5 h-4 w-4", selectedValue === option.value ? "opacity-100" : "opacity-0")} />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{option.label}</span>
                  {option.description && (
                    <span className="block truncate text-xs text-muted-foreground">{option.description}</span>
                  )}
                </span>
              </button>
            ))}
            {!filtered.length && <div className="px-3 py-6 text-center text-sm text-muted-foreground">Tidak ada data.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
