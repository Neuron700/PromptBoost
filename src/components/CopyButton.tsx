"use client";
import { useState } from "react";
import { Copy, Check, FileJson, FileText } from "lucide-react";

export default function CopyButton({ text, variant="text" }: { text: string; variant?: "text"|"markdown"|"json" }) {
  const [copied, setCopied] = useState(false);
  const doCopy = async () => {
    let payload = text;
    if (variant === "markdown") payload = "```\n" + text + "\n```";
    if (variant === "json") payload = JSON.stringify({ prompt: text }, null, 2);
    await navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(()=> setCopied(false), 1400);
  };
  return (
    <button onClick={doCopy} aria-label={`Copy as ${variant}`}
      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium border transition-colors
      ${copied ? "bg-[var(--forge-signal)] text-white border-transparent" : "bg-[var(--card)] hover:bg-[var(--muted)] border-[var(--border)]"}`}>
      {copied ? <Check size={13} /> : variant==="json" ? <FileJson size={13}/> : variant==="markdown" ? <FileText size={13}/> : <Copy size={13}/>}
      {copied ? "Copied!" : variant==="json" ? "Copy JSON" : variant==="markdown" ? "Copy MD" : "Copy"}
    </button>
  );
}
