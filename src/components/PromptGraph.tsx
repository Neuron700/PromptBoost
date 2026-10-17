"use client";
import { useEffect, useRef } from "react";

const TAU = Math.PI * 2;

const HUB_LABELS: { label: string; kind: number }[] = [
  { label: "PERAN", kind: 0 },
  { label: "KONTEKS", kind: 0 },
  { label: "TUJUAN", kind: 0 },
  { label: "FORMAT", kind: 0 },
  { label: "ATURAN", kind: 0 },
  { label: "TONE", kind: 1 },
  { label: "BATASAN", kind: 1 },
  { label: "CONTOH", kind: 1 },
  { label: "OUTPUT", kind: 1 },
  { label: "AUDIENCE", kind: 2 },
];

const GHOSTS = [
  "role: senior",
  "tone: santai",
  "output: markdown",
  "target: dosen",
  "gaya: ringkas",
  "deadline: 3 hari",
  "bahasa: indonesia",
  "panjang: 500 kata",
  "contoh: 2 varian",
  "dilarang: jargon",
];

const FONT_STACK = "ui-monospace, SFMono-Regular, Menlo, monospace";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  lx: number;
  ly: number;
  r: number;
  depth: number;
  kind: number;
  label: string | null;
  glow: number;
}

interface Pulse {
  e: number;
  t: number;
  sp: number;
}

interface PromptGraphProps {
  success?: boolean;
}

