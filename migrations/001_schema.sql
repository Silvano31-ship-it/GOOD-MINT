-- ============================================================================
-- GOOD MINT — Schema de Banco de Dados (PostgreSQL 14+)
-- Escopo: MINT Start (1 usuário por conta / corretor autônomo)
-- Ordem de leitura sugerida: extensões → enums → função utilitária →
-- usuários/plano → leads → imóveis → negociações → pós-venda →
-- mensageria/bot → tarefas → notificações
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- Função utilitária: atualiza updated_at automaticamente em qualquer tabela
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

CREATE TYPE account_status AS ENUM ('trialing', 'active', 'past_due', 'suspended', 'canceled');
CREATE TYPE lead_stage AS ENUM ('novo_lead', 'contato_feito', 'visita_agendada', 'proposta', 'fechado', 'perdido');
CREATE TYPE property_type AS ENUM ('apartamento', 'casa', 'terreno', 'comercial', 'rural', 'outro');
CREATE TYPE property_status AS ENUM ('disponivel', 'reservado', 'vendido', 'alugado', 'inativo');
CREATE TYPE negotiation_type AS ENUM ('venda', 'aluguel');
CREATE TYPE negotiation_status AS ENUM ('aberta', 'fechada', 'perdida');
CREATE TYPE post_sale_stage AS ENUM (
  'documentacao_enviada',
  'analise_credito',
  'aprovacao',
  'assinatura_contrato',
  'registro_cartorio',
  'entrega_chaves'
);
CREATE TYPE channel_type AS ENUM ('whatsapp', 'instagram', 'facebook', 'tiktok');
CREATE TYPE channel_status AS ENUM ('conectado', 'desconectado', 'token_expirado', 'erro');
CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE message_sender AS ENUM ('cliente', 'bot', 'corretor');
CREATE TYPE task_related_type AS ENUM ('lead', 'negotiation', 'post_sale', 'geral');

-- ============================================================================
-- 2. PLANOS, USUÁRIOS (CORRETORES) E ASSINATURA
-- ============================================================================

-- Catálogo de planos. Hoje só existe "MINT Start", mas a tabela já comporta
-- Pro/Business do backlog de crescimento (seção 12/13 da especificação).
CREATE TABLE plans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code              TEXT NOT NULL UNIQUE,          -- 'mint_start', 'mint_pro', 'mint_business'
  name              TEXT NOT NULL,
  price_cents       INTEGER NOT NULL,               -- valor em centavos, evita float
  lead_limit        INTEGER,                         -- NULL = ilimitado
  property_limit    INTEGER,                         -- NULL = ilimitado
  max_users         INTEGER NOT NULL DEFAULT 1,
  active            BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Corretor autônomo (dono da conta). Nesta fase, 1 usuário = 1 conta.
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         TEXT NOT NULL,
  email             TEXT NOT NULL UNIQUE,
  phone             TEXT NOT NULL,
  password_hash     TEXT NOT NULL,
  creci             TEXT,                            -- opcional nesta fase
  avatar_url        TEXT,
  account_status    account_status NOT NULL DEFAULT 'trialing',
  lgpd_consent_at   TIMESTAMPTZ,                      -- consentimento no cadastro (LGPD)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Assinatura do corretor. Trial de 3 dias controlado por trial_ends_at.
CREATE TABLE subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id               UUID NOT NULL REFERENCES plans(id),
  status                account_status NOT NULL DEFAULT 'trialing',
  trial_ends_at         TIMESTAMPTZ NOT NULL,
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  gateway_customer_id   TEXT,                        -- id do cliente no gateway de pagamento
  gateway_subscription_id TEXT,
  card_last4            TEXT,                        -- só os últimos 4 dígitos (tokenizado no gateway)
  card_brand            TEXT,
  canceled_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Histórico de faturas (Configurações > Plano e Cobrança)
