"use client";
import type { CategoryCount } from "@/lib/dashboard";

export default function CategoryStats({ stats }: { stats: CategoryCount[] }) {
  let max = 1;
  for (const s of stats) if (s.count > max) max = s.count;
  const total = stats.reduce((s, c) => s + c.count, 0);

  return (
    <div className="h-full w-full rounded-2xl border border-[var(--border)] bg-[var(--card)]/70 backdrop-blur-sm p-5 sm:p-6 flex flex-col">
      <div className="font-mono text-[11px] tracking-[0.16em] text-[var(--forge-muted)]">KATEGORI</div>
      <div className="mt-1 font-semibold text-sm">Pemakaian per kategori</div>
      <div className="mt-1 text-[11px] text-[var(--forge-muted)]">{total} prompt terbagi di {stats.length} kategori</div>

      <ul className="mt-4 space-y-2.5">
        {stats.map((s) => {
          const pct = (s.count / max) * 100;
          return (
            <li key={s.category} className="flex items-center gap-3">
              <span className="w-[104px] shrink-0 text-xs truncate">{s.label}</span>
              <span className="flex-1 h-2 rounded-full bg-[var(--muted)] overflow-hidden">
                <span
                  className="block h-full rounded-full bg-[var(--forge-ember)] forge-rise"
                  style={{ width: `${s.count > 0 ? Math.max(pct, 6) : 0}%` }}
                />
              </span>
              <span className="w-6 text-right font-mono text-xs tabular-nums text-[var(--forge-muted)]">{s.count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
