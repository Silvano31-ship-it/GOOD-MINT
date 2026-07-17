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

/** Modelos de mensagem por etapa do funil — texto pronto pra editar antes de
 * enviar pelo WhatsApp. Não é gerado por IA (deliberadamente simples, sem
 * chamada a LLM, pra não depender de mais uma chave/custo por mensagem). */
export const LEAD_MESSAGE_TEMPLATES: Record<string, string> = {
  novo_lead: "Olá, {nome}! Tudo bem? Aqui é o(a) {corretor}, recebi seu contato e fico à disposição pra te ajudar a encontrar o imóvel ideal. Quando podemos conversar?",
  contato_feito: "Oi, {nome}! Passando pra saber se ainda tem interesse em dar continuidade à nossa conversa sobre o imóvel. Posso te enviar mais opções?",
  visita_agendada: "Olá, {nome}! Confirmando nossa visita ao imóvel. Qualquer imprevisto, me avise por aqui. Até lá!",
  proposta: "Oi, {nome}! Como está a análise da proposta? Fico à disposição pra esclarecer qualquer dúvida e ajudar a fechar negócio.",
  fechado: "Parabéns pelo negócio fechado, {nome}! 🎉 A partir de agora vou te acompanhar de perto até a entrega das chaves.",
  perdido: "Oi, {nome}! Tudo bem? Se mudar de ideia ou surgir um novo momento, fico à disposição — sem compromisso.",
};

/** Meta semanal de novos leads pro card de gamificação leve do dashboard. */
export const WEEKLY_LEAD_GOAL = 5;

/** Preço mensal e anual (20% de desconto) por plano, em centavos — fonte única
 * usada pela landing, cadastro e formulários de assinatura/troca de plano.
 * O valor mensal aqui precisa ficar igual ao `price_cents` de `plans` no banco. */
export const PLAN_PRICING: Record<string, { monthlyCents: number; yearlyCents: number }> = {
  mint_start: { monthlyCents: 1990, yearlyCents: 19000 },
  mint_pro: { monthlyCents: 4990, yearlyCents: 47900 },
  mint_business: { monthlyCents: 8000, yearlyCents: 76800 },
};

export type BillingCycle = "monthly" | "yearly";

// Fluxo vigente (9 etapas). Os 4 valores legados do enum do banco
// ('documentacao_enviada', 'analise_credito', 'aprovacao', 'registro_cartorio')
// não aparecem mais aqui — processos antigos já foram remapeados pela
// migration 007. `conditional: true` marca a etapa de financiamento, que só
// é exibida/exigida quando o processo tem `is_financed = true`.
export const POST_SALE_STAGES = [
  { key: "assinatura_contrato", label: "Assinatura do Contrato" },
  { key: "envio_documentos_cartorio", label: "Envio de Documentos ao Cartório" },
  { key: "validacao_registro", label: "Validação do Registro" },
  { key: "liberacao_financiamento", label: "Liberação do Financiamento", conditional: true },
  { key: "vistoria_imovel", label: "Vistoria do Imóvel" },
  { key: "assinatura_escritura", label: "Assinatura da Escritura" },
  { key: "entrega_chaves", label: "Entrega das Chaves" },
  { key: "transferencia_contas", label: "Transferência de Contas (Luz/Água)" },
  { key: "pesquisa_satisfacao", label: "Pesquisa de Satisfação" },
] as const;

/** Ordem linear das chaves de etapa — usada pela guarda forward-only. */
export const NEW_STAGE_ORDER = POST_SALE_STAGES.map((s) => s.key);

export interface PostSaleStage {
  key: string;
  label: string;
  conditional?: boolean;
}

/** Aplica os nomes personalizados do corretor (ver migration 019) por cima dos
 * nomes padrão das etapas — etapa sem personalização mantém o nome padrão. */
export function resolveStages(overrides?: Record<string, string> | null): PostSaleStage[] {
  return POST_SALE_STAGES.map((s) => ({
    key: s.key,
    label: overrides?.[s.key]?.trim() || s.label,
    conditional: "conditional" in s ? s.conditional : undefined,
  }));
}

