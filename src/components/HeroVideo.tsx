"use client";
import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

export default function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, []);

  useEffect(() => {
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    } catch {}
    const v = ref.current;
    if (!v) return;
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, []);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-[var(--forge-ink)]" aria-hidden={false}>
      <video
        ref={ref}
        className="h-full w-full object-cover opacity-[0.22] dark:opacity-[0.3] transition-opacity duration-700"
        src="/video/hero-coding.mp4"
        poster="/video/hero-poster.jpg"
        muted
        loop
        playsInline
        preload="metadata"
        onCanPlay={() => setReady(true)}
        aria-label="Video demonstrasi mengetik kode di laptop"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)] via-[var(--background)]/85 to-[var(--background)]/40" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Jeda video" : "Putar video"}
        className="absolute bottom-4 right-4 z-10 w-11 h-11 rounded-full bg-[var(--card)] border border-[var(--border)] grid place-items-center hover:bg-[var(--muted)] transition-colors cursor-pointer shadow-sm"
      >
        {playing ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
      </button>
      {!ready && <span className="sr-only">Memuat video</span>}
    </div>
  );
}