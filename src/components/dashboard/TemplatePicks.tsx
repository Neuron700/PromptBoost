"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { categoryMeta } from "@/lib/prompts";
import type { TemplateItem } from "@/types/prompt";

export default function TemplatePicks({ items }: { items: TemplateItem[] }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/70 backdrop-blur-sm p-5 sm:p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] tracking-[0.16em] text-[var(--forge-muted)]">REKOMENDASI</div>
          <div className="mt-1 font-semibold text-sm">Template untuk kamu</div>
        </div>
        <Link href="/templates" className="text-xs text-[var(--forge-muted)] hover:text-[var(--foreground)] underline shrink-0">
          Semua template
        </Link>
      </div>

      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 forge-stagger">
        {items.map((t) => (
          <Link
            key={t.id}
            href={`/optimizer?template=${encodeURIComponent(t.prompt)}`}
            className="group rounded-xl border border-[var(--border)] bg-[var(--background)]/60 p-3.5 flex flex-col gap-1.5 hover:border-[var(--forge-ember)] transition-colors"
          >
            <span className="font-mono text-[10px] tracking-widest text-[var(--forge-muted)]">{categoryMeta[t.category]?.label ?? t.category}</span>
            <span className="font-semibold text-xs">{t.title}</span>
            <span className="text-[11px] leading-4 text-[var(--forge-muted)] line-clamp-2">{t.description}</span>
            <span className="mt-1 block rounded-lg bg-[var(--muted)]/70 px-2.5 py-2">
              <span className="font-mono text-[10px] leading-4 text-[var(--forge-muted)] line-clamp-2">{t.prompt}</span>
            </span>
            <span className="mt-auto pt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[var(--forge-ember)]">
              Pakai
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