export const KANBAN_STATUSES = [
  { key: "a_fazer", label: "A Fazer" },
  { key: "em_andamento", label: "Em Andamento" },
  { key: "aguardando_cliente", label: "Aguardando Cliente" },
  { key: "aguardando_documentos", label: "Aguardando Documentos" },
  { key: "concluido", label: "Concluído" },
] as const;

export const CHECKLIST_DOCUMENT_TYPES = [
  { key: "rg_cpf", label: "RG/CPF" },
  { key: "comprovante_renda", label: "Comprovante de Renda" },
  { key: "comprovante_residencia", label: "Comprovante de Residência" },
  { key: "certidao_estado_civil", label: "Certidão de Estado Civil" },
  { key: "contrato_assinado", label: "Contrato Assinado" },
  { key: "comprovante_pagamento", label: "Comprovante de Pagamento" },
  { key: "outro", label: "Outro" },
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
  estimated_value_cents: string | null;
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
  is_exclusive: boolean;
  price_alignment: string | null;
}

/** Opções pro campo "Alinhamento de preço" do imóvel — ajuda a identificar
 * onde vale a pena insistir numa conversa de preço com o proprietário. */
export const PRICE_ALIGNMENT_OPTIONS = [
  { key: "alinhado", label: "Alinhado ao mercado" },
  { key: "acima_mercado", label: "Acima do mercado" },
] as const;

export interface Negotiation {
  id: string;
  lead_id: string;
  lead_name: string;
  lead_email: string | null;
  property_address: string | null;
  negotiation_type: string;
  status: string;
  value_cents: string | null;
  closed_at: string | null;
  created_at: string;
  commission_id: string | null;
}

export type CommissionStatus = "pago" | "a_receber" | "pendente";

export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  pago: "Pago",
  a_receber: "A receber",
  pendente: "Pendente",
};

