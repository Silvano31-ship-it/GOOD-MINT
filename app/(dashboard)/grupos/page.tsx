// app/(dashboard)/grupos/page.tsx — lista de grupos de chat do corretor.
// Diferente de /mensagens (Central de Mensagens, inbox de canais conectados
// tipo WhatsApp/Instagram) — aqui é um chat interno, convidados entram por
// link/código, sem precisar de conta.
import { requireActiveAccount } from "@/lib/account-guard";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { PageHeader, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { createChatGroup } from "@/app/(dashboard)/grupos/actions";
import Link from "next/link";

export default async function GruposPage() {
  const user = await requireActiveAccount();
  const { rows: groups } = await db.query<{ id: string; name: string; invite_code: string; created_at: string }>(
    `SELECT id, name, invite_code, created_at FROM chat_groups WHERE user_id=$1 ORDER BY created_at DESC`,
    [user.id]
  );

  return (
    <div>
      <PageHeader title="Grupos" subtitle="Chat em grupo — convide pessoas por link ou código, sem precisar de conta." />

      <form action={createChatGroup} className="gm-card mb-6 flex flex-wrap items-end gap-3 p-4">
        <label className="flex-1 min-w-[200px]">
          <span className="mb-1 block text-sm font-medium text-gm-900">Nome do grupo</span>
          <input
            name="name"
            required
            placeholder="Ex: Compradores Apto 302"
            className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
          />
        </label>
        <SubmitButton>+ Criar grupo</SubmitButton>
      </form>

      {groups.length === 0 ? (
        <EmptyState icon="👥" title="Nenhum grupo ainda" desc="Crie um grupo e convide clientes ou parceiros por link ou código." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Link key={g.id} href={`/grupos/${g.id}`} className="gm-card p-4 transition hover:-translate-y-0.5">
              <div className="font-semibold text-gm-900">{g.name}</div>
              <div className="mt-1 text-xs text-gm-700/50">Código: {g.invite_code}</div>
              <div className="mt-2 text-xs text-gm-700/40">Criado em {formatDateTime(g.created_at)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
