"use client";
import { useEffect, useRef } from "react";
import type { WordTag } from "@/types/prompt";

const TAG_VAR: Record<string, string> = {
  claim: "--forge-muted",
  owner: "--forge-ink",
  file: "--forge-warn",
  approval: "--forge-signal",
  vague: "--forge-ember",
};

function cssVar(name: string, fallback: string): string {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  } catch {
    return fallback;
  }
}

interface Props {
  tags: WordTag[];
  dataKey: string;
  activeIndex: number | null;
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
}

export default function ForceCanvas({ tags, dataKey, activeIndex, selectedIndex, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const stateRef = useRef({ activeIndex, selectedIndex, onSelect });
  stateRef.current = { activeIndex, selectedIndex, onSelect };

  useEffect(() => {
    let alive = true;
    let fg: any = null;
    let ro: ResizeObserver | null = null;
    const onVis = () => {
      if (!fg) return;
      try {
        if (document.hidden) fg.pauseAnimation();
        else fg.resumeAnimation();
      } catch {}
    };
    (async () => {
      const mod: any = await import("force-graph");
      if (!alive || !ref.current) return;
      const ForceGraph = mod.default ?? mod;
      const colors: Record<string, string> = {};
      for (const [k, v] of Object.entries(TAG_VAR)) colors[k] = cssVar(v, "#888888");
      const ink = cssVar("--forge-ink", "#222222");
      const line = cssVar("--border", "#cccccc");
      const nodes: any[] = [
        { id: "hub", hub: true, word: "PROMPT" },
        ...tags.map((t) => ({ id: `w${t.index}`, word: t.word, tag: t.tag, index: t.index })),
      ];
      const links: any[] = [
        ...tags.map((t) => ({ source: "hub", target: `w${t.index}`, hub: true })),
        ...tags.slice(1).map((t) => ({ source: `w${t.index - 1}`, target: `w${t.index}`, hub: false })),
      ];
      fg = new ForceGraph(ref.current!)
        .graphData({ nodes, links })
        .backgroundColor("rgba(0,0,0,0)")
        .linkColor((l: any) => (l.hub ? line : colors.claim))
        .linkWidth((l: any) => (l.hub ? 0.6 : 1))
        .linkDirectionalParticles((l: any) => (l.hub ? 0 : 1))
        .linkDirectionalParticleSpeed(0.004)
        .d3VelocityDecay(0.32)
        .nodeCanvasObject((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const st = stateRef.current;
          const color = node.hub ? ink : colors[node.tag] ?? colors.claim;
          const isActive = !node.hub && node.index === st.activeIndex;
          const isSel = !node.hub && node.index === st.selectedIndex;
          const base = node.hub ? 7 : node.word.length <= 2 ? 2.4 : node.word.length <= 5 ? 4 : 5.5;
          const r = base * (isActive || isSel ? 1.9 : 1);
          ctx.save();
          ctx.shadowColor = color;
          ctx.shadowBlur = isActive || isSel ? 18 : 9;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
          ctx.fill();
          ctx.restore();
          if (node.hub) {
            ctx.save();
            ctx.strokeStyle = color;
            ctx.globalAlpha = 0.5;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(node.x, node.y, r + 5, 0, 2 * Math.PI, false);
            ctx.stroke();
            ctx.restore();
          } else if (node.word.length > 3) {
            const fs = Math.max(2.5, 10 / globalScale);
            ctx.save();
            ctx.font = `${fs}px monospace`;
            ctx.fillStyle = color;
            ctx.globalAlpha = isActive || isSel ? 1 : 0.75;
            ctx.fillText(node.word.slice(0, 18), node.x + r + 2, node.y + fs / 3);
            ctx.restore();
          }
        })
        .onNodeClick((node: any) => {
          if (node.hub) stateRef.current.onSelect(null);
          else stateRef.current.onSelect(node.index);
        })
        .onBackgroundClick(() => stateRef.current.onSelect(null));
      fgRef.current = fg;
      document.addEventListener("visibilitychange", onVis);
      if (ref.current && typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(() => {
          try {
            fg.width(ref.current!.clientWidth).height(ref.current!.clientHeight);
          } catch {}
        });
        ro.observe(ref.current);
      }
    })();
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVis);
      try { ro?.disconnect(); } catch {}
      try { fg?._destructor?.(); } catch {}
      try { if (ref.current) ref.current.innerHTML = ""; } catch {}
      fgRef.current = null;
    };
  }, [dataKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try { fgRef.current?.refresh?.(); } catch {}
  }, [activeIndex, selectedIndex]);

  return <div ref={ref} className="absolute inset-0" aria-hidden={false} role="img" aria-label="Grafik crawler kata prompt" />;
}
