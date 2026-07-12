// components/SubmitButton.tsx — botão de formulário com estado de carregamento
// automático (useFormStatus só funciona num componente filho do <form>, por
// isso não dá pra fazer isso inline na própria página). Troque qualquer
// <button>Salvar</button> dentro de um <form action={...}> por
// <SubmitButton>Salvar</SubmitButton> pra ganhar feedback visual instantâneo.
"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText = "Salvando...",
  className = "min-h-11 rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gm-600 disabled:opacity-60",
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingText : children}
    </button>
  );
}
