export function MetricCard({
  label,
  value,
  tone = "cyan"
}: {
  label: string;
  value: string | number;
  tone?: "cyan" | "emerald" | "amber" | "rose" | "slate";
}) {
  const tones = {
    cyan: "from-cyan-50 via-white to-white text-cyan-700 border-cyan-100",
    emerald: "from-emerald-50 via-white to-white text-emerald-700 border-emerald-100",
    amber: "from-amber-50 via-white to-white text-amber-700 border-amber-100",
    rose: "from-rose-50 via-white to-white text-rose-700 border-rose-100",
    slate: "from-slate-50 via-white to-white text-slate-700 border-slate-100"
  };

  return (
    <div className={`rounded-xl border bg-gradient-to-br p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${tones[tone]}`}>
      <div className="text-xs font-semibold uppercase opacity-75">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