CREATE TABLE invoices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id   UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount_cents      INTEGER NOT NULL,
  status            TEXT NOT NULL,                    -- 'paga', 'falhou', 'pendente'
  gateway_invoice_id TEXT,
  paid_at           TIMESTAMPTZ,
  due_at            TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_invoices_subscription ON invoices(subscription_id);

-- ============================================================================
-- 3. LEADS (PRÉ-VENDA)
-- ============================================================================

CREATE TABLE leads (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  phone             TEXT,
  email             TEXT,
  origin            TEXT,                             -- ex: 'Instagram', 'Indicação', 'Site'
  notes             TEXT,
  funnel_stage      lead_stage NOT NULL DEFAULT 'novo_lead',
  is_active         BOOLEAN NOT NULL DEFAULT true,     -- usado para contar contra o limite de 30 leads ativos
  last_contact_at   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_leads_user ON leads(user_id);
CREATE INDEX idx_leads_user_stage ON leads(user_id, funnel_stage);
CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Histórico de interações por lead (ligações, visitas, mensagens manuais etc.)
CREATE TABLE lead_interactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id           UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  interaction_type  TEXT NOT NULL,                     -- 'ligacao', 'whatsapp', 'visita', 'nota'
  content           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_lead_interactions_lead ON lead_interactions(lead_id);

-- Mudanças de etapa do funil (dá suporte a relatórios futuros de tempo por etapa)
CREATE TABLE lead_stage_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id           UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  from_stage        lead_stage,
  to_stage          lead_stage NOT NULL,
  changed_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_lead_stage_history_lead ON lead_stage_history(lead_id);

-- ============================================================================
-- 4. IMÓVEIS
-- ============================================================================

CREATE TABLE properties (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address           TEXT NOT NULL,
  property_type     property_type NOT NULL DEFAULT 'outro',
  price_cents       BIGINT NOT NULL,
  area_m2           NUMERIC(10,2),
  status            property_status NOT NULL DEFAULT 'disponivel',
  description       TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true,     -- usado para contar contra o limite de 15 imóveis
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_properties_user ON properties(user_id);
CREATE TRIGGER trg_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE property_photos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id       UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url               TEXT NOT NULL,
  display_order     INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_property_photos_property ON property_photos(property_id);

-- ============================================================================
-- 5. NEGOCIAÇÕES
-- Uma negociação liga um lead a um imóvel (opcionalmente) e é o que percorre
-- o funil visualmente. Ao chegar em "fechada", pode gerar um processo de
-- pós-venda (seção 7 da especificação).
-- ============================================================================

CREATE TABLE negotiations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_id           UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  property_id       UUID REFERENCES properties(id) ON DELETE SET NULL,
  negotiation_type  negotiation_type NOT NULL DEFAULT 'venda',
  status            negotiation_status NOT NULL DEFAULT 'aberta',
  value_cents       BIGINT,
  closed_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_negotiations_user ON negotiations(user_id);
CREATE INDEX idx_negotiations_lead ON negotiations(lead_id);
CREATE INDEX idx_negotiations_property ON negotiations(property_id);
CREATE TRIGGER trg_negotiations_updated_at BEFORE UPDATE ON negotiations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 6. PÓS-VENDA — coração da diferenciação (seção 7 da especificação)
-- ============================================================================

CREATE TABLE post_sale_processes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  negotiation_id        UUID NOT NULL UNIQUE REFERENCES negotiations(id) ON DELETE CASCADE,
  current_stage         post_sale_stage NOT NULL DEFAULT 'documentacao_enviada',
  stage_updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_action           TEXT,
  stalled_alert_sent_at  TIMESTAMPTZ,  -- controla o alerta de "cliente parado há muito tempo"
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_post_sale_user ON post_sale_processes(user_id);
CREATE TRIGGER trg_post_sale_updated_at BEFORE UPDATE ON post_sale_processes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Histórico de etapas do pós-venda (base da "barra de progresso")
CREATE TABLE post_sale_stage_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_sale_id      UUID NOT NULL REFERENCES post_sale_processes(id) ON DELETE CASCADE,
  from_stage        post_sale_stage,
  to_stage          post_sale_stage NOT NULL,
  changed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  note              TEXT
);
CREATE INDEX idx_post_sale_stage_history_process ON post_sale_stage_history(post_sale_id);

-- Registro de cada mensagem automática enviada ao cliente ao mudar de etapa
CREATE TABLE post_sale_notifications_sent (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_sale_id      UUID NOT NULL REFERENCES post_sale_processes(id) ON DELETE CASCADE,
  stage             post_sale_stage NOT NULL,
  channel           channel_type NOT NULL DEFAULT 'whatsapp',
  message_id        UUID,  -- FK lógica para messages(id), ver seção 7 (sem FK física para não acoplar)
  sent_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_post_sale_notifications_process ON post_sale_notifications_sent(post_sale_id);

-- ============================================================================
-- 7. CENTRAL DE MENSAGENS — WhatsApp, Instagram, Facebook, TikTok + bot de IA
-- ============================================================================

-- Uma integração por canal por corretor
CREATE TABLE channel_integrations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel               channel_type NOT NULL,
  status                channel_status NOT NULL DEFAULT 'desconectado',
  external_account_id   TEXT,                          -- id da conta oficial no canal
  access_token_encrypted TEXT,                         -- NUNCA texto puro; criptografado na aplicação
  token_expires_at      TIMESTAMPTZ,
  connected_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, channel)
);
CREATE TRIGGER trg_channel_integrations_updated_at BEFORE UPDATE ON channel_integrations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Configuração do bot de IA (tom de voz, horários, templates por etapa)
CREATE TABLE bot_configs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  tone              TEXT NOT NULL DEFAULT 'profissional', -- 'profissional', 'amigavel', 'direto'
  active_hours      JSONB,                              -- ex: {"seg-sex": "08:00-20:00"}
  allowed_info      TEXT,                                -- o que o bot pode/não pode afirmar em nome do corretor
  stage_templates   JSONB,                               -- templates por etapa do pós-venda / funil
  is_active         BOOLEAN NOT NULL DEFAULT true,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_bot_configs_updated_at BEFORE UPDATE ON bot_configs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Caixa de entrada única: uma conversa por contato por canal
