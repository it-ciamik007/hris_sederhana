"use client";

import { X } from "lucide-react";
import { useState } from "react";

export type FieldConfig = {
  name: string;
  label: string;
  type: "text" | "number" | "time" | "date" | "checkbox" | "select" | "textarea";
  required?: boolean;
  step?: string;
  options?: { value: string; label: string }[];
};

export function EntityDialog({
  entity,
  title,
  triggerLabel,
  triggerClassName,
  fields,
  initialValues,
  id
}: {
  entity: string;
  title: string;
  triggerLabel: string;
  triggerClassName?: string;
  fields: FieldConfig[];
  initialValues?: Record<string, string | boolean | null | undefined>;
  id?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          triggerClassName ??
          "inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
        }
      >
        {triggerLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center">
          <button type="button" aria-label="Tutup" className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-background p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Tutup dialog" className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form action={`/api/settings/organization/${entity}`} method="post" className="grid gap-3">
              <input type="hidden" name="_action" value={id ? "update" : "create"} />
              {id && <input type="hidden" name="id" value={id} />}

              {fields.map((field) => {
                const initial = initialValues?.[field.name];
                if (field.type === "checkbox") {
                  return (
                    <label key={field.name} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name={field.name} value="1" defaultChecked={Boolean(initial)} className="h-4 w-4 rounded border-border" />
                      {field.label}
                    </label>
                  );
                }
                if (field.type === "select") {
                  return (
                    <label key={field.name} className="text-sm font-medium">
                      {field.label}
                      <select name={field.name} defaultValue={typeof initial === "string" ? initial : ""} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">
                        <option value="">-</option>
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                }
                if (field.type === "textarea") {
                  return (
                    <label key={field.name} className="text-sm font-medium">
                      {field.label}
                      <textarea name={field.name} defaultValue={typeof initial === "string" ? initial : ""} rows={3} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                    </label>
                  );
                }
                return (
                  <label key={field.name} className="text-sm font-medium">
                    {field.label}
                    <input
                      type={field.type}
                      name={field.name}
                      required={field.required}
                      step={field.step}
                      defaultValue={typeof initial === "string" ? initial : initial == null ? "" : String(initial)}
                      className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    />
                  </label>
                );
              })}

              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-accent">
                  Batal
                </button>
                <button type="submit" className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
