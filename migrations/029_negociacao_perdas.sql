-- migrations/029_negociacao_perdas.sql — Retrospectiva de Perdas: quando uma
-- negociação é marcada como "perdida", o corretor responde uma autópsia rápida
-- (motivo + etapa em que perdeu o controle + observação). Alimenta os padrões
-- ("60% dos perdidos foi por preço", etc.). Aditiva/idempotente.

CREATE TABLE IF NOT EXISTS negotiation_losses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  negotiation_id  UUID NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
  reason          TEXT NOT NULL,
  stage_lost      TEXT,
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_negotiation_losses_user ON negotiation_losses(user_id, created_at DESC);
