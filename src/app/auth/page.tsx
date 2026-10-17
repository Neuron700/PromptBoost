"use client";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.5 2.5 30 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6c1.9-5.6 7-9.8 13.6-9.8z" />
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.2-.4-4.7H24v9h12.4c-.5 2.7-2.1 5-4.4 6.6l6.7 6.7c3.9-3.6 6.4-8.9 6.4-17.6z" />
      <path fill="#FBBC05" d="M10.4 28.3c-.5-1.4-.7-2.8-.7-4.3s.3-3 .7-4.3l-7.8-6C1 16.6 0 20.2 0 24s1 7.4 2.6 11.3l7.8-7z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6.3c-2.1 1.4-4.9 2.3-8.2 2.3-6.6 0-11.7-4.2-13.6-9.9l-7.8 6C5.5 42.6 14 48 24 48z" />
    </svg>
  );
}

export default function AuthPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const refresh = async () => {
    const { data } = await supabase.auth.getUser();
    setUserEmail(data.user?.email ?? null);
  };
  useEffect(() => {
    refresh();
    try {
      const savedEmail = localStorage.getItem("forge-email") || "";
      const savedRemember = localStorage.getItem("forge-remember");
      if (savedEmail) setEmail(savedEmail);
      if (savedRemember !== null) setRemember(savedRemember === "1");
      const q = new URLSearchParams(window.location.search);
      const err = q.get("error") || q.get("error_code") || "";
      if (err.includes("otp_expired") || err.includes("access_denied")) {
        setMsg("Link verifikasi expired atau sudah dipakai. Link hanya berlaku 1 jam dan sekali pakai. Klik Kirim ulang email lalu buka link terbaru.");
      }
    } catch {}
  }, []);

  const persistEmail = (value: string, shouldRemember: boolean) => {
    try {
      if (shouldRemember && value.includes("@")) {
        localStorage.setItem("forge-email", value);
        localStorage.setItem("forge-remember", "1");
      } else if (!shouldRemember) {
        localStorage.removeItem("forge-email");
        localStorage.setItem("forge-remember", "0");
      }
    } catch {}
  };

  const friendlyError = (e: any) => {
    const m = String(e?.message ?? e ?? "");
    if (m.includes("Failed to fetch") || m.includes("fetch failed") || m.includes("ENOTFOUND")) {
      return "Tidak bisa hubungi database Supabase. Project kemungkinan paused atau URL salah. Cek dashboard Supabase lalu Restore project.";
    }
    if (m.includes("Email not confirmed")) {
      return "Email belum verifikasi. Matikan Confirm email di Supabase Auth agar bisa langsung masuk.";
    }
    if (m.toLowerCase().includes("rate limit") || m.includes("over_email_send_rate_limit")) {
      return "Limit email tercapai karena terlalu sering klik Daftar atau Kirim ulang. Tunggu sekitar 1 jam, atau matikan Confirm email di Supabase biar tidak perlu kode sama sekali. Akun kamu kemungkinan sudah terdaftar, coba langsung klik Masuk.";
    }
    if (m.includes("Invalid login credentials")) {
      return "Email atau password salah. Kalau belum punya akun klik Daftar dulu.";
    }
    return m || "Terjadi kesalahan. Coba lagi.";
  };

  const loginGoogle = async () => {
    setLoading(true); setMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/optimizer` },
      });
      if (error) setMsg(friendlyError(error));
    } catch (e: any) { setMsg(friendlyError(e)); }
    setLoading(false);
  };

  const login = async () => {
    if (!email.includes("@") || password.length < 6) { setMsg("Isi email valid dan password minimal 6 karakter dulu."); return; }
    setLoading(true); setMsg(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(friendlyError(error));
      else { persistEmail(email, remember); setMsg("Login berhasil"); refresh(); }
    } catch (e: any) { setMsg(friendlyError(e)); }
    setLoading(false);
  };
  const register = async () => {
    if (!email.includes("@") || password.length < 6) { setMsg("Isi email valid dan password minimal 6 karakter dulu."); return; }
    setLoading(true); setMsg(null);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMsg(friendlyError(error));
      else { persistEmail(email, remember); setMsg("Akun dibuat. Kalau diminta verifikasi cek inbox, atau matikan Confirm email di Supabase biar langsung bisa Masuk."); }
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
      <form
        className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6"
        autoComplete="on"
        onSubmit={(e) => { e.preventDefault(); login(); }}
      >
        <h1 className="text-lg font-semibold">Masuk ke Akun Anda</h1>
        <p className="text-xs text-[var(--forge-muted)] mt-1">Simpan hasil tempa dan riwayat prompt kamu per akun.</p>
        <button type="button" onClick={loginGoogle} disabled={loading}
          className="mt-4 w-full min-h-[48px] h-12 rounded-full border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-sm font-medium inline-flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50">
          <GoogleMark />
          Lanjut dengan Google
        </button>
        <div className="mt-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-[var(--border)]" />
          <span className="text-[11px] text-[var(--forge-muted)]">atau dengan email</span>
          <span className="h-px flex-1 bg-[var(--border)]" />
        </div>
        <label className="block mt-4 text-xs font-medium">Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (remember) persistEmail(e.target.value, true); }}
            placeholder="kamu@kampus.ac.id"
            className="mt-1 w-full h-11 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-[16px] sm:text-sm"
          />
        </label>
        <label className="block mt-3 text-xs font-medium">Password
          <span className="relative block mt-1">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") login(); }}
              placeholder="minimal 6 karakter"
              className="w-full h-11 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 pr-11 text-[16px] sm:text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
              aria-pressed={showPassword}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center rounded-full text-[var(--forge-muted)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </span>
        </label>
        <label className="mt-3 flex items-center gap-2 text-xs text-[var(--forge-muted)] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => { setRemember(e.target.checked); persistEmail(email, e.target.checked); }}
            className="w-4 h-4 rounded accent-black"
          />
          Ingat email saya di perangkat ini
        </label>
        <div className="mt-4 flex gap-2">
          <button type="submit" disabled={loading} className="flex-1 h-11 rounded-full bg-[var(--forge-ink)] dark:bg-white text-white dark:text-black text-sm font-medium disabled:opacity-50 min-h-[48px]">{loading ? "Proses" : "Masuk"}</button>
          <button type="button" onClick={register} disabled={loading} className="flex-1 h-11 rounded-full border border-[var(--border)] text-sm font-medium min-h-[48px]">Daftar</button>
        </div>
        {msg && <div className="mt-3 text-xs bg-[var(--muted)] rounded-lg p-2 whitespace-pre-wrap">{msg}</div>}
        <div className="mt-3 text-xs text-[var(--forge-muted)]">Belum punya akun? Isi email dan password lalu klik Daftar. Sudah punya? Klik Masuk.</div>
      </form>
    </div>
  );
}