export interface Commission {
  id: string;
  negotiation_id: string | null;
  client_name: string;
  property_address: string | null;
  sale_value_cents: string;
  commission_percent: string;
  commission_cents: string;
  status: CommissionStatus;
  sale_date: string | null;
  expected_payment_date: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface PostSale {
  id: string;
  lead_name: string;
  lead_phone: string | null;
  property_address: string | null;
  value_cents: string | null;
  current_stage: string;
  stage_updated_at: string;
  next_action: string | null;
  next_action_due_at: string | null;
  is_financed: boolean;
  kanban_status: string;
  referral_token: string;
}

export interface ChecklistItem {
  id: string;
  document_type: string;
  label: string;
  is_required: boolean;
  status: string;
  file_url: string | null;
  ai_verdict: string | null;
  ai_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Communication {
  id: string;
  kind: string; // 'nota_interna' | 'mensagem_cliente'
  channel: string | null; // 'email' | 'whatsapp' | null
  content: string;
  sent_at: string | null;
  created_at: string;
}

export interface Referral {
  id: string;
  referred_name: string | null;
  referred_phone: string | null;
  reward_description: string | null;
  status: string;
  created_at: string;
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
  related_id: string | null;
  read_at: string | null;
  created_at: string;
}

/** Pra onde levar o corretor ao tocar numa notificação — mesmo mapeamento
 * usado nos títulos/links do push (ver lib/push.ts e os pontos que chamam
 * sendPushToUser), só que centralizado aqui pro sino/lista reaproveitarem. */
export function notificationUrl(type: string, relatedId: string | null): string {
  switch (type) {
    case "novo_lead":
      return relatedId ? `/leads/${relatedId}` : "/leads";
    case "tarefa_pendente":
      return "/tarefas";
    case "pos_venda_parado":
    case "duvida_cliente":
      return relatedId ? `/pos-venda/${relatedId}` : "/pos-venda";
    case "trial_expirando":
      return "/configuracoes/plano";
    default:
      return "/configuracoes/notificacoes";
  }
}

export interface Note {
  id: string;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoteMedia {
  id: string;
  url: string;
  media_type: "image" | "video";
  created_at: string;
}

export interface ChatGroup {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender_name: string;
  is_owner: boolean;
  content: string;
  created_at: string;
}

export interface Meeting {
  id: string;
  title: string;
  room_code: string;
  created_at: string;
}

export interface AiContent {
  id: string;
  property_id: string | null;
  content_type: string;
  title: string | null;
  content: string;
  tone: string | null;
  image_url: string | null;
  image_prompt: string | null;
  image_style: string | null;
  post_tip: string | null;
  is_favorite: boolean;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

/** Tipos de conteúdo do assistente de IA — chave livre (TEXT no banco, sem
 * enum), pra dar pra adicionar um tipo novo sem migration. */
export const AI_CONTENT_TYPES = [
  { key: "imovel_disponivel", label: "Imóvel disponível" },
  { key: "imovel_vendido", label: "Imóvel vendido/alugado" },
  { key: "dica", label: "Dica para clientes" },
  { key: "institucional", label: "Institucional" },
  { key: "personalizado", label: "Assunto personalizado" },
] as const;

export const AI_CONTENT_TONES = [
  { key: "profissional", label: "Profissional" },
  { key: "amigavel", label: "Amigável" },
  { key: "direto", label: "Direto" },
] as const;

/** Estilos de imagem do assistente de IA — fica aqui (não em lib/ai-image.ts,
 * que importa @vercel/blob) pra poder ser usado direto num client component
 * sem puxar código server-only pro bundle do navegador. */
export const IMAGE_STYLES = [
  { key: "fotorrealista", label: "Fotorrealista", promptFragment: "fotografia imobiliária realista, luz natural, ângulo amplo, 8k" },
  { key: "luxuoso", label: "Luxuoso / Editorial", promptFragment: "estética editorial de revista de arquitetura, iluminação dramática, alto padrão" },
  { key: "ensolarado", label: "Ensolarado / Convidativo", promptFragment: "dia ensolarado, céu azul, cores quentes e convidativas" },
  { key: "minimalista", label: "Moderno Minimalista", promptFragment: "composição minimalista, paleta neutra, linhas limpas, arquitetura contemporânea" },
  { key: "golden_hour", label: "Pôr do Sol / Golden Hour", promptFragment: "golden hour, céu dourado, atmosfera aspiracional" },
] as const;

export type ImageStyleKey = (typeof IMAGE_STYLES)[number]["key"];

/** Dica de postagem fixa por tipo de conteúdo — sem chamada de IA nem
 * tabela nova, só uma referência rápida mostrada no passo 6 do assistente. */
export const AI_CONTENT_POSTING_TIPS: Record<string, string> = {
  imovel_disponivel: "Melhor horário: 18h-20h. Formato sugerido: carrossel com 3-5 fotos do imóvel. Público-alvo: quem já demonstrou interesse na região.",
  imovel_vendido: "Melhor horário: 12h-14h ou 19h-21h. Formato sugerido: foto única com a fachada ou as chaves. Reforça prova social e autoridade.",
  dica: "Melhor horário: qualquer horário comercial. Formato sugerido: post único ou carrossel educativo, sem foco em venda direta.",
  institucional: "Melhor horário: início da semana. Formato sugerido: foto sua ou da equipe, tom pessoal e próximo.",
  personalizado: "Ajuste o horário e formato de acordo com o assunto escolhido.",
};

/** Considerado "sem contato" a partir de quantos dias — usado no selo do
 * Kanban e na formatação condicional da planilha de Leads. */
export const STALL_DAYS = 5;

export function isStale(l: Lead): boolean {
  if (l.funnel_stage === "fechado" || l.funnel_stage === "perdido") return false;
  if (!l.last_contact_at) return true;
  return Date.now() - new Date(l.last_contact_at).getTime() > STALL_DAYS * 86400000;
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

/** Comissão estimada exibida nos totais das planilhas de Imóveis e Negociações. */
export const COMMISSION_RATE = 0.06;

/** Fundo padrão do Dashboard pra quem se cadastra a partir de agora — o
 * corretor pode trocar ou remover a qualquer momento em Configurações →
 * Personalizar Fundo (não afeta quem já tinha conta antes disso). */
export const DEFAULT_DASHBOARD_BACKGROUND = {
  url: "https://iz7yywkibd3e0mov.public.blob.vercel-storage.com/dashboard-bg/bb5b4446-7638-44ec-b739-e052bd6c0cb5-1784067165530.mp4",
  type: "video" as const,
};
