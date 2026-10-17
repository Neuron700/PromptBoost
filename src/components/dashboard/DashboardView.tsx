"use client";
import { useMemo } from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import { categoryMeta, templates } from "@/lib/prompts";
import { categoryCounts, dailyCounts, pickTemplates } from "@/lib/dashboard";
import type { HistoryItem } from "@/types/prompt";
import ActivityChart from "./ActivityChart";
import CategoryStats from "./CategoryStats";
import TemplatePicks from "./TemplatePicks";

const LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(categoryMeta).map(([k, v]) => [k, v.label])
);

export default function DashboardView({ items, demo }: { items: HistoryItem[]; demo: boolean }) {
  const days = useMemo(() => dailyCounts(items, 7), [items]);
  const stats = useMemo(() => categoryCounts(items, LABELS), [items]);
  const picks = useMemo(() => pickTemplates(stats, templates, 4), [stats]);

  return (
    <div className="mx-auto max-w-[1160px] px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
      <header className="forge-rise">
        <div className="font-mono text-[11px] tracking-[0.16em] text-[var(--forge-muted)]">RINGKASAN</div>
        <h1 className="mt-1 text-xl sm:text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--forge-muted)]">Denyut aktivitas dan bahan bakar prompt kamu.</p>
      </header>

      {demo && (
        <div className="forge-pop mt-5 rounded-xl border border-[var(--border)] bg-[var(--muted)]/60 px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <Info size={14} className="text-[var(--forge-ember)] shrink-0" />
          <span className="text-xs">Ini contoh data. Masuk supaya grafik ini terisi dari prompt milikmu sendiri.</span>
          <Link
            href="/auth"
            className="ml-auto h-8 px-3 rounded-full bg-[var(--forge-ember)] hover:bg-[var(--forge-ember-hover)] text-white text-xs font-medium inline-flex items-center shrink-0 transition-colors"
          >
            Masuk
          </Link>
        </div>
      )}

      <div className="mt-5 grid lg:grid-cols-3 gap-4 forge-stagger">
        <div className="lg:col-span-2">
          <ActivityChart days={days} />
        </div>
        <div>
          <CategoryStats stats={stats} />
        </div>
      </div>

      <div className="mt-4 forge-rise" style={{ animationDelay: "140ms" }}>
        <TemplatePicks items={picks} />
      </div>
    </div>
  );
}
