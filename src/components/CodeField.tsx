"use client";
import { useEffect, useRef } from "react";

const GLYPHS = [
  "const", "let", "var", "async", "await", "return", "import", "export",
  "class", "type", "fn", "map", "filter", "reduce", "try", "catch",
  "true", "false", "null", "void", "{}", "[]", "()", "=>", "::",
  "//", "/*", "*/", "&&", "||", "<>", "</>", "npm", "git", "fix:",
  "feat:", "chore:", "test", "build", "ship", "patch", "lint", "SIG",
  "OK", "ERR", "0x1F", "0101", "id:", "req", "res", "v2.1", "deploy", "debug",
];

const FONT = 12;
const FONT_STACK = "ui-monospace, SFMono-Regular, Menlo, monospace";
const RADIUS = 170;
const GHOST_R = 300;

interface TrailPoint { x: number; y: number; life: number }
interface Spark { x: number; y: number; vx: number; vy: number; life: number }

export default function CodeField() {
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

    let ink = cssVar("--forge-ink", "rgb(66, 66, 80)");
    let ember = cssVar("--forge-ember", "rgb(197, 86, 43)");
    let signal = cssVar("--forge-signal", "rgb(83, 166, 116)");
    let baseAlpha = 0.11;
    const readTheme = () => {
      const dark = root.classList.contains("dark");
      baseAlpha = dark ? 0.17 : 0.11;
    };
    readTheme();

    ctxEl.font = `${FONT}px ${FONT_STACK}`;
    let widest = 0;
    for (const g of GLYPHS) widest = Math.max(widest, ctxEl.measureText(g).width);
    const CELL_W = Math.ceil(widest) + 20;
    const CELL_H = FONT + 20;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let cols = 0;
    let rows = 0;
    let pick: number[] = [];
    let tone: number[] = [];
    let base: HTMLCanvasElement | null = null;
    let baseCtx: CanvasRenderingContext2D | null = null;
    let raf = 0;
    let last = 0;
    let gx = 0;
    let gy = 0;
    let px = -9999;
    let py = -9999;
    let hover = false;
    let live = true;
    let ghostOn = true;

    const trail: TrailPoint[] = [];
    const sparks: Spark[] = [];
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const anchorX = (c: number) => c * CELL_W + 14;
    const anchorY = (r: number) => r * CELL_H + CELL_H / 2;

    function buildBase() {
      if (!baseCtx || !base) return;
      baseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      baseCtx.clearRect(0, 0, w, h);
      baseCtx.font = `${FONT}px ${FONT_STACK}`;
      baseCtx.textBaseline = "middle";
      baseCtx.fillStyle = ink;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          baseCtx.globalAlpha = baseAlpha * tone[i];
          baseCtx.fillText(GLYPHS[pick[i]], anchorX(c), anchorY(r));
        }
      }
      baseCtx.globalAlpha = 1;
    }

    function layout() {
      const cw = wrapEl.clientWidth || window.innerWidth;
      dpr = Math.min(window.devicePixelRatio || 1, cw < 700 ? 1.25 : 1.6);
      w = cw;
      h = wrapEl.clientHeight || window.innerHeight;
      ghostOn = !reduced && w >= 700;
      canvasEl.width = Math.max(1, Math.floor(w * dpr));
      canvasEl.height = Math.max(1, Math.floor(h * dpr));
      canvasEl.style.width = `${w}px`;
      canvasEl.style.height = `${h}px`;
      ctxEl.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(w / CELL_W) + 1;
      rows = Math.ceil(h / CELL_H) + 1;
      pick = new Array<number>(cols * rows);
      tone = new Array<number>(cols * rows);
      for (let i = 0; i < pick.length; i++) {
        pick[i] = Math.floor(Math.random() * GLYPHS.length);
        tone[i] = rand(0.45, 1.3);
      }

      base = document.createElement("canvas");
      base.width = canvasEl.width;
      base.height = canvasEl.height;
      baseCtx = base.getContext("2d");
      buildBase();
      trail.length = 0;
      sparks.length = 0;
      gx = reduced ? w * 0.72 : w * 0.5;
      gy = reduced ? h * 0.26 : h * 0.42;
    }

    function mutate(count: number) {
      if (!baseCtx) return;
      baseCtx.font = `${FONT}px ${FONT_STACK}`;
      baseCtx.textBaseline = "middle";
      baseCtx.fillStyle = ink;
      for (let n = 0; n < count; n++) {
        const i = Math.floor(Math.random() * pick.length);
        pick[i] = Math.floor(Math.random() * GLYPHS.length);
        const c = i % cols;
        const r = Math.floor(i / cols);
        baseCtx.clearRect(c * CELL_W, r * CELL_H, CELL_W + 6, CELL_H);
        baseCtx.globalAlpha = baseAlpha * tone[i];
        baseCtx.fillText(GLYPHS[pick[i]], anchorX(c), anchorY(r));
      }
      baseCtx.globalAlpha = 1;
    }

    function influence(cx: number, cy: number, ax: number, ay: number, radius: number) {
      const dx = cx - ax;
      const dy = cy - ay;
      const d2 = dx * dx + dy * dy;
      if (d2 > radius * radius) return 0;
      const t = 1 - Math.sqrt(d2) / radius;
      return t * t;
    }

    function drawField(moving: boolean) {
      ctxEl.clearRect(0, 0, w, h);
      if (base) ctxEl.drawImage(base, 0, 0, w, h);

      let minx = Infinity;
      let miny = Infinity;
      let maxx = -Infinity;
      let maxy = -Infinity;
      const addBox = (x: number, y: number, r: number) => {
        if (x - r < minx) minx = x - r;
        if (x + r > maxx) maxx = x + r;
        if (y - r < miny) miny = y - r;
        if (y + r > maxy) maxy = y + r;
      };
      for (const t of trail) if (t.life > 0.06) addBox(t.x, t.y, RADIUS * 0.9);
      if (hover) addBox(px, py, RADIUS);
      if (ghostOn) addBox(gx, gy, GHOST_R);

      if (minx !== Infinity) {
        const c0 = Math.max(0, Math.floor(minx / CELL_W));
        const c1 = Math.min(cols - 1, Math.ceil(maxx / CELL_W));
        const r0 = Math.max(0, Math.floor(miny / CELL_H));
        const r1 = Math.min(rows - 1, Math.ceil(maxy / CELL_H));
        ctxEl.textBaseline = "middle";
        for (let r = r0; r <= r1; r++) {
          for (let c = c0; c <= c1; c++) {
            const i = r * cols + c;
            const ax = anchorX(c);
            const ay = anchorY(r);
            let inf = 0;
            let hue = ember;
            let hot = false;
            if (hover) {
              const p = influence(ax, ay, px, py, RADIUS);
              if (p > inf) {
                inf = p;
                hue = ember;
                hot = true;
              }
            }
            for (const t of trail) {
              if (t.life <= 0.06) continue;
              const q = influence(ax, ay, t.x, t.y, RADIUS * 0.9) * t.life * 0.65;
              if (q > inf) {
                inf = q;
                hue = ember;
                hot = true;
              }
            }
            const g = ghostOn ? influence(ax, ay, gx, gy, GHOST_R) * 0.4 : 0;
            if (g > inf) {
              inf = g;
              hue = signal;
              hot = false;
            }
            if (inf < 0.035) continue;
            const size = FONT * (1 + inf * 0.45);
            const ox = hot && moving ? (px - ax) * inf * 0.16 : 0;
            const oy = hot && moving ? (py - ay) * inf * 0.16 : 0;
            ctxEl.save();
            ctxEl.globalAlpha = Math.min(0.95, 0.14 + inf * 0.9);
            ctxEl.font = `${size.toFixed(2)}px ${FONT_STACK}`;
            ctxEl.fillStyle = hue;
            ctxEl.shadowColor = hue;
            ctxEl.shadowBlur = inf > 0.55 ? 5 + inf * 12 : 0;
            ctxEl.fillText(GLYPHS[pick[i]], ax + ox, ay + oy);
            ctxEl.restore();
          }
        }
      }

      for (const s of sparks) {
        ctxEl.globalAlpha = Math.max(0, s.life) * 0.8;
        ctxEl.fillStyle = ember;
        ctxEl.fillRect(s.x, s.y, 2.4, 2.4);
      }
      ctxEl.globalAlpha = 1;
    }

    function step(now: number) {
      if (!live) return;
      const dt = Math.min(64, now - last) || 16;
      last = now;

      if (!reduced) {
        const t = now * 0.00009;
        gx = w * (0.5 + 0.34 * Math.sin(t * 1.3) * Math.cos(t * 0.7));
        gy = h * (0.5 + 0.3 * Math.sin(t * 0.9 + 1.7));
        for (let i = trail.length - 1; i >= 0; i--) {
          trail[i].life -= dt / 420;
          if (trail[i].life <= 0) trail.splice(i, 1);
        }
        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
          s.vy += 0.045 * (dt / 16);
          s.x += s.vx * (dt / 16);
          s.y += s.vy * (dt / 16);
          s.life -= dt / 700;
          if (s.life <= 0) sparks.splice(i, 1);
        }
      }

      drawField(!reduced);
      if (!reduced) raf = requestAnimationFrame(step);
    }

    const onMove = (x: number, y: number) => {
      const head = trail[0];
      if (!head || Math.abs(head.x - x) + Math.abs(head.y - y) > 9) {
        trail.unshift({ x, y, life: 1 });
        if (trail.length > 8) trail.pop();
        if (!reduced && sparks.length < 80) {
          for (let n = 0; n < 2; n++) {
            sparks.push({ x, y, vx: rand(-0.9, 0.9), vy: rand(-1.1, 0.2), life: 1 });
          }
        }
      }
      px = x;
      py = y;
      hover = true;
    };

    const onPointerMove = (e: PointerEvent) => {
      onMove(e.clientX, e.clientY);
      if (reduced) drawField(false);
    };
    const onTouchMove = (e: TouchEvent) => {
      const t0 = e.touches[0];
      if (!t0) return;
      onMove(t0.clientX, t0.clientY);
      if (reduced) drawField(false);
    };
    const onLeave = () => {
      trail.length = 0;
      hover = false;
      if (reduced) drawField(false);
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

    let mutateTimer = 0;
    let resizeTimer = 0;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        layout();
        drawField(false);
      }, 160);
    };

    let observer: MutationObserver | null = null;
    const watchTheme = () => {
      observer = new MutationObserver(() => {
        ink = cssVar("--forge-ink", ink);
        ember = cssVar("--forge-ember", ember);
        signal = cssVar("--forge-signal", signal);
        readTheme();
        buildBase();
        drawField(false);
      });
      observer.observe(root, { attributes: true, attributeFilter: ["class", "style"] });
    };

    layout();
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("blur", onLeave);
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    watchTheme();

    if (reduced) {
      drawField(false);
    } else {
      last = performance.now();
      raf = requestAnimationFrame(step);
      mutateTimer = window.setInterval(() => mutate(3), 900);
    }

    return () => {
      live = false;
      cancelAnimationFrame(raf);
      clearInterval(mutateTimer);
      clearTimeout(resizeTimer);
      observer?.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("blur", onLeave);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div ref={wrapRef} className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
      <div className="absolute inset-0 bg-[var(--background)]/25" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--background)_96%)]" />
    </div>
  );
}
