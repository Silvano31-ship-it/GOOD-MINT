// app/(dashboard)/planilhas/livre/page.tsx — EXCEL GOOD ✅: lista de planilhas
// livres do corretor. Consulta feita aqui direto (tabela sheets da migration 032).
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { db } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { createSheet } from "@/app/(dashboard)/planilhas/livre/actions";

export default async function PlanilhasLivresPage() {
  const user = await requireActiveAccount();
  const { rows } = await db.query<{ id: string; name: string; updated_at: string }>(
    `SELECT id, name, updated_at FROM sheets WHERE user_id = $1 ORDER BY updated_at DESC`,
    [user.id]
  );

  return (
    <div>
      <PageHeader
        title="EXCEL GOOD ✅"
        subtitle="Planilhas livres com fórmulas — sua caixa de cálculo, do jeito que precisar."
        action={
          <form action={createSheet}>
            <button className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600">
              + Nova planilha
            </button>
          </form>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon="✅"
          title="Nenhuma planilha ainda"
          desc="Crie sua primeira planilha em branco e use fórmulas como =SOMA, =SE, =PROCV e muito mais."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((s) => (
            <Link
              key={s.id}
              href={`/planilhas/livre/${s.id}`}
              className="gm-card p-4 transition-transform hover:-translate-y-0.5"
            >
              <div className="text-2xl">📗</div>
              <div className="mt-2 font-semibold text-gm-900">{s.name}</div>
              <div className="text-xs text-gm-700/50">Editada em {formatDateTime(s.updated_at)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
