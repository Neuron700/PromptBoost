"use client";
import { useState } from "react";

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true); setStatus(null);
    try {
      const r = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, message, rating }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setStatus(j.message);
      setName(""); setEmail(""); setMessage("");
    } catch (e:any) { setStatus(e.message); }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-[640px] px-4 py-8 flex-1 w-full">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h1 className="text-xl font-semibold">Feedback untuk PromptForge</h1>
        <p className="text-xs text-[var(--forge-muted)] mt-1">Saran kamu akan dikirim langsung ke <span className="font-mono font-medium text-[var(--foreground)]">syahlanbudi73@gmail.com</span></p>

        <label className="block mt-4 text-xs font-medium">Nama
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nama kamu" className="mt-1 w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm" />
        </label>
        <label className="block mt-3 text-xs font-medium">Email kamu
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="kamu@mail.com" className="mt-1 w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm" />
        </label>
        <label className="block mt-3 text-xs font-medium">Rating
          <div className="mt-1 flex gap-1">
            {[1,2,3,4,5].map(n=>(
              <button key={n} type="button" onClick={()=>setRating(n)} className={`w-8 h-8 rounded-full border text-sm ${rating>=n ? "bg-[var(--forge-ember)] text-white border-transparent" : "bg-[var(--card)] border-[var(--border)]"}`}>{n}</button>
            ))}
          </div>
        </label>
        <label className="block mt-3 text-xs font-medium">Pesan
          <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Tulis saran, bug, atau ide fitur..." className="mt-1 w-full min-h-[120px] rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm" />
        </label>

        <button onClick={submit} disabled={loading} className="mt-4 w-full h-10 rounded-full bg-[var(--forge-ember)] text-white text-sm font-medium disabled:opacity-50">
          {loading ? "Mengirim..." : "Kirim Feedback"}
        </button>
        {status && <div className="mt-3 rounded-xl bg-[var(--muted)] p-3 text-xs">{status}</div>}

        <div className="mt-6 rounded-xl bg-[var(--muted)] p-3 text-xs leading-5 text-[var(--forge-muted)]">
          Atau hubungi langsung via email: <a href="mailto:syahlanbudi73@gmail.com?subject=Feedback%20PromptForge" className="underline font-medium text-[var(--foreground)]">syahlanbudi73@gmail.com</a>
        </div>
      </div>
    </div>
  );
}
