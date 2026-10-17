import type { Category, HistoryItem, TemplateItem } from "@/types/prompt";

export interface DayCount {
  key: string;
  label: string;
  count: number;
}

export interface CategoryCount {
  category: Category;
  label: string;
  count: number;
}

export const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"] as const;

export function toDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dailyCounts(items: HistoryItem[], days = 7, now = new Date()): DayCount[] {
  const out: DayCount[] = [];
  const index = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = toDayKey(d);
    index.set(key, out.length);
    out.push({ key, label: DAY_LABELS[d.getDay()], count: 0 });
  }
  for (const it of items) {
    const d = new Date(it.createdAt);
    if (Number.isNaN(d.getTime())) continue;
    const at = index.get(toDayKey(d));
    if (at === undefined) continue;
    const cell = out[at];
    if (cell) cell.count += 1;
  }
  return out;
}

export function categoryCounts(items: HistoryItem[], labels: Record<string, string>): CategoryCount[] {
  const tally = new Map<string, number>();
  for (const it of items) tally.set(it.category, (tally.get(it.category) ?? 0) + 1);
  return Object.keys(labels)
    .map((k) => ({ category: k as Category, label: labels[k] ?? k, count: tally.get(k) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function pickTemplates(rank: CategoryCount[], templates: TemplateItem[], n = 4): TemplateItem[] {
  const picked: TemplateItem[] = [];
  const used = new Set<string>();
  for (const c of rank) {
    if (picked.length >= n) break;
    const t = templates.find((x) => x.category === c.category && !used.has(x.id));
    if (t) {
      picked.push(t);
      used.add(t.id);
    }
  }
  for (const t of templates) {
    if (picked.length >= n) break;
    if (!used.has(t.id)) {
      picked.push(t);
      used.add(t.id);
    }
  }
  return picked;
}

function lcg(seed: number) {
  let s = seed % 4294967296;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const DEMO_CATEGORIES: Category[] = [
  "coding",
  "writing",
  "research",
  "marketing",
  "education",
  "image",
  "data",
  "business",
  "general",
];

const DEMO_TITLES: Record<Category, string> = {
  coding: "Refactor modul autentikasi",
  writing: "Artikel blog soal produktivitas",
  research: "Ringkasan riset pasar AI",
  marketing: "Copy campaign peluncuran fitur",
  education: "Modul ajar dasar Python",
  image: "Poster acara komunitas",
  data: "Analisis funnel onboarding",
  business: "Rencana ekspansi kuartal depan",
  general: "Rangkuman rapat mingguan",
};

const DEMO_PER_DAY = [3, 5, 4, 6, 5, 8, 6];

export function demoItems(now = new Date()): HistoryItem[] {
  const rand = lcg(20261018);
  const out: HistoryItem[] = [];
  for (let d = DEMO_PER_DAY.length - 1; d >= 0; d--) {
    const count = DEMO_PER_DAY[DEMO_PER_DAY.length - 1 - d];
    for (let i = 0; i < count; i++) {
      const category = DEMO_CATEGORIES[Math.floor(rand() * DEMO_CATEGORIES.length)] ?? "general";
      const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d, 9 + ((i * 2) % 10), (i * 17) % 60);
      out.push({
        id: `demo-${d}-${i}`,
        title: DEMO_TITLES[category],
        original: "",
        optimized: "",
        category,
        score: 62 + Math.floor(rand() * 34),
        createdAt: at.toISOString(),
      });
    }
  }
  return out;
}
