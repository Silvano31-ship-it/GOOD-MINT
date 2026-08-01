// components/leads/SilencioList.tsx — Rastreador de Silêncio: lista os leads
// por tempo sem contato, deixa escolher o perfil (paciente/incisivo), sugere
// uma mensagem de reativação no tom certo e permite enviar por WhatsApp e
// registrar o contato (zera o silêncio). Sem detecção de "abriu o link" — isso
// dependeria da API oficial da Meta (ver observação na tela).
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setContactProfile, markContacted } from "@/app/(dashboard)/leads/silencio/actions";

export interface SilentLead {
  id: string;
  name: string;
  phone: string | null;
  days_silent: number;
  contact_profile: string;
}

// Limiar de "silêncio demais" por perfil: incisivo cobra mais cedo.
const THRESHOLD: Record<string, number> = { paciente: 14, incisivo: 5 };

function suggestion(name: string, profile: string): string {
  const first = name.split(" ")[0];
  if (profile === "incisivo") {
    return `${first}, consegui uma condição boa e lembrei de você. Ainda está procurando? Consigo te mostrar hoje mesmo se quiser. 🚀`;
  }
  return `Oi ${first}, tudo bem? Passando pra saber se posso te ajudar em algo por aí — sem pressa, fico à disposição. 🙂`;
}

export function SilencioList({ leads }: { leads: SilentLead[] }) {
  if (leads.length === 0) {
    return (
      <div className="gm-card p-6 text-center text-sm text-gm-700/60">
        Nenhum lead ativo pra acompanhar agora. Assim que você tiver leads em andamento, eles aparecem aqui por tempo de silêncio.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {leads.map((l) => (
        <SilentRow key={l.id} lead={l} />
      ))}
    </div>
  );
}

function SilentRow({ lead }: { lead: SilentLead }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const threshold = THRESHOLD[lead.contact_profile] ?? 14;
  const alert = lead.days_silent >= threshold;
  const msg = suggestion(lead.name, lead.contact_profile);
  const waHref = lead.phone
    ? `https://wa.me/${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`;

  function changeProfile(profile: string) {
    startTransition(async () => {
      await setContactProfile(lead.id, profile);
      router.refresh();
    });
  }

  function contacted() {
    startTransition(async () => {
      await markContacted(lead.id);
      router.refresh();
    });
  }

  return (
    <div className={`gm-card p-4 ${alert ? "border-l-4 border-l-amber-400" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-gm-900">{lead.name}</div>
          <div className="text-xs text-gm-700/60">
            {lead.days_silent === 0
              ? "Contato hoje"
              : `${lead.days_silent} ${lead.days_silent === 1 ? "dia" : "dias"} de silêncio`}
            {alert && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Hora de reabordar</span>}
          </div>
        </div>
        <select
          value={lead.contact_profile}
          disabled={pending}
          onChange={(e) => changeProfile(e.target.value)}
          className="rounded-lg border border-gm-200 bg-white px-2 py-1 text-xs text-gm-900 disabled:opacity-50"
          aria-label="Perfil de contato"
        >
          <option value="paciente">😌 Paciente (cobra em 14 dias)</option>
          <option value="incisivo">⚡ Incisivo (cobra em 5 dias)</option>
        </select>
      </div>

      <p className="mt-3 rounded-lg bg-gm-50 p-3 text-sm text-gm-700">💬 {msg}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-9 items-center gap-1 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
        >
          💬 Enviar no WhatsApp
        </a>
        <button
          onClick={contacted}
          disabled={pending}
          className="rounded-lg border border-gm-200 px-3 py-1.5 text-xs font-semibold text-gm-700 hover:bg-gm-50 disabled:opacity-50"
        >
          ✓ Registrei contato
        </button>
      </div>
    </div>
  );
}
