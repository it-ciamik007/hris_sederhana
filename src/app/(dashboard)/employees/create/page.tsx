import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";

export default async function EmployeeCreatePage() {
  const company = await db.company.findFirst();

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Tambah Karyawan</h1>
        <p className="text-sm text-muted-foreground">NIK divalidasi struktur, tanggal lahir, gender, dan duplikasi internal.</p>
      </div>
      <form action="/api/employees" method="post" className="grid gap-4 rounded-md border bg-white p-4 md:grid-cols-2">
        <input type="hidden" name="companyId" value={company?.id ?? ""} />
        <label className="text-sm">
          Nomor Karyawan
          <Input name="employeeNumber" required className="mt-1" />
        </label>
        <label className="text-sm">
          Nama Lengkap
          <Input name="fullName" required className="mt-1" />
        </label>
        <label className="text-sm">
          NIK
          <Input name="nik" minLength={16} maxLength={16} className="mt-1" />
        </label>
        <label className="text-sm">
          Gender
          <select name="gender" className="mt-1 h-9 w-full rounded-md border bg-white px-3 text-sm">
            <option value="">-</option>
            <option value="MALE">Laki-laki</option>
            <option value="FEMALE">Perempuan</option>
          </select>
        </label>
        <label className="text-sm">
          Tanggal Lahir
          <Input name="birthDate" type="date" className="mt-1" />
        </label>
        <label className="text-sm">
          Tanggal Masuk
          <Input name="joinDate" type="date" required className="mt-1" />
        </label>
        <label className="text-sm">
          WhatsApp
          <Input name="whatsappNumber" placeholder="+628..." className="mt-1" />
        </label>
        <label className="text-sm">
          Email
          <Input name="email" type="email" className="mt-1" />
        </label>
        <div className="md:col-span-2">
          <Button type="submit">Simpan</Button>
        </div>
      </form>
    </div>
  );
}
