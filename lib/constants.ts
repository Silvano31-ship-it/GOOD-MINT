// lib/constants.ts — constantes e tipos compartilhados entre server e client.
// Isolado de lib/data.ts (que importa `pg`) para não vazar o driver do banco
// para o bundle do navegador quando componentes client precisam só das
// constantes (ex.: KanbanBoard, StageProgress).

export const LEAD_STAGES = [
  { key: "novo_lead", label: "Novo Lead" },
  { key: "contato_feito", label: "Contato Feito" },
  { key: "visita_agendada", label: "Visita Agendada" },
  { key: "proposta", label: "Proposta" },
  { key: "fechado", label: "Fechado" },
  { key: "perdido", label: "Perdido" },
] as const;

export const POST_SALE_STAGES = [
  { key: "documentacao_enviada", label: "Documentação Enviada" },
  { key: "analise_credito", label: "Análise de Crédito" },
  { key: "aprovacao", label: "Aprovação" },
  { key: "assinatura_contrato", label: "Assinatura de Contrato" },
  { key: "registro_cartorio", label: "Registro em Cartório" },
  { key: "entrega_chaves", label: "Entrega de Chaves" },
] as const;

export interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  origin: string | null;
  notes: string | null;
  funnel_stage: string;
  last_contact_at: string | null;
  created_at: string;
}

export interface Property {
  id: string;
  address: string;
  property_type: string;
  price_cents: string;
  area_m2: string | null;
  status: string;
  description: string | null;
  created_at: string;
}

export interface Negotiation {
  id: string;
  lead_name: string;
  property_address: string | null;
  negotiation_type: string;
  status: string;
  value_cents: string | null;
  closed_at: string | null;
  created_at: string;
}

export interface PostSale {
  id: string;
  lead_name: string;
  property_address: string | null;
  current_stage: string;
  stage_updated_at: string;
  next_action: string | null;
}

export interface Task {
  id: string;
  title: string;
  due_at: string | null;
  done: boolean;
  related_type: string;
  created_at: string;
}

export interface Notification {
  id: string;
  type: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

/** Duas primeiras iniciais do nome, em maiúsculas (avatar de fallback). */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

/** Grupos de emoji sugeridos no seletor do Dashboard. */
export const EMOJI_GROUPS: Record<string, string[]> = {
  Corretor: ["🧑‍💼", "🤝", "🏠", "🔑", "📈", "💼"],
  Motivação: ["🚀", "🔥", "💪", "🏆", "⭐", "🎯"],
  Leve: ["😄", "☕", "🌱", "🎉", "👋", "✨"],
};

/** Número oficial de suporte (WhatsApp), usado na tela de Suporte e no rodapé. */
export const SUPPORT_WHATSAPP = "5592984906392";
export const SUPPORT_PHONE_DISPLAY = "(92) 98490-6392";
