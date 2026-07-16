// components/negociacoes/DeleteNegotiation.tsx — remove uma negociação da lista.
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { bulkDeleteNegotiations } from "@/app/(dashboard)/actions";

export function DeleteNegotiation({ negotiationId }: { negotiationId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm("Remover esta negociação? Essa ação não pode ser desfeita.")) return;
    startTransition(async () => {
      await bulkDeleteNegotiations([negotiationId]);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
    >
      {pending ? "Removendo..." : "Remover"}
    </button>
  );
}
