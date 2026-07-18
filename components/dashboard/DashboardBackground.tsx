// components/dashboard/DashboardBackground.tsx — fundo fixo e personalizado do
// Dashboard (foto ou vídeo), atrás do conteúdo, que continua rolando por cima.
// Sem url, não renderiza nada (fundo padrão do dashboard, sem mudança nenhuma).
"use client";

import { useEffect, useRef, useState } from "react";

export function DashboardBackground({
  url,
  type,
}: {
  url: string | null;
  type: "image" | "video" | null;
}) {
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // O React só aplica a prop `muted` como propriedade via JS depois que o
    // elemento já existe no DOM, não como atributo HTML na primeira renderização.
    // O Safari decide se autoplay é permitido nesse primeiro instante — sem o
    // atributo, ele bloqueia o autoplay e o vídeo fica parado no primeiro
    // quadro com o ícone de play. Forçar `muted` e chamar `.play()` aqui
    // corrige isso.
    const v = videoRef.current;
    if (!v || type !== "video") return;
    v.muted = true;
    v.play().catch(() => {});
  }, [url, type]);

  if (!url || failed) return null;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
      {type === "video" ? (
        <video
          ref={videoRef}
          key={url}
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover object-right-bottom"
          onError={() => setFailed(true)}
        >
          <source src={url} />
        </video>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover object-right-bottom" onError={() => setFailed(true)} />
      )}
    </div>
  );
}
