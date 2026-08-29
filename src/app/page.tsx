import Hero from "@/components/Hero";
import Link from "next/link";
import { Hammer, Layers, Sparkles, ArrowRight, Check } from "lucide-react";

export default function Home() {
  return (
    <div className="flex-1">
      <Hero />

      <section className="mx-auto max-w-[1160px] px-4 sm:px-6 pb-8">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { title:"Pilih Tujuan", desc:"9 kategori dengan struktur berbeda. Coding ≠ Writing ≠ Image.", icon: Layers },
            { title:"Tempa Prompt", desc:"AI merapikan intent, konteks, dan constraints jadi blok ROLE/OBJECTIVE.", icon: Hammer },
            { title:"Bandingkan Skor", desc:"Lihat Before/After 38 → 89 plus breakdown Clarity/Context.", icon: Sparkles },
          ].map((f)=> (
            <div key={f.title} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <f.icon size={18} className="text-[var(--forge-ember)]" />
              <div className="mt-3 font-semibold text-sm">{f.title}</div>
              <div className="mt-1 text-sm leading-5 text-[var(--forge-muted)]">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1160px] px-4 sm:px-6 pb-10">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--forge-ink)] dark:bg-white text-white dark:text-[var(--forge-paper)] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] tracking-[0.16em] opacity-70">SIAP MENEMPA?</div>
            <div className="mt-1 text-xl font-semibold">Mulai dari ide mentah, bawa pulang prompt siap pakai.</div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs opacity-80">
              <span className="inline-flex items-center gap-1.5"><Check size={12}/> Copy Text/MD/JSON</span>
              <span className="inline-flex items-center gap-1.5"><Check size={12}/> Score breakdown</span>
              <span className="inline-flex items-center gap-1.5"><Check size={12}/> History</span>
            </div>
          </div>
          <Link href="/optimizer" className="inline-flex items-center gap-2 h-10 px-6 rounded-full bg-[var(--forge-ember)] text-white font-medium shrink-0">
            Buka Optimizer <ArrowRight size={16}/>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1160px] px-4 sm:px-6 pb-12">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <div className="text-sm font-semibold">Cara kerja</div>
          <div className="mt-4 flex flex-col sm:flex-row gap-4 items-stretch">
            <div className="flex-1 rounded-xl bg-[var(--muted)] p-4 border border-transparent">
              <div className="w-8 h-8 rounded-full bg-[var(--forge-ink)] dark:bg-white text-white dark:text-black grid place-items-center text-xs font-mono">→</div>
              <div className="mt-3 font-medium text-sm">Tulis prompt mentah</div>
              <div className="text-xs text-[var(--forge-muted)] mt-1">Contoh: “buat website portfolio keren”</div>
            </div>
            <div className="hidden sm:grid place-items-center text-[var(--forge-muted)]">•</div>
            <div className="flex-1 rounded-xl bg-[var(--muted)] p-4 border border-transparent">
              <div className="w-8 h-8 rounded-full bg-[var(--forge-ember)] text-white grid place-items-center"><Hammer size={14}/></div>
              <div className="mt-3 font-medium text-sm">Pilih kategori dan tempa</div>
              <div className="text-xs text-[var(--forge-muted)] mt-1">Coding, Writing, Image, dan lainnya</div>
            </div>
            <div className="hidden sm:grid place-items-center text-[var(--forge-muted)]">•</div>
            <div className="flex-1 rounded-xl bg-[var(--muted)] p-4 border border-transparent">
              <div className="w-8 h-8 rounded-full bg-[var(--forge-signal)] text-white grid place-items-center text-xs font-mono">✓</div>
              <div className="mt-3 font-medium text-sm">Copy & bandingkan</div>
              <div className="text-xs text-[var(--forge-muted)] mt-1">Before 38 → After 89</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
