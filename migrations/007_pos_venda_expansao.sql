-- migrations/007_pos_venda_expansao.sql
-- Roda depois que a migration 006 (novos valores do enum post_sale_stage) já
-- foi commitada. Faz o backfill das etapas legadas, adiciona as colunas novas
-- em post_sale_processes e cria as tabelas de checklist, comunicação,
-- lembretes e indicação. Padrão idempotente igual ao usado em 005_social.sql.

-- ----------------------------------------------------------------------------
-- Backfill: mapeia etapas legadas (6 valores antigos) para as equivalentes
-- mais próximas no novo fluxo de 9 etapas, e registra a migração na própria
-- timeline (post_sale_stage_history) para ficar auditável.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  rec RECORD;
  mapped post_sale_stage;
BEGIN
  FOR rec IN
    SELECT id, current_stage FROM post_sale_processes
    WHERE current_stage IN ('documentacao_enviada', 'analise_credito', 'aprovacao', 'registro_cartorio')
  LOOP
    mapped := CASE rec.current_stage
      WHEN 'documentacao_enviada' THEN 'assinatura_contrato'
      WHEN 'analise_credito' THEN 'liberacao_financiamento'
      WHEN 'aprovacao' THEN 'liberacao_financiamento'
      WHEN 'registro_cartorio' THEN 'validacao_registro'
    END;

    UPDATE post_sale_processes SET current_stage = mapped WHERE id = rec.id;

    INSERT INTO post_sale_stage_history (post_sale_id, from_stage, to_stage, note)
    VALUES (rec.id, rec.current_stage, mapped, 'Migração automática: mapeamento de etapa legada');
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- Novas colunas em post_sale_processes
-- ----------------------------------------------------------------------------
ALTER TABLE post_sale_processes ADD COLUMN IF NOT EXISTS is_financed BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE post_sale_processes ADD COLUMN IF NOT EXISTS kanban_status TEXT NOT NULL DEFAULT 'a_fazer';
DO $$ BEGIN
  ALTER TABLE post_sale_processes ADD CONSTRAINT post_sale_processes_kanban_status_check
    CHECK (kanban_status IN ('a_fazer','em_andamento','aguardando_cliente','aguardando_documentos','concluido'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE post_sale_processes ADD COLUMN IF NOT EXISTS referral_token UUID NOT NULL DEFAULT gen_random_uuid();
DO $$ BEGIN
  ALTER TABLE post_sale_processes ADD CONSTRAINT post_sale_processes_referral_token_key UNIQUE (referral_token);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
ALTER TABLE post_sale_processes ADD COLUMN IF NOT EXISTS next_action_due_at TIMESTAMPTZ;

-- Marca 'concluido' para processos já na última etapa do novo fluxo.
UPDATE post_sale_processes SET kanban_status = 'concluido'
WHERE current_stage = 'pesquisa_satisfacao' AND kanban_status <> 'concluido';

-- ----------------------------------------------------------------------------
-- Checklist de documentos
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE checklist_document_type AS ENUM (
    'rg_cpf', 'comprovante_renda', 'comprovante_residencia',
    'certidao_estado_civil', 'contrato_assinado', 'comprovante_pagamento', 'outro'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS post_sale_checklist_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_sale_id   UUID NOT NULL REFERENCES post_sale_processes(id) ON DELETE CASCADE,
  document_type  checklist_document_type NOT NULL DEFAULT 'outro',
  label          TEXT NOT NULL,
  is_required    BOOLEAN NOT NULL DEFAULT true,
  status         TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','enviado','validado','rejeitado')),
  file_url       TEXT,
  ai_verdict     TEXT, -- 'legivel' | 'ilegivel' | 'suspeito' | NULL (não avaliado)
  ai_notes       TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_post_sale_checklist_process ON post_sale_checklist_items(post_sale_id);
DO $$ BEGIN
  CREATE TRIGGER trg_post_sale_checklist_updated_at BEFORE UPDATE ON post_sale_checklist_items
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- Comunicação (nota interna vs mensagem ao cliente) — distinto do log
-- post_sale_notifications_sent, que continua existindo como registro simples.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS post_sale_communications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_sale_id   UUID NOT NULL REFERENCES post_sale_processes(id) ON DELETE CASCADE,
  kind           TEXT NOT NULL CHECK (kind IN ('nota_interna','mensagem_cliente')),
  channel        TEXT CHECK (channel IN ('email','whatsapp')),
  content        TEXT NOT NULL,
  sent_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_post_sale_communications_process ON post_sale_communications(post_sale_id, created_at);

-- ----------------------------------------------------------------------------
-- Lembretes automáticos (3 dias antes do prazo, etapa parada)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS post_sale_reminders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_sale_id   UUID NOT NULL REFERENCES post_sale_processes(id) ON DELETE CASCADE,
  kind           TEXT NOT NULL, -- 'prazo_3_dias' | 'etapa_parada'
  due_at         TIMESTAMPTZ NOT NULL,
  sent_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_post_sale_reminders_pending ON post_sale_reminders(due_at) WHERE sent_at IS NULL;

-- ----------------------------------------------------------------------------
-- Indicação de clientes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS referrals (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_sale_id       UUID NOT NULL REFERENCES post_sale_processes(id) ON DELETE CASCADE,
  referred_name      TEXT,
  referred_phone     TEXT,
  reward_description TEXT,
  status             TEXT NOT NULL DEFAULT 'enviado' CHECK (status IN ('enviado','contatado','virou_lead','recompensado')),
  created_lead_id    UUID REFERENCES leads(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_referrals_user ON referrals(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_post_sale ON referrals(post_sale_id);
