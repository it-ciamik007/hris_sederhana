"use client";

import { Clock, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";

export function OvertimeRequestDialog({
  approvers,
  defaultApproverId
}: {
  approvers: SearchableSelectOption[];
  defaultApproverId?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="shadow-sm">
        <Clock className="h-4 w-4" />
        Ajukan Lembur
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
            <div className="flex items-start justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">Pengajuan Lembur</h2>
                <p className="mt-1 text-sm text-muted-foreground">Durasi dihitung otomatis dari jam mulai dan selesai.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form action="/api/my/overtime" method="post" className="grid gap-4 p-5 sm:grid-cols-2">
              <input type="hidden" name="intent" value="submit" />
              <label className="text-sm font-medium sm:col-span-2">
                Tanggal Lembur
                <Input name="overtimeDate" type="date" required className="mt-1" />
              </label>
              <label className="text-sm font-medium">
                Jam Mulai
                <Input name="startTime" type="time" required className="mt-1" />
              </label>
              <label className="text-sm font-medium">
                Jam Selesai
                <Input name="endTime" type="time" required className="mt-1" />
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Atasan / Approver
                <div className="mt-1">
                  <SearchableSelect
                    name="selectedApproverId"
                    placeholder="Cari nama atasan"
                    options={approvers}
                    defaultValue={defaultApproverId}
                    required
                  />
                </div>
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Alasan / Pekerjaan
                <Textarea name="reason" required minLength={3} className="mt-1" rows={3} />
              </label>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-accent"
                >
                  Batal
                </button>
                <button type="submit" className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  Ajukan & Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
