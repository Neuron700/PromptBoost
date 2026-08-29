"use client";
import { useState } from "react";
import { Copy, Check, FileJson, FileText, Download } from "lucide-react";

export default function CopyButton({ text, variant="text" }: { text: string; variant?: "text"|"markdown"|"json" }) {
  const [done, setDone] = useState(false);
  const [label, setLabel] = useState<string | null>(null);

  const doAction = async () => {
    if (variant === "text") {
      await navigator.clipboard.writeText(text);
      setLabel("Copied!");
      setDone(true);
      setTimeout(() => { setDone(false); setLabel(null); }, 1400);
      return;
    }
    const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");
    let content = "";
    let filename = "";
    let mime = "text/plain";
    if (variant === "markdown") {
      content = text;
      filename = `promptforge-${ts}.md`;
      mime = "text/markdown";
    } else if (variant === "json") {
      content = JSON.stringify({ prompt: text, exportedAt: new Date().toISOString() }, null, 2);
      filename = `promptforge-${ts}.json`;
      mime = "application/json";
    }
    // trigger download ke File Explorer
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    // juga copy ke clipboard biar tetap bisa paste
    try { await navigator.clipboard.writeText(content); } catch {}
    setLabel(variant === "json" ? "Saved JSON" : "Saved MD");
    setDone(true);
    setTimeout(() => { setDone(false); setLabel(null); }, 1600);
  };

  return (
    <button onClick={doAction} aria-label={`${variant === "text" ? "Copy" : "Save"} as ${variant}`}
      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium border transition-colors cursor-pointer
      ${done ? "bg-[var(--forge-signal)] text-white border-transparent" : "bg-[var(--card)] hover:bg-[var(--muted)] border-[var(--border)]"}`}>
      {done ? <Check size={13} /> : variant==="json" ? <FileJson size={13}/> : variant==="markdown" ? <FileText size={13}/> : <Copy size={13}/>}
      {label ? label : variant==="json" ? "Copy JSON" : variant==="markdown" ? "Copy MD" : "Copy"}
      {done && variant !== "text" ? <Download size={11} className="opacity-80" /> : null}
    </button>
  );
}
