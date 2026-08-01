// app/(dashboard)/leads/silencio/page.tsx — Rastreador de Silêncio: radar dos
// leads por tempo sem contato, com perfil paciente/incisivo e mensagem de
// reativação sugerida. Consulta feita aqui direto (coluna contact_profile da
// migration 030). Exclui leads já fechados/perdidos.
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { SilencioList, type SilentLead } from "@/components/leads/SilencioList";

export default async function SilencioPage() {
  const user = await requireActiveAccount();

  const { rows } = await db.query<SilentLead>(
    `SELECT id, name, phone, contact_profile,
            GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (now() - COALESCE(last_contact_at, created_at)) ) / 86400))::int AS days_silent
     FROM leads
     WHERE user_id = $1 AND is_active AND funnel_stage NOT IN ('fechado', 'perdido')
     ORDER BY COALESCE(last_contact_at, created_at) ASC`,
    [user.id]
  );

  return (
    <div>
      <Link href="/leads" className="text-sm text-gm-500 hover:underline">← Leads</Link>
      <PageHeader
        title="Rastreador de Silêncio"
        subtitle="Quem está esfriando e precisa de um toque — no tom certo pra cada cliente."
      />

      <div className="mb-6 rounded-lg border border-gm-100 bg-gm-50 px-4 py-3 text-xs text-gm-700/70">
        ℹ️ O radar usa o tempo desde o último contato registrado. Detectar automaticamente
        que o cliente <b>abriu</b> um link no WhatsApp dependeria da API oficial da Meta
        (ainda em análise) — por isso, por enquanto, o registro de contato é manual.
      </div>

      <SilencioList leads={rows} />
    </div>
  );
}
