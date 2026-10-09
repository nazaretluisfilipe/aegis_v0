import { useEffect, useRef } from "react";

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** Velocidade da animação. 0.5 = deriva calma, mas visível. Reduza para algo como 0.3 se quiser mais sutil. */
const SPEED = 0.5;

/** Fundo animado do hero: massas de azul que derivam sobre o preto. Canvas 2D em meia resolução. */
export default function HeroGradient() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bg = hex("#030712");
    const [c0, c1, c2] = ["#2F7BFF", "#0B1F6B", "#16348F"].map(hex);
    const gain = 0.9;
    let raf = 0, visible = true, last = 0, t = 0;

    const draw = (s: number) => {
      const w = cv.width, h = cv.height;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = `rgb(${bg})`;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = "lighter";
      const blobs = [
        { x: 0.76 + Math.sin(s * 1.3) * 0.12, y: 0.8 + Math.cos(s * 1.1) * 0.07, r: 0.62 + Math.sin(s * 0.9) * 0.05, c: c1, a: 0.95 },
        { x: 0.56 + Math.cos(s * 1.0) * 0.14, y: 0.92 + Math.sin(s * 1.4) * 0.07, r: 0.5 + Math.cos(s * 1.1) * 0.05, c: c2, a: 0.85 },
        { x: 0.86 + Math.sin(s * 1.7 + 1) * 0.1, y: 0.88 + Math.cos(s * 1.2) * 0.07, r: 0.34 + Math.sin(s * 1.3) * 0.04, c: c0, a: 0.9 * gain },
      ];
      for (const b of blobs) {
        const g = ctx.createRadialGradient(b.x * w, b.y * h, 0, b.x * w, b.y * h, b.r * Math.max(w, h));
        g.addColorStop(0, `rgba(${b.c},${b.a})`);
        g.addColorStop(1, `rgba(${b.c},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      // faixa de luz fina, como a superfície da água
      ctx.globalCompositeOperation = "screen";
      const ly = (0.7 + Math.sin(s * 2) * 0.04) * h;
      const lg = ctx.createLinearGradient(0, ly - h * 0.08, 0, ly + h * 0.08);
      lg.addColorStop(0, `rgba(${c0},0)`);
      lg.addColorStop(0.5, `rgba(${c0},${0.1 * gain})`);
      lg.addColorStop(1, `rgba(${c0},0)`);
      ctx.fillStyle = lg;
      ctx.fillRect(w * 0.3, ly - h * 0.08, w * 0.7, h * 0.16);
    };

    const loop = (now: number) => {
      t += (Math.min(now - last, 100) / 1000) * SPEED;
      last = now;
      draw(t);
      raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
    };
    const start = () => {
      if (reduce || raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const size = () => {
      const d = Math.min(window.devicePixelRatio || 1, 1.5);
      cv.width = Math.max(1, cv.clientWidth * d * 0.5);
      cv.height = Math.max(1, cv.clientHeight * d * 0.5);
      draw(t);
    };

    // pausa fora da tela e com a aba em segundo plano
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      visible ? start() : stop();
    });
    const onVis = () => (document.hidden ? stop() : start());

    size();
    io.observe(cv);
    window.addEventListener("resize", size);
    document.addEventListener("visibilitychange", onVis);
    start();
    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("resize", size);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    />
  );
}
