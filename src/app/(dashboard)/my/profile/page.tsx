import { CheckCircle2, UserRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function MyProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const params = await searchParams;
  const session = await getSession();
  if (!session?.employeeId) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <UserRound className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-3 text-lg font-semibold">Akun belum terhubung ke data karyawan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Hubungi admin HR untuk menghubungkan akun Anda.</p>
      </div>
    );
  }

  const employee = await db.employee.findUnique({
    where: { id: session.employeeId },
    include: { position: true, department: true, branch: true, supervisor: true }
  });
  if (!employee) return null;

  const employmentRows: [string, string][] = [
    ["Nomor Karyawan", employee.employeeNumber],
    ["NIK", employee.nik ?? "-"],
    ["Jabatan", employee.position?.name ?? "-"],
    ["Departemen", employee.department?.name ?? "-"],
    ["Cabang", employee.branch?.name ?? "-"],
    ["Atasan", employee.supervisor?.fullName ?? "-"],
    ["Tanggal Masuk", employee.joinDate.toISOString().slice(0, 10)],
    ["Tempat / Tgl Lahir", `${employee.birthPlace ?? "-"} / ${employee.birthDate?.toISOString().slice(0, 10) ?? "-"}`]
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={<><UserRound className="h-4 w-4" />Area Pribadi</>}
        title="Profil Saya"
        description="Data kontak dan rekening dapat Anda ubah sendiri. Data kepegawaian hanya dapat diubah oleh HR."
      />

      {params.saved && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-300/60 bg-emerald-50 p-3 text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
          <CheckCircle2 className="h-4 w-4" />
          Profil berhasil disimpan.
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="font-semibold">Data Kepegawaian</div>
            <StatusBadge status={employee.employmentStatus} />
          </div>
          <dl className="divide-y divide-border">
            <div className="flex items-center justify-between gap-3 p-4">
              <dt className="text-sm text-muted-foreground">Nama Lengkap</dt>
              <dd className="text-sm font-semibold">{employee.fullName}</dd>
            </div>
            {employmentRows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 p-4">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="text-right text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-4 font-semibold">Kontak & Bank</div>
          <form action="/api/my/profile" method="post" className="grid gap-4 p-4">
            <label className="text-sm font-medium">
              Telepon
              <Input name="phone" defaultValue={employee.phone ?? ""} className="mt-1" />
            </label>
            <label className="text-sm font-medium">
              Nomor WhatsApp
              <Input name="whatsappNumber" defaultValue={employee.whatsappNumber ?? ""} className="mt-1" />
            </label>
            <label className="text-sm font-medium">
              Email
              <Input name="email" type="email" defaultValue={employee.email ?? ""} className="mt-1" />
            </label>
            <label className="text-sm font-medium">
              Alamat
              <textarea name="address" defaultValue={employee.address ?? ""} rows={3} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Nama Bank
                <Input name="bankName" defaultValue={employee.bankName ?? ""} className="mt-1" />
              </label>
              <label className="text-sm font-medium">
                Nomor Rekening
                <Input name="bankAccountNumber" defaultValue={employee.bankAccountNumber ?? ""} className="mt-1" />
              </label>
            </div>
            <button type="submit" className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90">
              Simpan Perubahan
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
