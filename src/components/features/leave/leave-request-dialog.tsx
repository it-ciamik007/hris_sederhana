"use client";

import { CalendarPlus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";

export function LeaveRequestDialog({
  employees,
  leaveTypes,
  canChooseEmployee,
  currentEmployee
}: {
  employees: SearchableSelectOption[];
  leaveTypes: SearchableSelectOption[];
  canChooseEmployee: boolean;
  currentEmployee?: SearchableSelectOption | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="shadow-sm">
        <CalendarPlus className="h-4 w-4" />
        Pengajuan
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-lg border bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b bg-gradient-to-r from-slate-50 via-white to-cyan-50 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">Pengajuan Izin/Cuti</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Isi detail pengajuan, sistem akan menghitung durasi hari kerja.
                </p>
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

            <form action="/api/leave/requests" method="post" className="grid gap-4 p-5 md:grid-cols-2">
              <input type="hidden" name="intent" value="submit" />
              {canChooseEmployee ? (
                <label className="block text-sm font-medium md:col-span-2">
                  Karyawan
                  <div className="mt-1">
                    <SearchableSelect name="employeeId" placeholder="Cari nama karyawan" options={employees} required />
                  </div>
                </label>
              ) : (
                <div className="rounded-lg border bg-cyan-50/60 p-3 md:col-span-2">
                  <input type="hidden" name="employeeId" value={currentEmployee?.value ?? ""} />
                  <div className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Pengaju</div>
                  <div className="mt-1 font-semibold">{currentEmployee?.label ?? "Profil karyawan belum terhubung"}</div>
                  {currentEmployee?.description && <div className="text-sm text-muted-foreground">{currentEmployee.description}</div>}
                </div>
              )}

              <label className="block text-sm font-medium md:col-span-2">
                Tipe Izin
                <div className="mt-1">
                  <SearchableSelect name="leaveTypeId" placeholder="Cari tipe izin" options={leaveTypes} required />
                </div>
              </label>

              <label className="block text-sm font-medium">
                Mulai
                <Input name="startDate" type="date" required className="mt-1" />
              </label>

              <label className="block text-sm font-medium">
                Selesai
                <Input name="endDate" type="date" required className="mt-1" />
              </label>

              <label className="block text-sm font-medium md:col-span-2">
                Alasan
                <Textarea name="reason" required className="mt-1" placeholder="Tuliskan alasan pengajuan..." />
              </label>

              <div className="flex justify-end gap-2 border-t pt-4 md:col-span-2">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  <CalendarPlus className="h-4 w-4" />
                  Ajukan Sekarang
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
