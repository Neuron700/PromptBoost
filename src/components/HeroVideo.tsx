"use client";
import { useEffect, useRef } from "react";

export default function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    } catch {}
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <video
        ref={ref}
        className="h-full w-full object-cover opacity-30 dark:opacity-70"
        src="/video/hero-ember.mp4"
        poster="/video/hero-ember.jpg"
        muted
        loop
        playsInline
        autoPlay
        preload="auto"
        tabIndex={-1}
      />
      <div className="absolute inset-0 bg-[var(--background)]/55 dark:bg-[var(--background)]/35" />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/70 via-transparent to-[var(--background)]" />
    </div>
  );
}