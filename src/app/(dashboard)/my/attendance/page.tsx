import Link from "next/link";
import { CalendarCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { AttendanceCalendar, type CalendarDay } from "@/components/features/attendance/attendance-calendar";
import { MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function parseMonthParam(value: string | undefined) {
  const match = value?.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (month >= 1 && month <= 12) return { year, month };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function toTime(value: Date | null) {
  return value ? value.toISOString().slice(11, 16) : null;
}

export default async function MyAttendancePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const params = await searchParams;
  const session = await getSession();
  if (!session?.employeeId) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <CalendarCheck className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-3 text-lg font-semibold">Akun belum terhubung ke data karyawan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Hubungi admin HR untuk menghubungkan akun Anda.</p>
      </div>
    );
  }
  const employeeId = session.employeeId;

  const { year, month } = parseMonthParam(params.month);
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0));
  const daysInMonth = monthEnd.getUTCDate();

  const employee = await db.employee.findUnique({ where: { id: employeeId }, select: { companyId: true } });
  const [attendance, holidays, approvedLeaves] = await Promise.all([
    db.attendanceDaily.findMany({ where: { employeeId, attendanceDate: { gte: monthStart, lte: monthEnd } } }),
    db.holiday.findMany({
      where: { companyId: employee?.companyId, holidayDate: { gte: monthStart, lte: monthEnd } }
    }),
    db.leaveRequest.findMany({
      where: { employeeId, status: "APPROVED", startDate: { lte: monthEnd }, endDate: { gte: monthStart } },
      include: { leaveType: true }
    })
  ]);

  const attendanceByDate = new Map(attendance.map((item) => [item.attendanceDate.toISOString().slice(0, 10), item]));
  const holidayByDate = new Map(holidays.map((item) => [item.holidayDate.toISOString().slice(0, 10), item]));
  const today = new Date().toISOString().slice(0, 10);

  const days: CalendarDay[] = [];
  for (let dayNo = 1; dayNo <= daysInMonth; dayNo += 1) {
    const date = new Date(Date.UTC(year, month - 1, dayNo));
    const key = date.toISOString().slice(0, 10);
    const weekday = date.getUTCDay();
    const record = attendanceByDate.get(key);
    const holiday = holidayByDate.get(key);
    const leave = approvedLeaves.find(
      (item) => item.startDate.toISOString().slice(0, 10) <= key && item.endDate.toISOString().slice(0, 10) >= key
    );

    let status: CalendarDay["status"];
    let label: string | undefined;
    if (record && (record.checkInAt || record.checkOutAt || record.status === "PRESENT" || record.status === "LATE")) {
      status = record.lateMinutes > 0 || record.status === "LATE" ? "LATE" : "PRESENT";
      if (status === "LATE") label = `Telat ${record.lateMinutes} mnt`;
    } else if (leave) {
      status = "LEAVE";
      label = leave.leaveType.name;
    } else if (holiday) {
      status = "HOLIDAY";
      label = holiday.name;
    } else if (weekday === 0 || weekday === 6) {
      status = "WEEKEND";
    } else if (key > today) {
      status = "FUTURE";
    } else {
      status = "ABSENT";
    }

    days.push({ date: key, status, label, checkIn: toTime(record?.checkInAt ?? null), checkOut: toTime(record?.checkOutAt ?? null) });
  }

  const presentCount = days.filter((day) => day.status === "PRESENT" || day.status === "LATE").length;
  const lateCount = days.filter((day) => day.status === "LATE").length;
  const absentCount = days.filter((day) => day.status === "ABSENT").length;
  const leaveCount = days.filter((day) => day.status === "LEAVE").length;

  const previous = month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
  const next = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={<><CalendarCheck className="h-4 w-4" />Area Pribadi</>}
        title="Absensi Saya"
        description="Rekap kehadiran bulanan berdasarkan data mesin fingerprint dan cuti yang disetujui."
      />

      <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Hadir" value={presentCount} tone="emerald" />
        <MetricCard label="Telat" value={lateCount} tone={lateCount ? "amber" : "slate"} />
        <MetricCard label="Absen" value={absentCount} tone={absentCount ? "rose" : "slate"} />
        <MetricCard label="Cuti/Izin" value={leaveCount} tone="cyan" />
      </div>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href={`/my/attendance?month=${previous}`}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-accent"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="text-base font-semibold">
            {monthNames[month - 1]} {year}
          </div>
          <Link
            href={`/my/attendance?month=${next}`}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-accent"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <AttendanceCalendar year={year} month={month} days={days} />
      </section>
    </div>
  );
}
