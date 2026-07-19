// components/social/DisparoWhatsApp.tsx — disparo semi-automático de WhatsApp
// pros leads: seleciona vários, escreve uma mensagem-modelo com {nome}, e o
// sistema monta a fila de envios — um toque por lead abre o WhatsApp com a
// mensagem personalizada pronta. Sem a API oficial do WhatsApp Business
// (aprovação Meta pendente, ver Central de Mensagens) o envio 100% automático
// não é possível; isso aqui é o máximo permitido via links wa.me.
"use client";

import { useMemo, useState } from "react";
import { LEAD_STAGES } from "@/lib/constants";
import { onlyDigits } from "@/lib/format";

export interface DisparoLead {
  id: string;
  name: string;
  phone: string;
  funnel_stage: string;
}

const DEFAULT_TEMPLATE =
  "Olá, {nome}! Tudo bem? Tenho novidades de imóveis que combinam com o que você procura. Posso te enviar as opções?";

const STAGE_LABELS: Record<string, string> = Object.fromEntries(
  LEAD_STAGES.map((s) => [s.key, s.label])
);

/** wa.me exige DDI — número brasileiro sem o 55 na frente ganha o prefixo. */
function waNumber(phone: string): string {
  const digits = onlyDigits(phone);
  return digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
}

export function DisparoWhatsApp({ leads }: { leads: DisparoLead[] }) {
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [stageFilter, setStageFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sent, setSent] = useState<Set<string>>(new Set());

  const visible = useMemo(
    () => (stageFilter ? leads.filter((l) => l.funnel_stage === stageFilter) : leads),
    [leads, stageFilter]
  );

  function toggleLead(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      visible.every((l) => prev.has(l.id)) ? new Set() : new Set(visible.map((l) => l.id))
    );
  }

  const queue = leads.filter((l) => selected.has(l.id));

  if (leads.length === 0) {
    return <p className="gm-card p-5 text-sm text-gm-700/60">Nenhum lead ativo com telefone cadastrado ainda — cadastre leads com telefone pra usar o disparo.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="gm-card p-5">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gm-700/60">
            Mensagem-modelo — use <b>{"{nome}"}</b> pra personalizar com o nome de cada lead
          </span>
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gm-200 px-3 py-2 text-sm"
          />
        </label>
        {queue[0] && (
          <p className="mt-2 rounded-lg bg-gm-50 p-2.5 text-xs text-gm-700/70">
            <b>Prévia ({queue[0].name}):</b> {template.replaceAll("{nome}", queue[0].name.split(" ")[0])}
          </p>
        )}
      </div>

      <div className="gm-card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-gm-900">
            Leads ({selected.size} de {visible.length} selecionados)
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="rounded-lg border border-gm-200 px-2 py-1.5 text-xs"
            >
              <option value="">Todas as etapas</option>
              {LEAD_STAGES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
            <button
              onClick={toggleAll}
              className="rounded-lg border border-gm-200 px-3 py-1.5 text-xs font-semibold text-gm-700 hover:bg-gm-50"
            >
              {visible.every((l) => selected.has(l.id)) && visible.length > 0 ? "Desmarcar todos" : "Marcar todos"}
            </button>
          </div>
        </div>

        <div className="max-h-72 space-y-1 overflow-y-auto">
          {visible.map((l) => (
            <label key={l.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg p-2 text-sm hover:bg-gm-50">
              <input
                type="checkbox"
                checked={selected.has(l.id)}
                onChange={() => toggleLead(l.id)}
                className="h-4 w-4 flex-none accent-gm-500"
              />
              <span className="min-w-0 flex-1 truncate font-medium text-gm-900">{l.name}</span>
              <span className="flex-none text-xs text-gm-700/50">{STAGE_LABELS[l.funnel_stage] ?? l.funnel_stage}</span>
              {sent.has(l.id) && <span className="flex-none text-xs font-semibold text-green-600">✓ enviado</span>}
            </label>
          ))}
          {visible.length === 0 && <p className="p-2 text-sm text-gm-700/50">Nenhum lead nesta etapa.</p>}
        </div>
      </div>

      {queue.length > 0 && (
        <div className="gm-card p-5">
          <h2 className="mb-1 font-semibold text-gm-900">Fila de envio ({sent.size}/{queue.length})</h2>
          <p className="mb-3 text-xs text-gm-700/50">
            Toque em cada botão: o WhatsApp abre com a mensagem personalizada pronta — é só confirmar o envio e voltar pra cá.
          </p>
          <div className="space-y-2">
            {queue.map((l) => {
              const msg = template.replaceAll("{nome}", l.name.split(" ")[0]);
              const href = `https://wa.me/${waNumber(l.phone)}?text=${encodeURIComponent(msg)}`;
              const done = sent.has(l.id);
              return (
                <div key={l.id} className="flex items-center justify-between gap-3 rounded-lg border border-gm-200 p-2.5">
                  <span className={`min-w-0 flex-1 truncate text-sm font-medium ${done ? "text-gm-700/40 line-through" : "text-gm-900"}`}>
                    {l.name}
                  </span>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setSent((prev) => new Set(prev).add(l.id))}
                    className={`flex-none rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      done
                        ? "border border-gm-200 text-gm-700/50"
                        : "bg-[#25D366] text-white hover:opacity-90"
                    }`}
                  >
                    {done ? "Enviar de novo" : "💬 Enviar"}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
