"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const nav = [
  { href: "/optimizer", label: "Optimizer" },
  { href: "/templates", label: "Templates" },
  { href: "/history", label: "History" },
  { href: "/feedback", label: "Feedback" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("forge-theme");
    const isDark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
      supabase.auth.onAuthStateChange((_e, session) => setUserEmail(session?.user?.email ?? null));
    });
  }, []);

  const toggle = () => {
    const nd = !dark;
    setDark(nd);
    document.documentElement.classList.toggle("dark", nd);
    localStorage.setItem("forge-theme", nd ? "dark" : "light");
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-[var(--background)]/80 border-b border-[var(--border)]">
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 h-[56px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 focus-visible:outline-none">
          <img src="/icon.svg" alt="PromptForge" width={32} height={32} className="w-8 h-8 rounded-lg object-cover shrink-0" />
          <span className="font-mono text-[13px] tracking-[0.14em] font-semibold">PROMPTFORGE</span>
          <span className="hidden sm:inline text-[10px] tracking-widest text-[var(--forge-muted)] border border-[var(--border)] rounded-full px-2 py-0.5">BETA</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map((n) => (
            <Link key={n.href} href={n.href}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${pathname === n.href ? "bg-[var(--forge-ink)] text-white dark:bg-white dark:text-[var(--forge-paper)]" : "text-[var(--forge-muted)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"}`}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {userEmail ? (
            <span className="hidden sm:inline text-xs font-mono px-2 py-1 rounded-full bg-[var(--muted)] border border-[var(--border)] max-w-[140px] truncate">{userEmail}</span>
          ) : null}
          <Link href="/auth" className={`hidden sm:inline-flex h-8 px-3 rounded-full border text-xs font-medium items-center ${userEmail ? "border-[var(--border)] bg-[var(--card)]" : "bg-[var(--forge-ink)] dark:bg-white text-white dark:text-black border-transparent"}`}>
            {userEmail ? "Akun" : "Masuk"}
          </Link>
          <button onClick={toggle} aria-label="Toggle theme" className="w-8 h-8 grid place-items-center rounded-full border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
            {dark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <Link href="/optimizer" className="hidden sm:inline-flex h-8 px-4 rounded-full bg-[var(--forge-ember)] hover:bg-[var(--forge-ember-hover)] text-white text-sm font-medium items-center transition-colors">
            Start Building
          </Link>
          <button onClick={() => setOpen(!open)} className="md:hidden w-8 h-8 grid place-items-center rounded-full border border-[var(--border)]" aria-label="Menu">
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--card)] px-4 py-3 flex flex-col gap-1">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={`px-3 py-2 rounded-lg text-sm ${pathname === n.href ? "bg-[var(--muted)] font-medium" : ""}`}>{n.label}</Link>
          ))}
          <Link href="/auth" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg text-sm border border-[var(--border)] text-center">{userEmail ? userEmail : "Masuk / Daftar"}</Link>
          <Link href="/optimizer" onClick={() => setOpen(false)} className="mt-2 h-9 grid place-items-center rounded-full bg-[var(--forge-ember)] text-white text-sm font-medium">Start Building</Link>
        </div>
      )}
    </header>
  );
}
