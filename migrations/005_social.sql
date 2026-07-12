-- ============================================================================
-- GOOD MINT — Migração 005: Módulo Social (conexão Meta, engajamento, agendamento)
-- Aditiva (ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS), segura para
-- rodar mais de uma vez. Depende de um App aprovado no Meta for Developers para
-- funcionar de ponta a ponta — o código funciona sem isso, mas a conexão real
-- só é possível após a aprovação (ver .env.example: META_APP_ID/META_APP_SECRET).
-- ============================================================================

ALTER TABLE channel_integrations ADD COLUMN IF NOT EXISTS auto_reply_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE channel_integrations ADD COLUMN IF NOT EXISTS external_account_name TEXT;
ALTER TABLE channel_integrations ADD COLUMN IF NOT EXISTS external_account_photo_url TEXT;

DO $$ BEGIN
  CREATE TYPE social_activity_kind AS ENUM ('mensagem','comentario','curtida','mencao');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS social_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel channel_type NOT NULL,
  kind social_activity_kind NOT NULL,
  author_name TEXT,
  author_external_id TEXT,
  content TEXT,
  post_external_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_social_activity_user ON social_activity(user_id, created_at DESC);

DO $$ BEGIN
  CREATE TYPE scheduled_post_status AS ENUM ('agendado','publicando','publicado','falhou','cancelado');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  channels TEXT[] NOT NULL,
  status scheduled_post_status NOT NULL DEFAULT 'agendado',
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_due ON scheduled_posts(status, scheduled_for);
