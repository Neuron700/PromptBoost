"use client";
import type { Analysis } from "@/types/prompt";

export function ScoreRing({ score, label, size=56 }: { score:number; label?:string; size?:number }) {
  const r = 22; const c = 2*Math.PI*r; const off = c - (score/100)*c;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width:size, height:size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} stroke="var(--border)" strokeWidth={4} fill="none" />
          <circle cx={size/2} cy={size/2} r={r} stroke="var(--forge-ember)" strokeWidth={4} fill="none"
            strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
            style={{ transition:"stroke-dashoffset 700ms cubic-bezier(.4,0,.2,1)" }} />
        </svg>
        <span className="absolute inset-0 grid place-items-center font-mono text-sm font-bold">{score}</span>
      </div>
      {label && <span className="text-[10px] tracking-widest text-[var(--forge-muted)]">{label}</span>}
    </div>
  );
}

export function AnalysisBars({ analysis }: { analysis: Analysis }) {
  const items: [string, number][] = [
    ["Clarity", analysis.clarity],
    ["Context", analysis.context],
    ["Specificity", analysis.specificity],
    ["Constraints", analysis.constraints],
    ["Output Format", analysis.outputFormat],
  ];
  return (
    <div className="space-y-2.5">
      {items.map(([k,v])=> (
        <div key={k} className="flex items-center gap-3">
          <span className="w-[92px] text-xs text-[var(--forge-muted)]">{k}</span>
          <div className="flex-1 h-1.5 rounded-full bg-[var(--muted)] overflow-hidden">
            <div className="h-full bg-[var(--forge-ink)] dark:bg-white rounded-full transition-all duration-700" style={{ width: `${v}%` }} />
          </div>
          <span className="w-7 text-right font-mono text-xs">{v}</span>
        </div>
      ))}
    </div>
  );
}
