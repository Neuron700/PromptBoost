"use client";
import { useEffect, useState } from "react";
import { demoItems } from "@/lib/dashboard";
import type { HistoryItem } from "@/types/prompt";
import DashboardView from "@/components/dashboard/DashboardView";

function Skeleton() {
  return (
    <div className="mx-auto max-w-[1160px] px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full animate-pulse">
      <div className="h-3 w-24 rounded-full bg-[var(--muted)]" />
      <div className="mt-3 h-7 w-48 rounded-lg bg-[var(--muted)]" />
      <div className="mt-6 grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-[248px] rounded-2xl border border-[var(--border)] bg-[var(--card)]/70" />
        <div className="h-[248px] rounded-2xl border border-[var(--border)] bg-[var(--card)]/70" />
      </div>
      <div className="mt-4 h-[220px] rounded-2xl border border-[var(--border)] bg-[var(--card)]/70" />
    </div>
  );
}

export default function DashboardPage() {
  const [items, setItems] = useState<HistoryItem[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      let loggedIn = false;
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        loggedIn = Boolean(data.user);
      } catch {}

      if (!alive) return;
      if (loggedIn) {
        window.location.replace("/");
        return;
      }
      setItems(demoItems());
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (items === null) return <Skeleton />;
  return <DashboardView items={items} demo />;
}
