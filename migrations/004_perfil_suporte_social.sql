-- ============================================================================
-- GOOD MINT — Migração 004: perfil do corretor, emoji do dashboard, onboarding
-- e suporte via WhatsApp. Todas as alterações são aditivas (ADD COLUMN IF NOT
-- EXISTS / CREATE TABLE IF NOT EXISTS) para poder rodar mais de uma vez sem erro.
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dashboard_emoji TEXT NOT NULL DEFAULT '🤝';
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_done BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS support_tickets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
