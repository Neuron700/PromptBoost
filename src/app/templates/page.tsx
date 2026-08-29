"use client";
import { useState } from "react";
import { templates, categoryMeta } from "@/lib/prompts";
import type { Category, TemplateItem } from "@/types/prompt";
import Link from "next/link";

export default function TemplatesPage() {
  const [filter, setFilter] = useState<Category | "all">("all");
  const [active, setActive] = useState<TemplateItem | null>(null);
  const [vars, setVars] = useState<Record<string,string>>({});

  const filtered = filter==="all" ? templates : templates.filter(t=> t.category===filter);
  const filled = active ? active.prompt.replace(/\{(\w+)\}/g, (_,k)=> vars[k] || `{${k}}`) : "";

  return (
    <div className="mx-auto max-w-[1160px] px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Prompt Templates</h1>
          <p className="text-sm text-[var(--forge-muted)]">Pilih template, isi variabel, lalu kirim ke Optimizer.</p>
        </div>
        <div className="flex gap-1.5 overflow-auto pb-1">
          <button onClick={()=> setFilter("all")} className={`h-8 px-3 rounded-full text-xs font-medium border shrink-0 ${filter==="all" ? "bg-[var(--forge-ink)] text-white border-[var(--forge-ink)] dark:bg-white dark:text-black" : "bg-[var(--card)] border-[var(--border)]"}`}>All</button>
          {Object.entries(categoryMeta).map(([k,v])=> (
            <button key={k} onClick={()=> setFilter(k as Category)} className={`h-8 px-3 rounded-full text-xs font-medium border shrink-0 ${filter===k ? "bg-[var(--forge-ink)] text-white border-[var(--forge-ink)] dark:bg-white dark:text-black" : "bg-[var(--card)] border-[var(--border)]"}`}>{v.label}</button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(t=> (
          <div key={t.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 flex flex-col">
            <div className="text-[11px] font-mono tracking-widest text-[var(--forge-muted)]">{categoryMeta[t.category].label}</div>
            <div className="font-semibold text-sm mt-1">{t.title}</div>
            <div className="text-xs text-[var(--forge-muted)] mt-1 line-clamp-2">{t.description}</div>
            <div className="mt-3 rounded-lg bg-[var(--muted)] p-2 font-mono text-xs leading-4 line-clamp-3 whitespace-pre-wrap">{t.prompt}</div>
            <button onClick={()=> { setActive(t); setVars({}); }} className="mt-3 h-8 rounded-full bg-[var(--forge-ember)] text-white text-xs font-medium">Use Template</button>
          </div>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4" onClick={()=> setActive(null)}>
          <div className="w-full max-w-[640px] rounded-2xl bg-[var(--card)] border border-[var(--border)] p-5" onClick={e=> e.stopPropagation()}>
            <div className="text-sm font-semibold">{active.title}</div>
            <div className="text-xs text-[var(--forge-muted)]">{active.description}</div>
            {active.vars && (
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                {active.vars.map(v=> (
                  <label key={v.key} className="text-xs">
                    <span className="font-medium">{v.label} <span className="font-mono text-[var(--forge-muted)]">{"{"+v.key+"}"}</span></span>
                    <input value={vars[v.key]||""} onChange={e=> setVars(prev=> ({...prev, [v.key]: e.target.value}))} placeholder={v.placeholder}
                      className="mt-1 w-full h-9 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm focus:outline-none focus:border-[var(--forge-ember)]" />
                  </label>
                ))}
              </div>
            )}
            <div className="mt-4 rounded-xl bg-[var(--muted)] p-3 font-mono text-xs leading-5 whitespace-pre-wrap max-h-[220px] overflow-auto">{filled}</div>
            <div className="mt-4 flex gap-2">
              <Link href={`/optimizer?template=${encodeURIComponent(filled)}`} className="h-9 px-4 rounded-full bg-[var(--forge-ember)] text-white text-sm font-medium inline-flex items-center">Generate Prompt</Link>
              <button onClick={()=> setActive(null)} className="h-9 px-4 rounded-full border border-[var(--border)] text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
