"use client";
export default function ForgeRail({ active }: { active: boolean }) {
  return (
    <div className="hidden lg:flex flex-col items-center gap-2 py-4 w-10 shrink-0">
      <div className={`w-px flex-1 bg-[var(--border)] transition-colors ${active ? "opacity-100" : "opacity-60"}`} />
      <div className={`w-8 h-8 rounded-full grid place-items-center border-2 transition-all duration-500 ${active ? "bg-[var(--forge-ember)] border-[var(--forge-ember)] text-white animate-pulse" : "bg-[var(--card)] border-[var(--border)] text-[var(--forge-muted)]"}`} aria-hidden>
        <span className="text-[11px] font-mono font-bold">⇄</span>
      </div>
      <div className={`w-px flex-1 bg-[var(--border)] ${active ? "opacity-100" : "opacity-60"}`} />
    </div>
  );
}
