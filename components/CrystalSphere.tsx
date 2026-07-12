// components/CrystalSphere.tsx — "bola de cristal do negócio" (seção 2 da spec).
// Esfera 3D de partículas em canvas, com parallax magnético no mouse e
// respiração orgânica. Tons de azul. Estado vazio exibe a mensagem da spec.
"use client";

import { useEffect, useRef } from "react";

interface Particle {
  theta: number;
  phi: number;
  speed: number;
  r: number;
}

export function CrystalSphere({
  empty,
  caption,
}: {
  empty: boolean;
  /** Sobrescreve a legenda padrão (usado na landing, fora do contexto de dados). */
  caption?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;
    const ctx: CanvasRenderingContext2D = ctx2d;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 300;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = 110;

    // Distribui partículas na superfície da esfera
    const count = empty ? 90 : 150;
    const particles: Particle[] = Array.from({ length: count }, () => ({
      theta: Math.random() * Math.PI * 2,
      phi: Math.acos(2 * Math.random() - 1),
      speed: 0.001 + Math.random() * 0.003,
      r: 0.8 + Math.random() * 1.6,
    }));

    let raf = 0;
    let t = 0;

    function frame() {
      t += 1;
      ctx.clearRect(0, 0, size, size);

      // respiração: leve variação do raio
      const breathe = 1 + Math.sin(t * 0.02) * 0.03;
      // parallax magnético
      const tiltX = (mouse.current.x - cx) / cx;
      const tiltY = (mouse.current.y - cy) / cy;

      const pts = particles.map((p) => {
        p.theta += p.speed;
        const rr = radius * breathe;
        const x = rr * Math.sin(p.phi) * Math.cos(p.theta);
        const y = rr * Math.sin(p.phi) * Math.sin(p.theta);
        const z = rr * Math.cos(p.phi);
        // rotação pelo mouse (parallax)
        const rx = x + tiltX * 18;
        const ry = y + tiltY * 18;
        return { x: rx, y: ry, z, r: p.r };
      });

      pts.sort((a, b) => a.z - b.z);

      for (const p of pts) {
        const scale = (p.z + radius) / (radius * 2); // 0..1 (profundidade)
        const alpha = 0.15 + scale * 0.75;
        const px = cx + p.x;
        const py = cy + p.y;
        ctx.beginPath();
        ctx.arc(px, py, p.r * (0.4 + scale), 0, Math.PI * 2);
        // tons de azul: mais claro na frente
        const blue = Math.floor(120 + scale * 130);
        ctx.fillStyle = `rgba(${80 + scale * 40}, ${150 + scale * 60}, ${blue + 40}, ${alpha})`;
        ctx.fill();
      }

      // brilho central
      const grd = ctx.createRadialGradient(cx, cy, 6, cx, cy, radius);
      grd.addColorStop(0, "rgba(120,180,255,0.18)");
      grd.addColorStop(1, "rgba(30,99,196,0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(frame);
    }
    frame();

    function onMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    canvas.addEventListener("mousemove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", onMove);
    };
  }, [empty]);

  return (
    <div className="relative flex flex-col items-center">
      <canvas
        ref={canvasRef}
        style={{ width: 300, height: 300 }}
        className="gm-breathe"
      />
      {caption ? (
        <p className="mx-auto -mt-4 max-w-xs text-center text-sm text-white/70">{caption}</p>
      ) : empty ? (
        <p className="mx-auto -mt-4 max-w-xs text-center text-sm text-white/70">
          Sua bola de cristal está vazia por enquanto. Comece cadastrando leads,
          imóveis e negociações para vê-la ganhar vida.
        </p>
      ) : null}
    </div>
  );
}
