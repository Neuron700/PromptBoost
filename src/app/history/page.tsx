"use client";
import { useEffect, useState } from "react";
import type { HistoryItem } from "@/types/prompt";
import { Trash2, Copy } from "lucide-react";
import { categoryMeta } from "@/lib/prompts";

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [source, setSource] = useState<"db" | "local">("local");
  const load = async () => {
    try {
      const r = await fetch("/api/history", { cache: "no-store" });
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
          setSource("db");
          return;
        }
      }
    } catch {}
    const local = JSON.parse(localStorage.getItem("forge-history") || "[]");
    setItems(local);
    setSource("local");
  };
  useEffect(() => { load(); }, []);
  const clear = async () => {
    localStorage.removeItem("forge-history");
    await fetch("/api/history", { method: "DELETE" }).catch(()=>{});
    setItems([]);
  };
  const remove = async (id: string) => {
    const n = items.filter((i) => i.id !== id);
    setItems(n);
    localStorage.setItem("forge-history", JSON.stringify(n));
    await fetch(`/api/history?id=${id}`, { method: "DELETE" }).catch(()=>{});
  };

  return (
    <div className="mx-auto max-w-[1160px] px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">History</h1>
          <p className="text-sm text-[var(--forge-muted)]">
            {source === "db" ? "Tersimpan di database jadi aman tidak hilang" : "Tersimpan di database"} • {items.length} entri
          </p>
        </div>
        {items.length > 0 && <button onClick={clear} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-[var(--border)] text-xs hover:bg-[var(--muted)] cursor-pointer"><Trash2 size={12}/> Clear</button>}
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <div className="text-sm font-medium">Belum ada history</div>
          <div className="text-xs text-[var(--forge-muted)] mt-1">Hasil Optimizer akan muncul di sini. <a href="/optimizer" className="underline">Buka Optimizer</a></div>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((it) => (
            <div key={it.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono tracking-widest px-2 py-0.5 rounded-full bg-[var(--muted)] border border-[var(--border)]">{categoryMeta[it.category]?.label ?? it.category}</span>
                  <span className="text-xs font-mono text-[var(--forge-muted)]">{new Date(it.createdAt).toLocaleDateString("id-ID")}</span>
                  <span className="ml-auto text-xs font-mono font-bold">{it.score}</span>
                </div>
                <div className="mt-2 font-medium text-sm truncate">{it.title}</div>
                <div className="mt-2 grid sm:grid-cols-2 gap-2">
                  <div className="rounded-lg bg-[var(--muted)] p-2 text-xs leading-4 line-clamp-3 whitespace-pre-wrap">{it.original}</div>
                  <div className="rounded-lg bg-[var(--forge-ink)] dark:bg-white text-white dark:text-black p-2 text-xs leading-4 line-clamp-3 whitespace-pre-wrap font-mono">{it.optimized}</div>
                </div>
              </div>
              <div className="flex sm:flex-col gap-2 shrink-0">
                <button onClick={() => navigator.clipboard.writeText(it.optimized)} className="h-8 px-3 rounded-full bg-[var(--forge-ink)] dark:bg-white text-white dark:text-black text-xs inline-flex items-center gap-1.5 cursor-pointer"><Copy size={12}/> Copy</button>
                <button onClick={() => remove(it.id)} className="h-8 px-3 rounded-full border border-[var(--border)] text-xs cursor-pointer">Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-8 rounded-xl bg-[var(--muted)] p-4 text-xs leading-5 text-[var(--forge-muted)]">
        <div className="font-semibold text-[var(--foreground)]">Cara pakai database biar tidak hilang</div>
        <div className="mt-1">Lokal: otomatis tersimpan di file <span className="font-mono">data/history.json</span> jadi tetap ada meski clear browser</div>
        <div>Supabase untuk deploy: buat project di supabase.com lalu buat tabel <span className="font-mono">prompts</span> dengan kolom title text, original_prompt text, optimized_prompt text, category text, score int, created_at timestamp. Isi env <span className="font-mono">NEXT_PUBLIC_SUPABASE_URL</span> dan <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> di Vercel lalu history otomatis pakai Supabase</div>
      </div>
    </div>
  );
}
