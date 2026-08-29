"use client";
import { categoryMeta } from "@/lib/prompts";
import type { Category } from "@/types/prompt";
import { Code2, PenLine, Search, Megaphone, GraduationCap, Image as ImageIcon, BarChart3, Briefcase, Layers } from "lucide-react";

const icons: Record<string, any> = {
  coding: Code2, writing: PenLine, research: Search, marketing: Megaphone, education: GraduationCap, image: ImageIcon, data: BarChart3, business: Briefcase, general: Layers
};

export default function CategorySelector({ value, onChange }: { value: Category; onChange:(c:Category)=>void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {Object.entries(categoryMeta).map(([key, meta])=> {
        const Icon = icons[key] ?? Layers;
        const active = value===key;
        return (
          <button key={key} type="button" onClick={()=> onChange(key as Category)}
            aria-pressed={active}
            className={`text-left p-3 sm:p-2.5 rounded-xl border text-xs leading-tight transition-colors cursor-pointer min-h-[48px] sm:min-h-0
            ${active ? "bg-[var(--forge-ink)] text-white border-[var(--forge-ink)] dark:bg-white dark:text-[var(--forge-paper)] dark:border-white" : "bg-[var(--card)] hover:bg-[var(--muted)] border-[var(--border)]"}`}>
            <Icon size={14} className={`mb-1.5 ${active? "opacity-90" : "text-[var(--forge-muted)]"}`} />
            <div className="font-medium">{meta.label}</div>
            <div className={`text-[10px] leading-tight truncate ${active? "text-white/70 dark:text-black/60" : "text-[var(--forge-muted)]"}`}>{meta.desc}</div>
          </button>
        );
      })}
    </div>
  );
}
