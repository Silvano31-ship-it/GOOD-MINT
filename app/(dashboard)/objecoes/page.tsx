// app/(dashboard)/objecoes/page.tsx — Arquivo de Objeções: biblioteca do
// corretor com as objeções mais comuns e a melhor resposta pra cada uma.
// Consulta feita aqui direto (tabela objections da migration 031). Ordena
// pelas que mais funcionaram.
import { requireActiveAccount } from "@/lib/account-guard";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { ObjectionsManager, type Objection } from "@/components/objecoes/ObjectionsManager";

export default async function ObjecoesPage() {
  const user = await requireActiveAccount();

  const { rows } = await db.query<Objection>(
    `SELECT id, objection, response, times_worked
     FROM objections
     WHERE user_id = $1
     ORDER BY times_worked DESC, created_at DESC`,
    [user.id]
  );

  return (
    <div>
      <PageHeader
        title="Arquivo de Objeções"
        subtitle="Sua biblioteca de contra-argumentos. No calor da visita, busque a objeção e tenha a melhor resposta na hora."
      />
      <ObjectionsManager objections={rows} />
    </div>
  );
}