export default function PromptGraph({ success = false }: PromptGraphProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrapNode = wrapRef.current;
    const canvasNode = canvasRef.current;
    if (!wrapNode || !canvasNode) return;
    const ctxNode = canvasNode.getContext("2d");
    if (!ctxNode) return;
    const wrapEl: HTMLDivElement = wrapNode;
    const canvasEl: HTMLCanvasElement = canvasNode;
    const ctxEl: CanvasRenderingContext2D = ctxNode;
    const spaced = ctxEl as CanvasRenderingContext2D & { letterSpacing?: string };

    const root = document.documentElement;
    let reduced = false;
    let lowPower = false;
    try {
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {}
    try {
      const nav = navigator as Navigator & { deviceMemory?: number; hardwareConcurrency?: number };
      lowPower = (nav.deviceMemory ?? 8) <= 4 || (nav.hardwareConcurrency ?? 8) <= 4;
    } catch {}

    const cssVar = (name: string, fallback: string) => {
      try {
        const v = getComputedStyle(root).getPropertyValue(name).trim();
        return v || fallback;
      } catch {
        return fallback;
      }
    };

    const ink = cssVar("--forge-ink", "rgb(240,240,246)");
    const ember = cssVar("--forge-ember", "rgb(197,86,43)");
    const signal = cssVar("--forge-signal", "rgb(74,168,110)");
    const warn = cssVar("--forge-warn", "rgb(196,150,60)");
    const line = cssVar("--forge-line", "rgb(70,70,84)");
    const muted = cssVar("--forge-muted", "rgb(150,150,165)");
    const KIND_COLOR = [ember, signal, warn];

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let last = 0;
    let live = true;
    let frame = 0;

    let px = -9999;
    let py = -9999;
    let pointerIn = false;
    let intro = 0;
    let burst = success ? 1 : 0;
    let aura = 0;

    const nodes: Node[] = [];
    const edges: number[][] = [];
    const pulses: Pulse[] = [];
    const ripples: { x: number; y: number; r: number; life: number }[] = [];
    let base: HTMLCanvasElement | null = null;

    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

    const noise = (x: number, y: number) => {
      const v = Math.sin(x * 0.0091 + Math.cos(y * 0.0073) * 2.1) + Math.cos(y * 0.0104 + Math.sin(x * 0.0067) * 1.7);
      return clamp(0.45 + v * 0.28, 0.16, 1);
    };

    function buildBase() {
      const c = document.createElement("canvas");
      c.width = canvasEl.width;
      c.height = canvasEl.height;
      const g = c.getContext("2d");
      if (!g) return c;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = line;
      g.globalAlpha = 0.15;
      const step = 28;
      for (let y = step / 2; y < h; y += step) {
        for (let x = step / 2; x < w; x += step) {
          g.fillRect(x, y, 1.2, 1.2);
        }
      }
      g.fillStyle = muted;
      g.globalAlpha = 0.5;
      g.font = `10px ${FONT_STACK}`;
      g.textBaseline = "middle";
      const ghosts = Math.floor((w * h) / 150000);
      for (let i = 0; i < ghosts; i++) {
        g.globalAlpha = rand(0.03, 0.08);
        g.fillText(GHOSTS[Math.floor(Math.random() * GHOSTS.length)], rand(20, w - 90), rand(20, h - 20));
      }
      g.globalAlpha = 1;
      return c;
    }

    function layout() {
      const cw = wrapEl.clientWidth || window.innerWidth;
      const ch = wrapEl.clientHeight || window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, cw < 700 ? 1.25 : 1.5);
      w = cw;
      h = ch;
      canvasEl.width = Math.max(1, Math.floor(w * dpr));
      canvasEl.height = Math.max(1, Math.floor(h * dpr));
      canvasEl.style.width = `${w}px`;
      canvasEl.style.height = `${h}px`;
      ctxEl.setTransform(dpr, 0, 0, dpr, 0, 0);
      base = buildBase();

      nodes.length = 0;
      edges.length = 0;
      pulses.length = 0;
      ripples.length = 0;

      const pad = Math.max(20, Math.min(w, h) * 0.05);
      const density = lowPower ? 1 / 38000 : 1 / 24000;
      const target = clamp(Math.round(w * h * density), 26, lowPower ? 54 : 92);
      const aspect = w / h;
      const cols = Math.max(3, Math.round(Math.sqrt(target * aspect)));
      const rows = Math.max(3, Math.round(target / cols));
      const sx = (w - pad * 2) / Math.max(1, cols - 1);
      const sy = (h - pad * 2) / Math.max(1, rows - 1);
      const jx = sx * 0.34;
      const jy = sy * 0.34;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = clamp(pad + c * sx + rand(-jx, jx), 8, w - 8);
          const y = clamp(pad + r * sy + rand(-jy, jy), 8, h - 8);
          const depth = noise(x, y);
          nodes.push({
            x,
            y,
            vx: 0,
            vy: 0,
            lx: x,
            ly: y,
            r: 1.5 + depth * 1.7,
            depth,
            kind: 3,
            label: null,
            glow: 0,
          });
        }
      }

      const order = nodes.map((_, i) => i);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      const sep = Math.min(w, h) * 0.24;
      const picked: number[] = [];
      for (const idx of order) {
        if (picked.length >= HUB_LABELS.length) break;
        const n = nodes[idx];
        let ok = true;
        for (const p of picked) {
          const m = nodes[p];
          if (Math.hypot(m.lx - n.lx, m.ly - n.ly) < sep) {
            ok = false;
            break;
          }
        }
        if (ok) picked.push(idx);
      }
      for (let i = 0; i < picked.length; i++) {
        const n = nodes[picked[i]];
        n.label = HUB_LABELS[i % HUB_LABELS.length].label;
        n.kind = HUB_LABELS[i % HUB_LABELS.length].kind;
        n.r += 1.2;
      }

      const linkDist = Math.hypot(sx, sy) * 1.75;
      const seen = new Set<number>();
      const key = (a: number, b: number) => (a < b ? a * 100000 + b : b * 100000 + a);
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        const cand: { j: number; d: number }[] = [];
        for (let j = 0; j < nodes.length; j++) {
          if (j === i) continue;
          const d = Math.hypot(a.lx - nodes[j].lx, a.ly - nodes[j].ly);
          if (d <= linkDist) cand.push({ j, d });
        }
        cand.sort((p, q) => p.d - q.d);
        const maxLinks = a.label ? 5 : 3;
        let linked = 0;
        for (const c of cand) {
          if (linked >= maxLinks) break;
          const k = key(i, c.j);
          if (seen.has(k)) continue;
          seen.add(k);
          edges.push([i, c.j]);
          linked++;
        }
      }

      const pulseCount = reduced ? 0 : lowPower ? 6 : 12;
      for (let i = 0; i < pulseCount; i++) {
        pulses.push({ e: Math.floor(Math.random() * edges.length), t: Math.random(), sp: rand(0.004, 0.012) });
      }

      px = -9999;
      py = -9999;
    }

    function quadPoint(ax: number, ay: number, cx: number, cy: number, bx: number, by: number, t: number) {
      const u = 1 - t;
      return { x: u * u * ax + 2 * u * t * cx + t * t * bx, y: u * u * ay + 2 * u * t * cy + t * t * by };
    }

    function drawEdge(a: Node, b: Node) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const sa = Math.hypot(a.x - a.lx, a.y - a.ly);
      const sb = Math.hypot(b.x - b.lx, b.y - b.ly);
      const tension = Math.min(1, (sa + sb) / 58);
      const bow = Math.min(48, (sa + sb) * 0.34);
      const nx = -dy / len;
      const ny = dx / len;
      const cx = (a.x + b.x) / 2 + nx * bow;
      const cy = (a.y + b.y) / 2 + ny * bow;
      const depth = (a.depth + b.depth) / 2;
      ctxEl.globalAlpha = (0.06 + depth * 0.13 + tension * 0.32) * intro;
      ctxEl.strokeStyle = tension > 0.6 ? ember : line;
      ctxEl.lineWidth = 0.5 + depth * 0.6 + tension * 0.7;
      ctxEl.beginPath();
      ctxEl.moveTo(a.x, a.y);
      ctxEl.quadraticCurveTo(cx, cy, b.x, b.y);
      ctxEl.stroke();
      return { cx, cy, tension };
    }

    function glowDot(x: number, y: number, r: number, color: string, power: number) {
      if (power > 0.03) {
        const gr = r * 7 * (0.6 + power);
        const g = ctxEl.createRadialGradient(x, y, 0, x, y, gr);
        g.addColorStop(0, color);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctxEl.globalCompositeOperation = "lighter";
        ctxEl.globalAlpha = Math.min(1, power) * 0.5;
        ctxEl.fillStyle = g;
        ctxEl.fillRect(x - gr, y - gr, gr * 2, gr * 2);
        ctxEl.globalCompositeOperation = "source-over";
      }
      ctxEl.globalAlpha = Math.min(1, 0.45 + power);
      ctxEl.fillStyle = color;
      ctxEl.beginPath();
      ctxEl.arc(x, y, r, 0, TAU);
      ctxEl.fill();
    }

    function draw() {
      ctxEl.clearRect(0, 0, w, h);
      if (base) ctxEl.drawImage(base, 0, 0, w, h);
      const easeIntro = Math.min(1, intro);

      if (burst > 0.01) {
        const rr = Math.max(0, (1 - burst) * Math.max(w, h) * 0.7);
        const g = ctxEl.createRadialGradient(w * 0.5, h * 0.5, Math.max(0, rr - 46), w * 0.5, h * 0.5, rr + 46);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(0.5, signal);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctxEl.globalCompositeOperation = "lighter";
        ctxEl.globalAlpha = burst * 0.46;
        ctxEl.fillStyle = g;
        ctxEl.fillRect(0, 0, w, h);
        ctxEl.globalAlpha = burst * 0.6;
        ctxEl.strokeStyle = signal;
        ctxEl.lineWidth = 1.6;
        ctxEl.beginPath();
        ctxEl.arc(w * 0.5, h * 0.5, rr, 0, TAU);
        ctxEl.stroke();
        ctxEl.globalCompositeOperation = "source-over";
      }

      if (pointerIn && aura > 0.01 && !reduced) {
        const gr = 290;
        const g = ctxEl.createRadialGradient(px, py, 0, px, py, gr);
        g.addColorStop(0, ember);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctxEl.globalCompositeOperation = "lighter";
        ctxEl.globalAlpha = aura * 0.055;
        ctxEl.fillStyle = g;
        ctxEl.fillRect(px - gr, py - gr, gr * 2, gr * 2);
        ctxEl.globalCompositeOperation = "source-over";
      }

      const curves: { cx: number; cy: number; tension: number }[] = [];
      for (const e of edges) {
        const a = nodes[e[0]];
        const b = nodes[e[1]];
        if (!a || !b) {
          curves.push({ cx: 0, cy: 0, tension: 0 });
          continue;
        }
        curves.push(drawEdge(a, b));
      }

      if (!reduced) {
        for (const p of pulses) {
          const e = edges[p.e];
          if (!e) continue;
          const a = nodes[e[0]];
          const b = nodes[e[1]];
          const c = curves[p.e];
          if (!a || !b || !c) continue;
          const pt = quadPoint(a.x, a.y, c.cx, c.cy, b.x, b.y, p.t);
          glowDot(pt.x, pt.y, 1.5 + p.t * 0.7, ember, (0.4 + c.tension) * easeIntro);
        }
      }

      for (const n of nodes) {
        if (n.label) continue;
        const r = n.r * (0.5 + n.depth * 0.6) * (0.35 + easeIntro * 0.65);
        ctxEl.globalAlpha = (0.18 + n.depth * 0.42) * easeIntro;
        ctxEl.fillStyle = n.glow > 0.18 ? ember : muted;
        ctxEl.beginPath();
        ctxEl.arc(n.x, n.y, r, 0, TAU);
        ctxEl.fill();
      }

      ctxEl.globalAlpha = 1;
      for (const n of nodes) {
        if (!n.label) continue;
        glowDot(n.x, n.y, n.r, KIND_COLOR[n.kind], (0.22 + n.depth * 0.36) * easeIntro + n.glow);
      }
      ctxEl.globalAlpha = 1;

      ctxEl.font = `11px ${FONT_STACK}`;
      ctxEl.textBaseline = "middle";
      spaced.letterSpacing = "0.14em";
      const labelAlpha = Math.max(0, (easeIntro - 0.35) / 0.65);
      for (const n of nodes) {
        if (!n.label) continue;
        const hot = n.glow > 0.12;
        ctxEl.globalAlpha = Math.min(1, (0.2 + n.depth * 0.28 + n.glow * 0.85) * labelAlpha);
        ctxEl.fillStyle = hot ? ember : n.kind === 0 ? ink : muted;
        const tw = ctxEl.measureText(n.label).width;
        const left = n.lx > w * 0.62;
        const tx = left ? n.x - tw - 9 : n.x + 9;
        ctxEl.fillText(n.label, tx, n.y + 0.5);
      }
      ctxEl.globalAlpha = 1;
      spaced.letterSpacing = "0px";

      for (const rp of ripples) {
        ctxEl.globalAlpha = Math.max(0, rp.life) * 0.28;
        ctxEl.strokeStyle = ember;
        ctxEl.lineWidth = 1;
        ctxEl.beginPath();
        ctxEl.arc(rp.x, rp.y, rp.r, 0, TAU);
        ctxEl.stroke();
      }
      ctxEl.globalAlpha = 1;
    }

    function step(now: number) {
      if (!live) return;
      const dtMs = now - last || 16;
      last = now;
      const stepF = Math.max(0, Math.min(3, dtMs / 16.667));
      frame += stepF;

      intro = Math.min(1, intro + 0.022 * stepF);
      aura += ((pointerIn ? 1 : 0) - aura) * 0.08 * stepF;
      if (burst > 0) burst = Math.max(0, Math.min(1, burst - 0.012 * stepF));

      const R = 340;
      const R2 = R * R;
      const pullOn = pointerIn && !reduced && intro > 0.5;

      for (const n of nodes) {
        let ax = 0;
        let ay = 0;

        if (pullOn) {
          const dx = px - n.x;
          const dy = py - n.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < R2) {
            const d = Math.sqrt(d2) || 1;
            const f = 1 - d / R;
            const g = Math.pow(f, 1.6);
            const depthF = 0.6 + n.depth * 0.6;
            const acc = g * 2.3 * depthF;
            ax += (dx / d) * acc;
            ay += (dy / d) * acc;
            if (d < 42) {
              const push = (42 - d) * 0.04;
              ax -= (dx / d) * push;
              ay -= (dy / d) * push;
            }
            n.glow = Math.max(n.glow, g * (0.3 + n.depth * 0.8));
          }
        }

        const k = 0.014 + n.depth * 0.02;
        ax += (n.lx - n.x) * k;
        ay += (n.ly - n.y) * k;

        const rx = n.x - n.lx;
        const ry = n.y - n.ly;
        const drift = Math.hypot(rx, ry);
        const maxD = 54 + n.depth * 52;
        if (drift > maxD) {
          ax -= (rx / drift) * (drift - maxD) * 0.16;
          ay -= (ry / drift) * (drift - maxD) * 0.16;
        }

        if (burst > 0) {
          const bx = n.x - w * 0.5;
          const by = n.y - h * 0.5;
          const bd = Math.hypot(bx, by) || 1;
          ax += (bx / bd) * burst * 3.4;
          ay += (by / bd) * burst * 3.4;
          n.glow = Math.max(n.glow, burst);
        }

        n.vx = (n.vx + ax * stepF) * Math.pow(0.9, stepF);
        n.vy = (n.vy + ay * stepF) * Math.pow(0.9, stepF);
        n.x += n.vx * stepF;
        n.y += n.vy * stepF;
        n.glow = Math.max(0, n.glow - 0.02 * stepF);
      }

      if (!reduced) {
        for (const p of pulses) {
          p.t += p.sp * stepF;
          if (p.t >= 1) {
            p.t = 0;
            p.e = Math.floor(Math.random() * edges.length);
            p.sp = rand(0.004, 0.012);
          }
        }
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += (56 - rp.r) * 0.06 * stepF;
        rp.life -= 0.02 * stepF;
        if (rp.life <= 0) ripples.splice(i, 1);
      }

      draw();
      raf = requestAnimationFrame(step);
    }

    let resizeTimer = 0;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        layout();
        intro = 0.85;
        if (reduced) draw();
      }, 180);
    };

    const onPointerMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      const first = !pointerIn;
      pointerIn = true;
      if (reduced) return;
      if (first || (frame % 9 < 1 && ripples.length < 6)) {
        ripples.push({ x: e.clientX, y: e.clientY, r: 6, life: 1 });
      }
    };

    const onLeave = () => {
      pointerIn = false;
      px = -9999;
      py = -9999;
    };

    const onAuthSuccess = () => {
      burst = 1;
    };

    const onVisibility = () => {
      if (document.hidden) {
        live = false;
        cancelAnimationFrame(raf);
      } else if (!live) {
        live = true;
        last = performance.now();
        if (!reduced) raf = requestAnimationFrame(step);
      }
    };

    layout();
    for (const n of nodes) {
      n.x = n.lx;
      n.y = n.ly;
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("blur", onLeave);
    window.addEventListener("forge:auth-success", onAuthSuccess);
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);

    if (reduced) {
      intro = 1;
      draw();
    } else {
      intro = 0;
      last = performance.now();
      raf = requestAnimationFrame(step);
    }

    return () => {
      live = false;
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("blur", onLeave);
      window.removeEventListener("forge:auth-success", onAuthSuccess);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [success]);

  return (
    <div ref={wrapRef} className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
      <div className="absolute inset-0 bg-[var(--background)]/14" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_46%,var(--background)_100%)]" />
    </div>
  );
}
