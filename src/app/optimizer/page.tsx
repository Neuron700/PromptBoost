"use client";
import { useEffect, useState } from "react";
import type { Category, OutputMode, OptimizeResponse, HistoryItem } from "@/types/prompt";
import CategorySelector from "@/components/CategorySelector";
import CopyButton from "@/components/CopyButton";
import ForgeRail from "@/components/ForgeRail";
import { ScoreRing, AnalysisBars } from "@/components/ScoreCard";
import { Hammer, RotateCcw, Sparkles, AlertCircle, History as HistoryIcon } from "lucide-react";

export default function OptimizerPage() {
  const [prompt, setPrompt] = useState("buat website portfolio keren untuk mahasiswa informatika, ada dark mode");
  useEffect(()=> {
    const p = new URLSearchParams(window.location.search).get("template");
    if(p) setPrompt(decodeURIComponent(p));
  }, []);
  const [category, setCategory] = useState<Category>("coding");
  const [mode, setMode] = useState<OutputMode>("balanced");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizeResponse | null>(null);

  const optimize = async () => {
    if (!prompt.trim()) { setError("Prompt kosong. Tulis ide mentah terlebih dahulu."); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/optimize", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ prompt, category, outputMode: mode }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses. Error 500 coba lagi.");
      setResult(data);
      const item: HistoryItem = { id: Date.now().toString(), title: prompt.slice(0,48), original: prompt, optimized: data.optimizedPrompt, category, score: data.score, createdAt: new Date().toISOString() };
      const prev = JSON.parse(localStorage.getItem("forge-history") || "[]");
      localStorage.setItem("forge-history", JSON.stringify([item, ...prev].slice(0,50)));
      // simpan ke database biar tidak hilang
      fetch("/api/history", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) }).catch(()=>{});
    } catch (e:any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const reset = () => { setPrompt(""); setResult(null); setError(null); };

  return (
    <div className="mx-auto max-w-[1160px] px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Prompt Optimizer</h1>
          <p className="text-sm text-[var(--forge-muted)]">Bengkel tempa prompt pilih tujuan tempa bandingkan skor</p>
        </div>
        <a href="/history" className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono tracking-widest border border-[var(--border)] rounded-full px-3 py-1.5 hover:bg-[var(--muted)]">
          <HistoryIcon size={12}/> HISTORY
        </a>
      </div>

      <div className="mt-6 flex flex-col lg:flex-row gap-4 items-stretch">
        {/* LEFT: input */}
        <section className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 flex flex-col min-w-0">
          <label className="font-mono text-[11px] tracking-[0.14em] text-[var(--forge-muted)]">YOUR PROMPT</label>
          <textarea value={prompt} onChange={e=> setPrompt(e.target.value)}
            placeholder="Tulis ide mentah, mis: buat website portfolio keren..."
            className="mt-2 min-h-[160px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm leading-6 focus:outline-none focus:border-[var(--forge-ember)] resize-y"
            aria-label="Prompt input" />
          <div className="mt-2 flex items-center justify-between text-xs text-[var(--forge-muted)]">
            <span>{prompt.length} karakter</span>
            <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 hover:text-[var(--foreground)] cursor-pointer"><RotateCcw size={12}/> Reset</button>
          </div>

          <div className="mt-5">
            <div className="font-mono text-[11px] tracking-[0.14em] text-[var(--forge-muted)]">GOAL PILIH KATEGORI</div>
            <div className="mt-2"><CategorySelector value={category} onChange={setCategory} /></div>
          </div>

          <div className="mt-5">
            <div className="font-mono text-[11px] tracking-[0.14em] text-[var(--forge-muted)]">OUTPUT MODE</div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["minimal","balanced","detailed"] as OutputMode[]).map(m=> (
                <button key={m} type="button" onClick={()=> setMode(m)} className={`h-9 rounded-full text-xs font-medium border capitalize cursor-pointer ${mode===m ? "bg-[var(--forge-ink)] text-white border-[var(--forge-ink)] dark:bg-white dark:text-black" : "bg-[var(--card)] border-[var(--border)] hover:bg-[var(--muted)]"}`}>{m}</button>
              ))}
            </div>
          </div>

          <button type="button" onClick={optimize} disabled={loading}
            className="mt-5 h-12 sm:h-11 rounded-full bg-[var(--forge-ember)] hover:bg-[var(--forge-ember-hover)] disabled:opacity-50 text-white font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer text-[15px] sm:text-sm min-h-[48px]">
            {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menempa...</> : <><Hammer size={16}/> Optimize</>}
          </button>

          {error && (
            <div role="alert" className="mt-3 flex items-start gap-2 text-sm bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-3 text-red-700 dark:text-red-300">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> <span>{error}</span>
            </div>
          )}
        </section>

        <ForgeRail active={loading} />

        {/* RIGHT: result */}
        <section className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 min-w-0 flex flex-col overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="font-mono text-[11px] tracking-[0.14em] text-[var(--forge-muted)]">OPTIMIZED PROMPT</div>
            {result && <div className="flex items-center gap-1.5 flex-wrap"><CopyButton text={result.optimizedPrompt} variant="text"/><CopyButton text={result.optimizedPrompt} variant="markdown"/><CopyButton text={result.optimizedPrompt} variant="json"/></div>}
          </div>

          {!result ? (
            <div className="flex-1 grid place-items-center py-16 text-center">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[var(--muted)] grid place-items-center mx-auto"><Sparkles size={18} className="text-[var(--forge-muted)]"/></div>
                <div className="mt-3 text-sm font-medium">Belum ada hasil</div>
                <div className="text-xs text-[var(--forge-muted)] mt-1 max-w-[28ch]">Tulis prompt di kiri, pilih kategori, lalu tekan Optimize. Hasil akan muncul di sini.</div>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex-1 flex flex-col gap-4 min-w-0">
              <div className="rounded-xl bg-[var(--muted)] p-3">
                <pre className="whitespace-pre-wrap font-mono text-xs leading-5 overflow-auto max-h-[320px]">{result.optimizedPrompt}</pre>
              </div>

              <div className="rounded-xl border border-[var(--border)] p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold">PROMPT SCORE</div>
                  <span className="text-xs text-[var(--forge-muted)] font-mono">{result.score}/100</span>
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <ScoreRing score={result.score} label="AFTER" />
                  <div className="text-xs">
                    <div className="text-[var(--forge-muted)]">Before <span className="font-mono font-medium text-[var(--foreground)]">{result.beforeScore}</span> → After <span className="font-mono font-bold text-[var(--forge-ember)]">{result.score}</span></div>
                    <div className="mt-1 inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full px-2 py-0.5 font-mono">+{result.score - result.beforeScore} improvement</div>
                  </div>
                </div>
                <div className="mt-4"><AnalysisBars analysis={result.analysis} /></div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-[var(--border)] p-3">
                  <div className="text-xs font-semibold">Improvements</div>
                  <ul className="mt-2 space-y-1.5 text-xs text-[var(--forge-muted)] list-disc pl-4">
                    {result.improvements.map((im,i)=> <li key={i}>{im}</li>)}
                  </ul>
                </div>
                <div className="rounded-xl border border-[var(--border)] p-3">
                  <div className="text-xs font-semibold">Suggestions</div>
                  <ul className="mt-2 space-y-1.5 text-xs text-[var(--forge-muted)] list-disc pl-4">
                    {result.suggestions.map((s,i)=> <li key={i}>{s}</li>)}
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                <div className="px-3 py-2 bg-[var(--muted)] font-mono text-[11px] tracking-widest">BEFORE DAN AFTER</div>
                <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]">
                  <div className="p-3">
                    <div className="text-[11px] font-mono tracking-widest text-[var(--forge-muted)]">ORIGINAL {result.beforeScore}</div>
                    <div className="mt-2 text-xs leading-5 whitespace-pre-wrap break-words bg-[var(--muted)] rounded-lg p-2">{prompt}</div>
                  </div>
                  <div className="p-3">
                    <div className="text-[11px] font-mono tracking-widest text-[var(--forge-muted)]">OPTIMIZED {result.score}</div>
                    <div className="mt-2 text-xs leading-5 whitespace-pre-wrap break-words bg-[var(--forge-ink)] dark:bg-white text-white dark:text-black rounded-lg p-2 max-h-[160px] overflow-auto">{result.optimizedPrompt.slice(0,420)}…</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
