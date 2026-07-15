-- migrations/014_ai_content.sql — Módulo "Conteúdo com IA": geração de
-- legendas (Claude) e imagens (DALL-E 3), biblioteca de rascunhos, e cota
-- mensal por plano. Aditiva/idempotente.

ALTER TABLE plans ADD COLUMN IF NOT EXISTS ai_text_limit INTEGER;   -- NULL = ilimitado
ALTER TABLE plans ADD COLUMN IF NOT EXISTS ai_image_limit INTEGER;  -- NULL = ilimitado

UPDATE plans SET ai_text_limit = 0,    ai_image_limit = 0  WHERE code = 'mint_start';
UPDATE plans SET ai_text_limit = 50,   ai_image_limit = 15 WHERE code = 'mint_pro';
UPDATE plans SET ai_text_limit = NULL, ai_image_limit = 50 WHERE code = 'mint_business';

DO $$ BEGIN
  CREATE TYPE ai_usage_kind AS ENUM ('texto', 'imagem');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS ai_usage_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind        ai_usage_kind NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user_kind_month ON ai_usage_log(user_id, kind, created_at);

CREATE TABLE IF NOT EXISTS ai_content (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id       UUID REFERENCES properties(id) ON DELETE SET NULL,
  content_type      TEXT NOT NULL,
  title             TEXT,
  content           TEXT NOT NULL,
  tone              TEXT,
  image_url         TEXT,
  image_prompt      TEXT,
  image_style       TEXT,
  post_tip          TEXT,
  is_favorite       BOOLEAN NOT NULL DEFAULT false,
  rating            INTEGER CHECK (rating BETWEEN 1 AND 5),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_content_user ON ai_content(user_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_ai_content_updated_at ON ai_content;
CREATE TRIGGER trg_ai_content_updated_at BEFORE UPDATE ON ai_content
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
