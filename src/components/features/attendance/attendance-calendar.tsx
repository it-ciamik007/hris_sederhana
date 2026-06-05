export function AttendanceCalendar({ days }: { days: { date: string; status: string }[] }) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((day) => (
        <div key={day.date} className="aspect-square rounded-sm border bg-white p-1 text-xs">
          <div>{day.date.slice(-2)}</div>
          <div className="mt-1 text-muted-foreground">{day.status}</div>
        </div>
      ))}
    </div>
  );
}