CREATE TABLE conversations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel           channel_type NOT NULL,
  contact_external_id TEXT NOT NULL,                    -- id/telefone do contato no canal de origem
  contact_name      TEXT,
  lead_id           UUID REFERENCES leads(id) ON DELETE SET NULL,
  post_sale_id      UUID REFERENCES post_sale_processes(id) ON DELETE SET NULL,
  bot_paused        BOOLEAN NOT NULL DEFAULT false,      -- corretor assumiu a conversa manualmente
  last_message_at   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, channel, contact_external_id)
);
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_lead ON conversations(lead_id);
CREATE INDEX idx_conversations_post_sale ON conversations(post_sale_id);

CREATE TABLE messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  direction         message_direction NOT NULL,
  sender            message_sender NOT NULL,
  content           TEXT NOT NULL,
  external_message_id TEXT,                             -- id da mensagem na API do canal
  sent_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, sent_at);

-- ============================================================================
-- 8. TAREFAS E NOTIFICAÇÕES
-- ============================================================================

CREATE TABLE tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  related_type      task_related_type NOT NULL DEFAULT 'geral',
  related_id        UUID,                                -- aponta para lead_id, negotiation_id ou post_sale_id conforme related_type
  title             TEXT NOT NULL,
  due_at            TIMESTAMPTZ,
  done              BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tasks_user ON tasks(user_id, done);

CREATE TABLE notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type              TEXT NOT NULL,                        -- 'novo_lead', 'tarefa_pendente', 'pos_venda_parado', 'trial_expirando'
  content           TEXT NOT NULL,
  read_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, read_at);

-- ============================================================================
-- 9. SEED MÍNIMO — plano MINT Start
-- ============================================================================

INSERT INTO plans (code, name, price_cents, lead_limit, property_limit, max_users)
VALUES ('mint_start', 'MINT Start', 1990, 30, 15, 1);
