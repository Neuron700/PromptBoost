import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative border-b border-[var(--border)]">
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 pt-14 sm:pt-20 pb-12 sm:pb-16">
        <div className="max-w-[620px]">
          <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest bg-[var(--card)]/80 border border-[var(--border)] rounded-full px-3 py-1">
            <Sparkles size={12} /> FOR MAHASISWA • DEVELOPER • CREATOR
          </div>
          <h1 className="mt-4 text-[30px] sm:text-[46px] font-[700] leading-[0.95] tracking-tight">
            Build better prompts.<br />
            <span className="text-[var(--forge-muted)]">Get better AI results.</span>
          </h1>
          <p className="mt-3 text-[15px] leading-6 text-[var(--forge-muted)] max-w-[520px]">
            Transform ide mentah yang vage menjadi prompt terstruktur per kategori. Siap paste ke ChatGPT, Claude, atau Midjourney.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/optimizer" className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-[var(--forge-ember)] hover:bg-[var(--forge-ember-hover)] text-white text-sm font-medium transition-colors min-h-[44px]">
              Start Building <ArrowRight size={16} />
            </Link>
            <Link href="/templates" className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-[var(--border)] bg-[var(--card)]/80 hover:bg-[var(--muted)] text-sm font-medium transition-colors min-h-[44px]">
              Lihat Templates
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}