import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section className="mx-auto max-w-[1160px] px-4 sm:px-6 pt-10 sm:pt-14 pb-8">
      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest bg-[var(--muted)] border border-[var(--border)] rounded-full px-3 py-1">
            <Sparkles size={12} /> FOR MAHASISWA • DEVELOPER • CREATOR
          </div>
          <h1 className="mt-4 text-[30px] sm:text-[42px] font-[700] leading-[0.95] tracking-tight">
            Build better prompts.<br />
            <span className="text-[var(--forge-muted)]">Get better AI results.</span>
          </h1>
          <p className="mt-3 text-[15px] leading-6 text-[var(--forge-muted)] max-w-[520px]">
            Transform ide mentah yang vage menjadi prompt terstruktur per kategori. Siap paste ke ChatGPT, Claude, atau Midjourney.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/optimizer" className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-[var(--forge-ember)] hover:bg-[var(--forge-ember-hover)] text-white text-sm font-medium transition-colors">
              Start Building <ArrowRight size={16} />
            </Link>
            <Link href="/templates" className="inline-flex items-center h-10 px-5 rounded-full border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-sm font-medium transition-colors">
              Lihat Templates
            </Link>
          </div>

        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <div className="h-8 flex items-center gap-1.5 px-3 border-b border-[var(--border)] bg-[var(--muted)]/50">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--forge-ember)]/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--forge-warn)]/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--forge-signal)]/70" />
            <span className="ml-2 font-mono text-[11px] tracking-widest text-[var(--forge-muted)]">RAW KE STRUCTURED</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]">
            <div className="p-4">
              <div className="text-[10px] tracking-widest font-mono text-[var(--forge-muted)]">RAW PROMPT</div>
              <div className="mt-2 text-sm leading-6 bg-[var(--muted)] rounded-lg p-3 font-mono">“buat website portfolio keren”</div>
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-full px-2.5 py-1">Score 38 vage</div>
            </div>
            <div className="p-4">
              <div className="text-[10px] tracking-widest font-mono text-[var(--forge-muted)]">STRUCTURED PROMPT</div>
              <div className="mt-2 text-xs leading-5 font-mono bg-[var(--forge-ink)] dark:bg-white text-white dark:text-black rounded-lg p-3 whitespace-pre-wrap">ROLE{"\n"}You are a senior frontend developer...{"\n\n"}OBJECTIVE{"\n"}Create a modern portfolio...{"\n\n"}REQUIREMENTS{"\n"}• Responsive{"\n"}• Modern UI{"\n"}• Dark mode</div>
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-full px-2.5 py-1">Score 89 siap pakai</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
