// app/(dashboard)/configuracoes/bot/page.tsx — Tela 16. Configuração do Bot de IA.
import Link from "next/link";
import { requireActiveAccount } from "@/lib/account-guard";
import { db } from "@/lib/db";
import { saveBotConfig } from "@/app/(dashboard)/actions";
import { PageHeader } from "@/components/ui";

export default async function BotConfigPage() {
  const user = await requireActiveAccount();
  const { rows } = await db.query(
    `SELECT tone, allowed_info, is_active FROM bot_configs WHERE user_id=$1`,
    [user.id]
  );
  const config = rows[0] as { tone: string; allowed_info: string | null; is_active: boolean } | undefined;

  return (
    <div>
      <Link href="/configuracoes" className="text-sm text-gm-500 hover:underline">← Configurações</Link>
      <PageHeader title="Bot de IA" subtitle="Responde à primeira mensagem do lead e às atualizações de pós-venda." />

      <form action={saveBotConfig} className="gm-card max-w-xl space-y-4 p-6">
        <label className="flex items-center justify-between rounded-lg bg-gm-50 px-4 py-3">
          <span className="text-sm font-medium text-gm-900">Bot ativo</span>
          <input type="checkbox" name="is_active" defaultChecked={config?.is_active ?? true} className="h-5 w-5" />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gm-900">Tom de voz</span>
          <select name="tone" defaultValue={config?.tone ?? "profissional"} className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm">
            <option value="profissional">Profissional</option>
            <option value="amigavel">Amigável</option>
            <option value="direto">Direto</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gm-900">
            O que o bot pode/não pode afirmar em nome do corretor
          </span>
          <textarea
            name="allowed_info"
            rows={5}
            defaultValue={config?.allowed_info ?? ""}
            placeholder="Ex.: pode informar horários de visita e status do processo. Não pode confirmar valores de negociação ou prazos de entrega sem validação do corretor."
            className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
          />
        </label>

        <p className="text-xs text-gm-700/50">
          ⚠ O corretor pode assumir qualquer conversa manualmente a qualquer
          momento, pausando a resposta automática (Central de Mensagens).
        </p>

        <button className="rounded-lg bg-gm-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gm-600">
          Salvar configuração
        </button>
      </form>
    </div>
  );
}
