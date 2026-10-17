"use client";
import { useEffect, useRef } from "react";

const LINES = [
  { label: "PERAN", value: "programmer senior" },
  { label: "KONTEKS", value: "mahasiswa informatika" },
  { label: "TUJUAN", value: "website portfolio" },
  { label: "FORMAT", value: "langkah demi langkah" },
  { label: "ATURAN", value: "tanpa basa basi" },
];

const FONT = 12;
const HEAD_FONT = 10;
const LINE_H = 21;
const HEAD_H = 22;
const PAD = 15;
const GAP_COL = 18;
const FONT_STACK = "ui-monospace, SFMono-Regular, Menlo, monospace";
const SCRAMBLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*<>{}[]/\\+=~^";

interface Token {
  text: string;
  sx: number;
  sy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  lock: number;
  glow: number;
  armed: boolean;
  label: boolean;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export default function PromptField() {
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

    const root = document.documentElement;
    let reduced = false;
    try {
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {}

    const cssVar = (name: string, fallback: string) => {
      try {
        const v = getComputedStyle(root).getPropertyValue(name).trim();
        return v || fallback;
      } catch {
        return fallback;
      }
    };

    const ink = cssVar("--forge-ink", "rgb(240, 240, 245)");
    const ember = cssVar("--forge-ember", "rgb(197, 86, 43)");
    const line = cssVar("--forge-line", "rgb(70, 70, 84)");
    const muted = cssVar("--forge-muted", "rgb(150, 150, 165)");
    const card = cssVar("--card", "rgb(30, 30, 38)");

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let last = 0;
    let live = true;
    let frame = 0;

    let panelW = 0;
    let panelH = 0;
    let labelW = 0;

    let ax = 0;
    let ay = 0;
    let tx = 0;
    let ty = 0;
    let idle = 0;
    let hasPointer = false;
    let showPanel = true;

    const tokens: Token[] = [];
    const sparks: Spark[] = [];
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    let base: HTMLCanvasElement | null = null;

    function measure() {
      ctxEl.font = `${FONT}px ${FONT_STACK}`;
      labelW = 0;
      let valW = 0;
      for (const l of LINES) {
        labelW = Math.max(labelW, ctxEl.measureText(l.label).width);
        valW = Math.max(valW, ctxEl.measureText(l.value).width);
      }
      panelW = Math.ceil(PAD * 2 + labelW + GAP_COL + valW);
      panelH = Math.ceil(PAD * 2 + HEAD_H + LINES.length * LINE_H);
    }

    function buildBase() {
      const c = document.createElement("canvas");
      c.width = canvasEl.width;
      c.height = canvasEl.height;
      const g = c.getContext("2d");
      if (!g) return c;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = line;
      g.globalAlpha = 0.22;
      const step = 26;
      for (let y = step / 2; y < h; y += step) {
        for (let x = step / 2; x < w; x += step) {
          g.fillRect(x, y, 1.4, 1.4);
        }
      }
      g.globalAlpha = 0.5;
      g.fillStyle = muted;
      g.font = `${HEAD_FONT}px ${FONT_STACK}`;
      g.textBaseline = "middle";
      for (let i = 0; i < Math.floor((w * h) / 120000); i++) {
        const s = LINES[Math.floor(Math.random() * LINES.length)];
        const t = Math.random() > 0.5 ? s.label : s.value;
        g.globalAlpha = rand(0.04, 0.1);
        g.fillText(t, rand(0, w), rand(0, h));
      }
      g.globalAlpha = 1;
      return c;
    }

    function scatter(t: Token, wide: boolean) {
      const a = rand(0, Math.PI * 2);
      const r = wide ? rand(0.45, 0.95) * Math.max(w, h) * 0.5 : rand(60, 220);
      t.x = ax + t.sx + Math.cos(a) * r;
      t.y = ay + t.sy + Math.sin(a) * r;
      t.vx = 0;
      t.vy = 0;
      t.lock = 0;
      t.glow = 0;
      t.armed = false;
    }

    function layout() {
      const cw = wrapEl.clientWidth || window.innerWidth;
      const ch = wrapEl.clientHeight || window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, cw < 700 ? 1.25 : 1.6);
      w = cw;
      h = ch;
      canvasEl.width = Math.max(1, Math.floor(w * dpr));
      canvasEl.height = Math.max(1, Math.floor(h * dpr));
      canvasEl.style.width = `${w}px`;
      canvasEl.style.height = `${h}px`;
      ctxEl.setTransform(dpr, 0, 0, dpr, 0, 0);

      measure();
      base = buildBase();

      showPanel = w >= 1024;

      ax = w * 0.5;
      ay = h * 0.42;
      tx = ax;
      ty = ay;

      tokens.length = 0;
      sparks.length = 0;
      LINES.forEach((l, i) => {
        const sy = PAD + HEAD_H + i * LINE_H + LINE_H / 2;
        const labelTok: Token = {
          text: l.label,
          sx: PAD,
          sy,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          lock: 0,
          glow: 0,
          armed: false,
          label: true,
        };
        const valTok: Token = {
          text: l.value,
          sx: PAD + labelW + GAP_COL,
          sy,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          lock: 0,
          glow: 0,
          armed: false,
          label: false,
        };
        scatter(labelTok, true);
        scatter(valTok, true);
        tokens.push(labelTok, valTok);
      });
    }

    function roundRect(x: number, y: number, rw: number, rh: number, r: number) {
      ctxEl.beginPath();
      ctxEl.moveTo(x + r, y);
      ctxEl.arcTo(x + rw, y, x + rw, y + rh, r);
      ctxEl.arcTo(x + rw, y + rh, x, y + rh, r);
      ctxEl.arcTo(x, y + rh, x, y, r);
      ctxEl.arcTo(x, y, x + rw, y, r);
      ctxEl.closePath();
    }

    function decode(text: string, progress: number, seed: number) {
      if (progress >= 1) return text;
      const keep = Math.floor(text.length * progress);
      const s = Math.floor(seed) % 9973;
      const n = SCRAMBLE.length;
      let out = "";
      for (let i = 0; i < text.length; i++) {
        if (i < keep || text[i] === " ") out += text[i];
        else out += SCRAMBLE[(i * 7 + s) % n];
      }
      return out;
    }

    function draw() {
      ctxEl.clearRect(0, 0, w, h);
      if (base) ctxEl.drawImage(base, 0, 0, w, h);
      if (!showPanel) return;

      const manifold = ctxEl.createRadialGradient(ax + panelW / 2, ay + panelH / 2, 10, ax + panelW / 2, ay + panelH / 2, panelW * 0.95);
      manifold.addColorStop(0, ember);
      manifold.addColorStop(1, "rgba(0,0,0,0)");
      ctxEl.globalAlpha = 0.16;
      ctxEl.fillStyle = manifold;
      ctxEl.fillRect(ax - panelW * 0.5, ay - panelH * 0.5, panelW * 2, panelH * 2);
      ctxEl.globalAlpha = 1;

      ctxEl.fillStyle = card;
      ctxEl.globalAlpha = 0.72;
      roundRect(ax, ay, panelW, panelH, 14);
      ctxEl.fill();
      ctxEl.globalAlpha = 0.9;
      ctxEl.strokeStyle = line;
      ctxEl.lineWidth = 1;
      roundRect(ax + 0.5, ay + 0.5, panelW - 1, panelH - 1, 14);
      ctxEl.stroke();
      ctxEl.globalAlpha = 1;

      ctxEl.font = `${HEAD_FONT}px ${FONT_STACK}`;
      ctxEl.textBaseline = "middle";
      ctxEl.fillStyle = ember;
      ctxEl.globalAlpha = 0.85;
      ctxEl.fillText("PROMPT", ax + PAD, ay + PAD + HEAD_H / 2 - 2);
      ctxEl.fillStyle = muted;
      ctxEl.globalAlpha = 0.6;
      ctxEl.fillText("terstruktur", ax + PAD + ctxEl.measureText("PROMPT").width + 10, ay + PAD + HEAD_H / 2 - 2);
      ctxEl.globalAlpha = 0.35;
      ctxEl.fillStyle = line;
      ctxEl.fillRect(ax + PAD, ay + PAD + HEAD_H - 6, panelW - PAD * 2, 1);
      ctxEl.globalAlpha = 1;

      ctxEl.font = `${FONT}px ${FONT_STACK}`;
      for (const t of tokens) {
        if (t.lock > 0.75) continue;
        ctxEl.globalAlpha = 0.22 * (1 - t.lock);
        ctxEl.fillStyle = line;
        const tw = ctxEl.measureText(t.text).width;
        ctxEl.fillRect(ax + t.sx, ay + t.sy - 1, tw, 2);
      }
      ctxEl.globalAlpha = 1;

      for (const s of sparks) {
        ctxEl.globalAlpha = Math.max(0, s.life) * 0.85;
        ctxEl.fillStyle = ember;
        ctxEl.fillRect(s.x, s.y, 2.2, 2.2);
      }
      ctxEl.globalAlpha = 1;

      let settled = true;
      let progress = 0;
      for (const t of tokens) {
        progress += t.lock;
        if (t.lock < 1) settled = false;
        ctxEl.save();
        ctxEl.globalAlpha = 0.25 + t.lock * 0.75;
        ctxEl.fillStyle = t.label ? ember : ink;
        ctxEl.shadowColor = ember;
        ctxEl.shadowBlur = t.glow > 0 ? 8 + t.glow * 14 : 0;
        ctxEl.fillText(decode(t.text, t.lock, t.text.charCodeAt(0) + frame), t.x, t.y);
        ctxEl.restore();
      }
      progress /= tokens.length;

      if (progress < 0.999) {
        ctxEl.globalAlpha = 0.75;
        ctxEl.fillStyle = ember;
        ctxEl.fillRect(ax + PAD, ay + panelH - PAD + 3, (panelW - PAD * 2) * progress, 2);
        ctxEl.globalAlpha = 1;
      }

      if (settled) {
        const blink = 0.35 + 0.65 * Math.abs(Math.sin(frame / 34));
        const lastToken = tokens[tokens.length - 1];
        const cx = ax + lastToken.sx + ctxEl.measureText(lastToken.text).width + 4;
        const cy = ay + lastToken.sy;
        ctxEl.globalAlpha = blink;
        ctxEl.fillStyle = ember;
        ctxEl.fillRect(cx, cy - 7, 2, 13);
        ctxEl.globalAlpha = 1;
      }
    }

    function step(now: number) {
      if (!live) return;
      const dt = Math.min(64, now - last) || 16;
      last = now;
      frame += dt / 16;

      if (!hasPointer || idle > 2600) {
        const t = now * 0.00016;
        tx = w * 0.68 - panelW / 2 + 52 * Math.sin(t * 0.8) * Math.cos(t * 0.47);
        ty = h * 0.22 + 46 * Math.sin(t * 0.66 + 1.2);
      }
      idle += dt;

      const ease = Math.min(1, dt / 16) * 0.085;
      ax += (tx - ax) * ease;
      ay += (ty - ay) * ease;

      const minX = Math.max(6, w - panelW - 6);
      const minY = Math.max(6, h - panelH - 6);
      if (ax < 6) {
        ax = 6;
        tx = Math.max(tx, 6);
      }
      if (ax > minX) {
        ax = minX;
        tx = Math.min(tx, minX);
      }
      if (ay < 6) {
        ay = 6;
        ty = Math.max(ty, 6);
      }
      if (ay > minY) {
        ay = minY;
        ty = Math.min(ty, minY);
      }

      const drag = Math.pow(0.855, dt / 16);
      for (const t of tokens) {
        const hx = ax + t.sx;
        const hy = ay + t.sy;
        t.vx = (t.vx + (hx - t.x) * 0.07 * (dt / 16)) * drag;
        t.vy = (t.vy + (hy - t.y) * 0.07 * (dt / 16)) * drag;
        t.x += t.vx * (dt / 16);
        t.y += t.vy * (dt / 16);
        const dist = Math.hypot(hx - t.x, hy - t.y);
        const wasLocked = t.lock > 0.9;
        if (dist < 0.7) {
          t.x = hx;
          t.y = hy;
          t.vx = 0;
          t.vy = 0;
        }
        t.lock = dist < 0.9 ? 1 : Math.max(0, Math.min(1, 1 - dist / 26));
        t.glow = Math.max(0, t.glow - dt / 520);
        if (t.lock > 0.9 && !wasLocked && !t.armed) {
          t.armed = true;
          t.glow = 1;
        }
        if (t.lock < 0.5) t.armed = false;
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.vy += 0.04 * (dt / 16);
        s.x += s.vx * (dt / 16);
        s.y += s.vy * (dt / 16);
        s.life -= dt / 620;
        if (s.life <= 0) sparks.splice(i, 1);
      }

      draw();
      raf = requestAnimationFrame(step);
    }

    let scatterTimer = 0;
    const onWindowResize = () => {
      clearTimeout(scatterTimer);
      scatterTimer = window.setTimeout(() => layout(), 170);
    };

    const onPointerMove = (e: PointerEvent) => {
      tx = e.clientX - panelW / 2;
      ty = e.clientY - panelH / 2;
      hasPointer = true;
      idle = 0;
      if (!reduced && sparks.length < 70 && Math.random() > 0.72) {
        sparks.push({ x: e.clientX + rand(-16, 16), y: e.clientY + rand(-16, 16), vx: rand(-0.5, 0.5), vy: rand(-0.7, 0.1), life: 1 });
      }
      if (reduced) {
        ax = tx;
        ay = ty;
        for (const t of tokens) {
          t.x = ax + t.sx;
          t.y = ay + t.sy;
          t.lock = 1;
        }
        draw();
      }
    };

    const onLeave = () => {
      hasPointer = false;
      idle = 9999;
      if (reduced) draw();
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
    for (const t of tokens) {
      t.x = ax + t.sx;
      t.y = ay + t.sy;
      t.lock = 1;
    }
    if (reduced) {
      ax = w * 0.5;
      ay = h * 0.42;
      tx = ax;
      ty = ay;
      for (const t of tokens) {
        t.x = ax + t.sx;
        t.y = ay + t.sy;
        t.lock = 1;
        t.glow = 0;
      }
      draw();
    } else {
      for (const t of tokens) scatter(t, true);
      last = performance.now();
      raf = requestAnimationFrame(step);
    }

    let mutator = 0;
    if (!reduced) {
      mutator = window.setInterval(() => {
        if (document.hidden) return;
        const candidates = tokens.filter((t) => t.lock > 0.9);
        if (!candidates.length) return;
        scatter(candidates[Math.floor(Math.random() * candidates.length)], false);
      }, 4200);
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("resize", onWindowResize);
    window.addEventListener("blur", onLeave);
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      live = false;
      cancelAnimationFrame(raf);
      clearInterval(mutator);
      clearTimeout(scatterTimer);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onWindowResize);
      window.removeEventListener("blur", onLeave);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div ref={wrapRef} className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
      <div className="absolute inset-0 bg-[var(--background)]/18" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_38%,var(--background)_97%)]" />
    </div>
  );
}
