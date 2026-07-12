-- ============================================================================
-- GOOD MINT — Migração 002: recuperação de senha (tela 3 da especificação)
-- Executar após good_mint_schema.sql
-- ============================================================================

CREATE TABLE password_reset_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL,                -- hash SHA-256 do token; o token puro só vai no e-mail
  expires_at    TIMESTAMPTZ NOT NULL,         -- validade curta (1h)
  used_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);
