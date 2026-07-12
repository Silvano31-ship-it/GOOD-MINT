// components/FloatingEmojis.tsx — emojis decorativos flutuando pela tela.
// Puramente visual (pointer-events-none, z-index baixo), tema imobiliário.
// Usado na tela de Cadastro para dar vida à tela sem atrapalhar o formulário.
"use client";

const EMOJIS = ["🏠", "🔑", "📋", "✅", "🏡", "📈"];

interface Spot {
  emoji: string;
  top: string;
  left: string;
  size: string;
  duration: string;
  delay: string;
}

const SPOTS: Spot[] = [
  { emoji: EMOJIS[0], top: "8%", left: "10%", size: "2rem", duration: "7s", delay: "0s" },
  { emoji: EMOJIS[1], top: "18%", left: "82%", size: "1.5rem", duration: "9s", delay: "1s" },
  { emoji: EMOJIS[2], top: "68%", left: "6%", size: "1.75rem", duration: "8s", delay: "2s" },
  { emoji: EMOJIS[3], top: "80%", left: "78%", size: "1.5rem", duration: "10s", delay: "0.5s" },
  { emoji: EMOJIS[4], top: "45%", left: "92%", size: "1.75rem", duration: "8.5s", delay: "1.5s" },
  { emoji: EMOJIS[5], top: "55%", left: "3%", size: "1.5rem", duration: "9.5s", delay: "2.5s" },
];

export function FloatingEmojis() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {SPOTS.map((s, i) => (
        <span
          key={i}
          className="gm-emoji-float absolute select-none opacity-70"
          style={{
            top: s.top,
            left: s.left,
            fontSize: s.size,
            animationDuration: s.duration,
            animationDelay: s.delay,
          }}
        >
          {s.emoji}
        </span>
      ))}
    </div>
  );
}
