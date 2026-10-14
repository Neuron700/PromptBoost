"use client";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { SpiderStage, WordTag } from "@/types/prompt";
import ForceCanvas from "./ForceCanvas";

const TAG_VAR: Record<string, string> = {
  claim: "--forge-muted",
  owner: "--forge-ink",
  file: "--forge-warn",
  approval: "--forge-signal",
  vague: "--forge-ember",
};

const TAG_LABEL: Record<string, string> = {
  claim: "claim",
  owner: "owner",
  file: "file",
  approval: "approval",
  vague: "vague",
};

interface Props {
  loading: boolean;
  stages: SpiderStage[] | null;
  tags: WordTag[] | null;
  dataKey: string;
  before: number | null;
  after: number | null;
  notice?: string | null;
}

export default function SpiderPanel({ loading, stages, tags, dataKey, before, after, notice }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [stageIdx, setStageIdx] = useState(0);
  const [selected, setSelected] = useState<WordTag | null>(null);
  const [shown, setShown] = useState<number | null>(null);
  const reduced = useMemo(() => {
    try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
  }, []);

  useEffect(() => { setSelected(null); }, [dataKey]);

  useEffect(() => {
    if (!loading || !tags || tags.length === 0 || reduced) {
      if (!loading) setActiveIndex(null);
      return;
    }
    setStageIdx(0);
    let w = 0;
    const t = setInterval(() => {
      w += 1;
      setActiveIndex(w % tags.length);
      setStageIdx(Math.floor(w / 4) % 6);
    }, 450);
    return () => clearInterval(t);
  }, [loading, tags, dataKey, reduced]);

  useEffect(() => {
    if (after == null) { setShown(before); return; }
    if (reduced || before == null) { setShown(after); return; }
    let raf = 0;
    const start = performance.now();
    const dur = 1200;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setShown(Math.round(before + (after - before) * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [after, before, reduced, dataKey]);

  const byIndex = useMemo(() => {
    const m = new Map<number, WordTag>();
    (tags ?? []).forEach((t) => m.set(t.index, t));
    return m;
  }, [tags]);

  const pick = (index: number | null) => {
    if (index == null) { setSelected(null); return; }
    setSelected(byIndex.get(index) ?? null);
  };

  const vagueCount = useMemo(() => (tags ?? []).filter((t) => t.tag === "vague").length, [tags]);
  const shownStages: SpiderStage[] | null = useMemo(() => {
    if (!stages) return null;
    if (!loading) return stages;
    return stages.map((s, i) => ({ ...s, status: (i < stageIdx ? "done" : i === stageIdx ? "active" : "idle") as SpiderStage["status"] }));
  }, [stages, loading, stageIdx]);
  const activeStage = shownStages?.find((s) => s.status === "active") ?? (loading ? shownStages?.[stageIdx] : shownStages?.[shownStages.length - 1]);

  if (!tags || tags.length === 0) return null;

  return (
    <section aria-label="Spider analysis" className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-mono text-[11px] tracking-[0.14em] text-[var(--forge-muted)]">SPIDER ANALYSIS</div>
        <div className="flex items-center gap-3 text-[11px] text-[var(--forge-muted)] flex-wrap">
          {Object.entries(TAG_LABEL).map(([k, label]) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: `var(${TAG_VAR[k]})` }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {shownStages && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-1.5" role="list" aria-label="Tahap analisis">
            {shownStages.map((s) => (
              <span key={s.name} role="listitem" title={s.detail}
                className={`h-7 px-3 rounded-full text-[11px] font-mono tracking-widest inline-flex items-center gap-1.5 border transition-colors
                ${s.status === "done" ? "bg-[var(--forge-ink)] text-white border-[var(--forge-ink)] dark:bg-white dark:text-black dark:border-white"
                  : s.status === "active" ? "bg-[var(--forge-ember)] text-white border-transparent animate-pulse"
                  : "bg-[var(--card)] text-[var(--forge-muted)] border-[var(--border)]"}`}>
                {s.status === "done" ? "✓ " : ""}{s.name}
              </span>
            ))}
          </div>
          {activeStage && <div className="mt-2 text-xs text-[var(--forge-muted)]">{activeStage.name}: {activeStage.detail}</div>}
        </div>
      )}

      <div className="mt-3 relative rounded-xl bg-[var(--muted)] overflow-hidden h-[320px] sm:h-[380px]">
        {reduced ? (
          <div className="absolute inset-0 overflow-auto p-3">
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <button key={t.index} type="button" onClick={() => pick(t.index)}
                  className={`h-8 px-2.5 rounded-full text-xs font-mono border cursor-pointer ${selected?.index === t.index ? "bg-[var(--forge-ink)] text-white border-[var(--forge-ink)] dark:bg-white dark:text-black" : "bg-[var(--card)] border-[var(--border)]"}`}>
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: `var(${TAG_VAR[t.tag]})` }} />
                  {t.word}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ForceCanvas tags={tags} dataKey={dataKey} activeIndex={loading ? activeIndex : null} selectedIndex={selected?.index ?? null} onSelect={pick} />
        )}
        {loading && !reduced && (
          <div className="absolute top-2 left-2 text-[11px] font-mono tracking-widest bg-[var(--forge-ink)] dark:bg-white text-white dark:text-black rounded-full px-2.5 py-1">
            Merayap {activeIndex != null ? `${activeIndex + 1}/${tags.length}` : ""} • {shownStages?.[stageIdx]?.name ?? ""}
          </div>
        )}
        {selected && (
          <div className="absolute bottom-2 left-2 right-2 rounded-xl bg-[var(--card)] border border-[var(--border)] p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold truncate">{selected.word}</span>
              <span className="text-[10px] font-mono tracking-widest px-2 py-0.5 rounded-full text-white shrink-0" style={{ background: `var(${TAG_VAR[selected.tag]})` }}>
                {TAG_LABEL[selected.tag]}
              </span>
              <button type="button" onClick={() => setSelected(null)} aria-label="Tutup" className="ml-auto w-7 h-7 grid place-items-center rounded-full border border-[var(--border)] shrink-0">
                <X size={13} />
              </button>
            </div>
            <div className="mt-1.5 text-xs leading-5">{selected.reason}</div>
            <div className="text-xs leading-5 text-[var(--forge-muted)]">Saran: {selected.suggestion}</div>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[11px] tracking-widest text-[var(--forge-muted)]">SKOR</span>
          <span className="font-mono text-2xl font-bold">{shown ?? "•"}</span>
          <span className="font-mono text-xs text-[var(--forge-muted)]">/100</span>
        </div>
        <div className="text-xs text-[var(--forge-muted)]">{tags.length} kata dipetakan • {vagueCount} vage</div>
        {notice && <div className="text-xs bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-full px-2.5 py-1">{notice}</div>}
      </div>
    </section>
  );
}
