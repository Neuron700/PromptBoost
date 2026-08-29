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

  const login = async () => {
    setLoading(true); setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMsg(error.message);
    else { setMsg("Login berhasil"); refresh(); }
    setLoading(false);
  };
  const register = async () => {
    setLoading(true); setMsg(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setMsg(error.message);
    else setMsg("Akun dibuat. Cek email kalau perlu verifikasi, lalu login.");
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
