"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    const { data } = await supabase.auth.getUser();
    setUserEmail(data.user?.email ?? null);
  };
  useEffect(() => { refresh(); }, []);

  const friendlyError = (e: any) => {
    const m = String(e?.message ?? e ?? "");
    if (m.includes("Failed to fetch") || m.includes("fetch failed") || m.includes("ENOTFOUND")) {
      return "Tidak bisa hubungi database Supabase. Project kemungkinan paused atau URL salah. Cek dashboard Supabase lalu Restore project.";
    }
    if (m.includes("Email not confirmed")) {
      return "Email belum verifikasi. Matikan Confirm email di Supabase Auth agar bisa langsung masuk.";
    }
    if (m.includes("Invalid login credentials")) {
      return "Email atau password salah. Kalau belum punya akun klik Daftar dulu.";
    }
    return m || "Terjadi kesalahan. Coba lagi.";
  };

  const login = async () => {
    if (!email.includes("@") || password.length < 6) { setMsg("Isi email valid dan password minimal 6 karakter dulu."); return; }
    setLoading(true); setMsg(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(friendlyError(error));
      else { setMsg("Login berhasil"); refresh(); }
    } catch (e: any) { setMsg(friendlyError(e)); }
    setLoading(false);
  };
  const register = async () => {
    if (!email.includes("@") || password.length < 6) { setMsg("Isi email valid dan password minimal 6 karakter dulu."); return; }
    setLoading(true); setMsg(null);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMsg(friendlyError(error));
      else setMsg("Akun dibuat. Kalau diminta verifikasi cek inbox, atau matikan Confirm email di Supabase biar langsung bisa Masuk.");
    } catch (e: any) { setMsg(friendlyError(e)); }
    setLoading(false);
  };
  const logout = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
    setMsg("Keluar berhasil");
  };

  if (userEmail) {
    return (
      <div className="mx-auto max-w-[480px] px-4 py-10 flex flex-col gap-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="text-sm font-semibold">Masuk sebagai</div>
          <div className="mt-1 font-mono text-sm">{userEmail}</div>
          <div className="mt-2 text-xs text-[var(--forge-muted)]">History sekarang per akun. Akun lain tidak akan lihat history kamu.</div>
          <div className="mt-4 flex gap-2">
            <a href="/optimizer" className="h-9 px-4 rounded-full bg-[var(--forge-ember)] text-white text-sm grid place-items-center">Ke Optimizer</a>
            <button onClick={logout} className="h-9 px-4 rounded-full border border-[var(--border)] text-sm">Keluar</button>
          </div>
          {msg && <div className="mt-3 text-xs bg-[var(--muted)] rounded-lg p-2">{msg}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[480px] px-4 py-10 flex flex-col gap-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h1 className="text-lg font-semibold">Masuk dengan Email</h1>
        <p className="text-xs text-[var(--forge-muted)] mt-1">Daftar atau masuk. History akan beda per akun.</p>
        <label className="block mt-4 text-xs font-medium">Email
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="kamu@kampus.ac.id" className="mt-1 w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm" />
        </label>
        <label className="block mt-3 text-xs font-medium">Password
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="minimal 6 karakter" className="mt-1 w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm" />
        </label>
        <div className="mt-4 flex gap-2">
          <button onClick={login} disabled={loading} className="flex-1 h-10 rounded-full bg-[var(--forge-ink)] dark:bg-white text-white dark:text-black text-sm font-medium disabled:opacity-50">{loading ? "Proses" : "Masuk"}</button>
          <button onClick={register} disabled={loading} className="flex-1 h-10 rounded-full border border-[var(--border)] text-sm font-medium">Daftar</button>
        </div>
        {msg && <div className="mt-3 text-xs bg-[var(--muted)] rounded-lg p-2 whitespace-pre-wrap">{msg}</div>}
        <div className="mt-3 text-xs text-[var(--forge-muted)]">Belum punya akun? Isi email dan password lalu klik Daftar. Sudah punya? Klik Masuk.</div>
      </div>
    </div>
  );
}
