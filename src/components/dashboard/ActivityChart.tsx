"use client";
import type { DayCount } from "@/lib/dashboard";

export default function ActivityChart({ days }: { days: DayCount[] }) {
  const total = days.reduce((s, d) => s + d.count, 0);
  let max = 1;
  let peak: DayCount | null = null;
  for (const d of days) {
    if (d.count > max) max = d.count;
    if (!peak || d.count > peak.count) peak = d;
  }

  return (
    <div className="h-full w-full rounded-2xl border border-[var(--border)] bg-[var(--card)]/70 backdrop-blur-sm p-5 sm:p-6 flex flex-col">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] tracking-[0.16em] text-[var(--forge-muted)]">AKTIVITAS</div>
          <div className="mt-1 font-semibold text-sm">Tujuh hari terakhir</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl font-bold tabular-nums">{total}</div>
          <div className="text-[11px] text-[var(--forge-muted)]">prompt ditempa</div>
        </div>
      </div>

      <div
        role="img"
        aria-label={`Grafik aktivitas tujuh hari terakhir. Total ${total} prompt. Puncak ${peak ? peak.count : 0} pada hari ${peak ? peak.label : "-"}.`}
        className="mt-5 flex-1 flex flex-col"
      >
        <ul className="sr-only">
          {days.map((d) => (
            <li key={d.key}>{`${d.label}: ${d.count} prompt`}</li>
          ))}
        </ul>
        <div className="flex-1 min-h-[140px] flex items-end gap-2 sm:gap-3" aria-hidden="true">
          {days.map((d, i) => {
            const h = Math.round((d.count / max) * 116) + (d.count > 0 ? 8 : 3);
            return (
              <div key={d.key} className="flex-1 min-w-0 flex flex-col items-center justify-end gap-1.5 h-full">
                <span className="font-mono text-[11px] tabular-nums text-[var(--forge-muted)]">{d.count}</span>
                <div
                  className="w-full rounded-t-md bg-[var(--forge-ember)] forge-rise"
                  style={{ height: `${h}px`, animationDelay: `${i * 45}ms` }}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex gap-2 sm:gap-3" aria-hidden="true">
          {days.map((d) => (
            <span key={d.key} className="flex-1 text-center text-[11px] text-[var(--forge-muted)]">{d.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
