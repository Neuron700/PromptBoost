"use client";
import { useEffect, useRef } from "react";

export default function SiteVideo() {
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
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <video
        ref={ref}
        className="h-full w-full object-cover opacity-25 dark:opacity-60"
        src="/video/site-bg.mp4"
        poster="/video/site-bg.jpg"
        muted
        loop
        playsInline
        autoPlay
        preload="auto"
        tabIndex={-1}
      />
      <div className="absolute inset-0 bg-[var(--background)]/60 dark:bg-[var(--background)]/30" />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/80 via-transparent to-[var(--background)]/80" />
    </div>
  );
}