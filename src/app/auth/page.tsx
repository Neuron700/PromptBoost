"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertCircle, ArrowRight, Check, Circle, Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CodeField from "@/components/CodeField";

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

function Swap({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <span
      aria-hidden
      className="absolute inset-0 grid place-items-center transition-[opacity,transform,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
      style={{
        opacity: show ? 1 : 0,
        transform: show ? "scale(1)" : "scale(0.25)",
        filter: show ? "blur(0px)" : "blur(4px)",
      }}
    >
      {children}
    </span>
  );
}

function Req({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li
      className="flex items-center gap-1.5 text-[11px] transition-colors duration-200 ease-out"
      style={{ color: ok ? "var(--forge-signal)" : "var(--forge-muted)" }}
    >
      <span className="relative w-3.5 h-3.5 shrink-0">
        <Swap show={ok}>
          <Check size={13} />
        </Swap>
        <Swap show={!ok}>
          <Circle size={9} />
        </Swap>
      </span>
      {label}
    </li>
  );
}

type Level = "error" | "ok" | "info";
type Mode = "login" | "register";

export default function AuthPage() {
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [level, setLevel] = useState<Level>("info");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [shake, setShake] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);

  const notify = (text: string, kind: Level = "info") => {
    setMsg(text);
    setLevel(kind);
    if (kind === "error") setShake(true);
  };

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
        notify("Link verifikasi sudah kedaluwarsa atau sudah terpakai. Link berlaku 1 jam dan sekali pakai. Minta link baru lalu buka yang paling akhir.", "error");
      }
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  const emailBad = touchedEmail && email.length > 0 && !emailOk;

  const pw = useMemo(() => {
    const hasLen = password.length >= 6;
    const hasNum = /\d/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasSym = /[^A-Za-z0-9]/.test(password);
    let score = 0;
    if (hasLen) score++;
    if (password.length >= 10) score++;
    if (hasNum) score++;
    if (hasUpper || hasSym) score++;
    return { hasLen, hasNum, hasUpper, hasSym, score: Math.min(4, password.length ? score : 0) };
  }, [password]);

  const meter = [
    { color: "var(--forge-alert)", label: "Lemah" },
    { color: "var(--forge-alert)", label: "Lemah" },
    { color: "var(--forge-caution)", label: "Cukup" },
    { color: "var(--forge-signal)", label: "Kuat" },
    { color: "var(--forge-signal)", label: "Sangat kuat" },
  ][pw.score];

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
      return "Tidak bisa menghubungi database Supabase. Project kemungkinan sedang paused atau URL salah. Cek dashboard Supabase lalu Restore project.";
    }
    if (m.includes("Email not confirmed")) {
      return "Email belum diverifikasi. Buka link di inbox dulu, atau matikan Confirm email di Supabase Auth agar bisa langsung masuk.";
    }
    if (m.toLowerCase().includes("rate limit") || m.includes("over_email_send_rate_limit")) {
      return "Limit kirim email tercapai karena terlalu sering klik Daftar. Tunggu sekitar 1 jam, atau matikan Confirm email di Supabase. Akun kamu kemungkinan sudah terdaftar, coba klik Masuk.";
    }
    if (m.includes("Invalid login credentials")) {
      return "Email atau password tidak cocok. Kalau belum punya akun, pindah ke Daftar dulu.";
    }
    if (m.includes("User already registered")) {
      return "Email ini sudah terdaftar. Pindah ke Masuk untuk lanjut.";
    }
    if (m.toLowerCase().includes("provider is not enabled") || m.includes("Unsupported provider")) {
      return "Google belum dinyalakan di Supabase. Aktifkan di Authentication lalu Sign In / Providers, isi Client ID dan Client Secret.";
    }
    return m || "Terjadi kesalahan. Coba lagi.";
  };

  const loginGoogle = async () => {
    if (googleLoading || loading) return;
    setGoogleLoading(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/optimizer` },
      });
      if (error) {
        notify(friendlyError(error), "error");
        setGoogleLoading(false);
      }
    } catch (e: any) {
      notify(friendlyError(e), "error");
      setGoogleLoading(false);
    }
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;
    if (!emailOk) {
      setTouchedEmail(true);
      notify("Tulis email yang valid dulu, contoh nama@kampus.ac.id", "error");
      emailRef.current?.focus();
      return;
    }
    if (password.length < 6) {
      notify("Password minimal 6 karakter.", "error");
      pwRef.current?.focus();
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) notify(friendlyError(error), "error");
        else {
          persistEmail(email, remember);
          notify("Login berhasil. Mengalihkan ke Optimizer.", "ok");
          window.location.assign("/optimizer");
        }
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) notify(friendlyError(error), "error");
        else {
          persistEmail(email, remember);
          notify("Akun dibuat. Kalau diminta verifikasi, cek inbox. Kalau Confirm email dimatikan di Supabase, langsung klik Masuk.", "ok");
        }
      }
    } catch (err: any) {
      notify(friendlyError(err), "error");
    }
    setLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
    notify("Kamu sudah keluar.", "info");
  };

  const busy = loading || googleLoading;

  if (userEmail) {
    return (
      <div className="flex-1">
        <CodeField />
        <div className="mx-auto max-w-[460px] px-4 py-10 sm:py-14 flex flex-col gap-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/75 backdrop-blur-md p-6">
            <div className="text-sm font-semibold">Masuk sebagai</div>
            <div className="mt-1 font-mono text-sm break-all">{userEmail}</div>
            <div className="mt-2 text-xs text-[var(--forge-muted)]">History sekarang menempel ke akun ini. Akun lain tidak bisa melihatnya.</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href="/optimizer" className="min-h-[44px] h-11 px-5 rounded-full bg-[var(--forge-ember)] hover:bg-[var(--forge-ember-hover)] text-white text-sm grid place-items-center transition-colors">
                Ke Optimizer
              </a>
              <button onClick={logout} className="min-h-[44px] h-11 px-5 rounded-full border border-[var(--border)] hover:bg-[var(--muted)] text-sm transition-colors active:scale-[0.96]">
                Keluar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <CodeField />
      <div className="mx-auto max-w-[460px] px-4 py-10 sm:py-14 flex flex-col gap-4">
        <form
          onSubmit={submit}
          className={`rounded-2xl border border-[var(--border)] bg-[var(--card)]/75 backdrop-blur-md p-6 ${shake ? "forge-shake" : ""}`}
          onAnimationEnd={() => setShake(false)}
          noValidate
        >
          <h1 className="text-lg font-semibold">
            {mode === "login" ? "Masuk ke akun kamu" : "Buat akun baru"}
          </h1>
          <p className="text-xs text-[var(--forge-muted)] mt-1 leading-5">
            {mode === "login"
              ? "Lanjutkan tempa prompt dan riwayat kamu dari perangkat mana pun."
              : "Riwayat prompt tersimpan per akun, jadi aman dipakai di banyak perangkat."}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-1 rounded-full border border-[var(--border)] bg-[var(--muted)]/60 p-1 relative">
            <span
              aria-hidden
              className="absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-[var(--card)] border border-[var(--border)] transition-transform duration-300 ease-out"
              style={{ transform: mode === "register" ? "translateX(100%)" : "translateX(0)" }}
            />
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => { setMode(m); setMsg(null); }}
                className={`relative z-10 min-h-[44px] rounded-full text-sm font-medium cursor-pointer transition-colors duration-200 ${
                  mode === m ? "text-[var(--foreground)]" : "text-[var(--forge-muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {m === "login" ? "Masuk" : "Daftar"}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={loginGoogle}
            disabled={busy}
            aria-busy={googleLoading}
            className="mt-4 w-full min-h-[48px] h-12 rounded-full border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--muted)] text-sm font-medium inline-flex items-center justify-center gap-2.5 cursor-pointer transition-[background-color,scale,border-color] duration-150 active:scale-[0.96] disabled:opacity-60 disabled:cursor-default disabled:active:scale-100"
          >
            <span className="relative w-[18px] h-[18px] shrink-0">
              <Swap show={!googleLoading}>
                <GoogleMark />
              </Swap>
              <Swap show={googleLoading}>
                <Loader2 size={18} className="animate-spin" />
              </Swap>
            </span>
            {googleLoading ? "Menghubungkan ke Google" : "Lanjut dengan Google"}
          </button>

          <div className="mt-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-[11px] text-[var(--forge-muted)]">atau dengan email</span>
            <span className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <label htmlFor="email" className="block mt-4 text-xs font-medium">Email</label>
          <div className="relative mt-1">
            <input
              id="email"
              ref={emailRef}
              type="email"
              name="email"
              autoComplete={mode === "login" ? "username" : "email"}
              inputMode="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (remember) persistEmail(e.target.value, true); }}
              onBlur={() => setTouchedEmail(true)}
              placeholder="kamu@kampus.ac.id"
              aria-invalid={emailBad || undefined}
              aria-describedby={emailBad ? "email-error" : "email-hint"}
              className={`w-full h-11 rounded-xl border bg-[var(--background)] pl-3 pr-10 text-[16px] sm:text-sm transition-colors duration-150 outline-none ${
                emailBad ? "border-[var(--forge-alert)]" : "border-[var(--border)] focus:border-[var(--forge-ember)]"
              }`}
            />
            {email.length > 0 && (
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: emailBad ? "var(--forge-alert)" : "var(--forge-signal)" }}
                aria-hidden
              >
                <Swap show={!emailBad}>
                  <Check size={15} />
                </Swap>
                <Swap show={emailBad}>
                  <AlertCircle size={15} />
                </Swap>
              </span>
            )}
          </div>
          {emailBad ? (
            <p id="email-error" className="mt-1.5 text-[11px] text-[var(--forge-alert)]">Format email belum benar, contoh nama@kampus.ac.id</p>
          ) : (
            <p id="email-hint" className="mt-1.5 text-[11px] text-[var(--forge-muted)]">Dipakai untuk menyimpan riwayat prompt kamu.</p>
          )}

          <label htmlFor="password" className="block mt-3.5 text-xs font-medium">Password</label>
          <div className="relative mt-1">
            <input
              id="password"
              ref={pwRef}
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { setCapsOn(e.getModifierState?.("CapsLock") ?? false); if (e.key === "Enter") submit(); }}
              onKeyUp={(e) => setCapsOn(e.getModifierState?.("CapsLock") ?? false)}
              onBlur={() => setCapsOn(false)}
              placeholder={mode === "login" ? "password kamu" : "minimal 6 karakter"}
              aria-describedby="pw-strength"
              className="w-full h-11 rounded-xl border border-[var(--border)] bg-[var(--background)] pl-3 pr-12 text-[16px] sm:text-sm transition-colors duration-150 outline-none focus:border-[var(--forge-ember)]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
              aria-pressed={showPassword}
              className="absolute right-0.5 top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center rounded-full text-[var(--forge-muted)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
            >
              <span className="relative w-4 h-4">
                <Swap show={!showPassword}>
                  <Eye size={16} />
                </Swap>
                <Swap show={showPassword}>
                  <EyeOff size={16} />
                </Swap>
              </span>
            </button>
          </div>

          <div id="pw-strength" aria-live="polite" className="mt-2">
            {password.length > 0 && (
              <div className="flex items-center gap-2 forge-pop">
                <span className="flex gap-1" aria-hidden>
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-8 rounded-full transition-colors duration-200 ease-out"
                      style={{ background: i < pw.score ? meter.color : "var(--muted)" }}
                    />
                  ))}
                </span>
                <span className="text-[11px]">{meter.label}</span>
              </div>
            )}
            {capsOn && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[var(--forge-caution)] forge-pop">
                <AlertCircle size={12} /> Caps Lock sedang menyala
              </p>
            )}
          </div>

          {mode === "register" && (
            <div className="mt-2">
              <div className="text-[11px] text-[var(--forge-muted)]">Demi keamanan, sebaiknya tambah:</div>
              <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                <Req ok={pw.hasLen} label="minimal 6 karakter" />
                <Req ok={pw.hasNum} label="angka" />
                <Req ok={pw.hasUpper} label="huruf besar" />
                <Req ok={pw.hasSym} label="simbol" />
              </ul>
            </div>
          )}

          <button
            type="button"
            role="switch"
            aria-checked={remember}
            onClick={() => { const next = !remember; setRemember(next); persistEmail(email, next); }}
            className="mt-3.5 flex items-center gap-2.5 text-xs text-[var(--forge-muted)] cursor-pointer min-h-[44px] select-none"
          >
            <span
              aria-hidden
              className={`relative w-9 h-5 rounded-full transition-colors duration-200 ease-out ${
                remember ? "bg-[var(--forge-ember)]" : "bg-[var(--muted)] border border-[var(--border)]"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200 ease-out ${
                  remember ? "translate-x-[1.125rem]" : "translate-x-0.5"
                }`}
              />
            </span>
            Simpan email saya di perangkat ini
          </button>

          <button
            type="submit"
            disabled={busy}
            aria-busy={loading}
            className="mt-2 w-full min-h-[48px] h-12 rounded-full bg-[var(--forge-ember)] hover:bg-[var(--forge-ember-hover)] text-white text-sm font-medium inline-flex items-center justify-center gap-2 cursor-pointer transition-[background-color,scale] duration-150 active:scale-[0.96] disabled:opacity-60 disabled:cursor-default disabled:active:scale-100"
          >
            {loading && <Loader2 size={16} className="animate-spin" aria-hidden />}
            {mode === "login" ? (loading ? "Memeriksa akun" : "Masuk") : loading ? "Membuat akun" : "Daftar"}
            {!loading && <ArrowRight size={16} aria-hidden />}
          </button>

          {msg && (
            <div
              role={level === "error" ? "alert" : "status"}
              className={`mt-4 flex items-start gap-2 rounded-xl border p-3 text-xs leading-5 forge-pop ${
                level === "error"
                  ? "border-[var(--forge-alert)] text-[var(--forge-alert)]"
                  : level === "ok"
                    ? "border-[var(--forge-signal)] text-[var(--forge-signal)]"
                    : "border-[var(--border)] text-[var(--forge-muted)]"
              }`}
            >
              {level === "error" ? <AlertCircle size={14} className="mt-px shrink-0" /> : <Check size={14} className="mt-px shrink-0" />}
              <span className="whitespace-pre-wrap">{msg}</span>
            </div>
          )}

          <p className="mt-3 text-[11px] text-[var(--forge-muted)] leading-5">
            {mode === "login" ? "Belum punya akun? Pindah ke Daftar untuk membuatnya." : "Sudah punya akun? Pindah ke Masuk."}
          </p>
        </form>
      </div>
    </div>
  );
}
