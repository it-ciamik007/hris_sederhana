"use client";

import { Receipt, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";

export type ReimbursementTypeOption = {
  value: string;
  label: string;
  maxAmount: string | null;
  requiresAttachment: boolean;
};

export function ReimbursementRequestDialog({
  types,
  approvers,
  defaultApproverId
}: {
  types: ReimbursementTypeOption[];
  approvers: SearchableSelectOption[];
  defaultApproverId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [typeId, setTypeId] = useState(types[0]?.value ?? "");
  const selectedType = types.find((type) => type.value === typeId);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="shadow-sm">
        <Receipt className="h-4 w-4" />
        Ajukan Reimbursement
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl border border-border bg-background shadow-2xl">
            <div className="flex items-start justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">Pengajuan Reimbursement</h2>
                <p className="mt-1 text-sm text-muted-foreground">Lampirkan bukti (JPG/PNG/WebP/PDF, maks 5 MB).</p>
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

            <form action="/api/my/reimbursement" method="post" encType="multipart/form-data" className="grid gap-4 p-5 sm:grid-cols-2">
              <input type="hidden" name="intent" value="submit" />
              <label className="text-sm font-medium sm:col-span-2">
                Tipe Reimbursement
                <select
                  name="reimbursementTypeId"
                  required
                  value={typeId}
                  onChange={(event) => setTypeId(event.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  {types.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {selectedType && (
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">
                    {selectedType.maxAmount ? `Maksimal Rp ${Number(selectedType.maxAmount).toLocaleString("id-ID")}` : "Tanpa batas nominal"}
                    {selectedType.requiresAttachment ? " - wajib bukti" : ""}
                  </span>
                )}
              </label>
              <label className="text-sm font-medium">
                Tanggal Pengeluaran
                <Input name="expenseDate" type="date" required className="mt-1" />
              </label>
              <label className="text-sm font-medium">
                Nominal (Rp)
                <Input name="amount" type="number" min="1" step="0.01" required className="mt-1" />
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
                Keterangan
                <Textarea name="description" required minLength={3} className="mt-1" rows={3} />
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Bukti / Kwitansi {selectedType?.requiresAttachment ? "(wajib)" : "(opsional)"}
                <input
                  type="file"
                  name="attachment"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  required={selectedType?.requiresAttachment ?? false}
                  className="mt-1 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                />
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
