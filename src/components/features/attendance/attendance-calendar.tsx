import { cn } from "@/lib/utils";

export type CalendarDay = {
  date: string; // YYYY-MM-DD
  status: string; // PRESENT | LATE | ABSENT | LEAVE | HOLIDAY | WEEKEND | FUTURE
  label?: string;
  checkIn?: string | null;
  checkOut?: string | null;
};

const weekdayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const statusStyles: Record<string, string> = {
  PRESENT: "border-emerald-300/60 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100",
  LATE: "border-amber-300/60 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-100",
  ABSENT: "border-rose-300/60 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-100",
  LEAVE: "border-cyan-300/60 bg-cyan-50 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-100",
  HOLIDAY: "border-border bg-muted text-muted-foreground",
  WEEKEND: "border-border bg-muted/60 text-muted-foreground",
  FUTURE: "border-border bg-background text-muted-foreground/60"
};

const statusLabels: Record<string, string> = {
  PRESENT: "Hadir",
  LATE: "Telat",
  ABSENT: "Absen",
  LEAVE: "Cuti",
  HOLIDAY: "Libur",
  WEEKEND: "Akhir pekan",
  FUTURE: ""
};

export function AttendanceCalendar({ year, month, days }: { year: number; month: number; days: CalendarDay[] }) {
  // month: 1-12. getUTCDay(): 0=Min..6=Sab; offset agar grid mulai Senin.
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const offset = (firstWeekday + 6) % 7;

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {weekdayLabels.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: offset }).map((_, index) => (
          <div key={`pad-${index}`} />
        ))}
        {days.map((day) => (
          <div
            key={day.date}
            className={cn(
              "min-h-16 rounded-lg border p-1.5 text-xs sm:min-h-20 sm:p-2",
              statusStyles[day.status] ?? statusStyles.FUTURE
            )}
            title={day.label ?? statusLabels[day.status] ?? day.status}
          >
            <div className="font-semibold">{Number(day.date.slice(-2))}</div>
            <div className="mt-0.5 hidden truncate text-[10px] opacity-80 sm:block">
              {day.label ?? statusLabels[day.status] ?? ""}
            </div>
            {(day.checkIn || day.checkOut) && (
              <div className="mt-0.5 hidden text-[10px] opacity-70 md:block">
                {day.checkIn ?? "--:--"} - {day.checkOut ?? "--:--"}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {(["PRESENT", "LATE", "ABSENT", "LEAVE", "HOLIDAY"] as const).map((status) => (
          <span key={status} className="inline-flex items-center gap-1.5">
            <span className={cn("h-3 w-3 rounded border", statusStyles[status])} />
            {statusLabels[status]}
          </span>
        ))}
      </div>
    </div>
  );
}
