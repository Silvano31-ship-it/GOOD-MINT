-- migrations/025_metas.sql — Módulo Metas: metas de vendas por período (valor
-- em R$ ou número de vendas), com progresso calculado contra as negociações
-- fechadas no período (não guardamos "progresso" — é sempre derivado ao vivo
-- de negotiations, pra nunca ficar desatualizado). Aditiva/idempotente.

CREATE TABLE IF NOT EXISTS goals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_type     TEXT NOT NULL CHECK (goal_type IN ('valor', 'quantidade')),
  target_value  BIGINT NOT NULL CHECK (target_value > 0), -- centavos p/ 'valor'; nº de vendas p/ 'quantidade'
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (period_end >= period_start)
);
CREATE INDEX IF NOT EXISTS idx_goals_user_period ON goals(user_id, period_end DESC);
