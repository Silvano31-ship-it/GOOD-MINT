-- migrations/031_objecoes.sql — Arquivo de Objeções: biblioteca do corretor com
-- as objeções mais comuns e a melhor resposta pra cada uma, mais um contador de
-- "funcionou" pra ranquear as contra-objeções mais eficazes. Aditiva/idempotente.

CREATE TABLE IF NOT EXISTS objections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  objection     TEXT NOT NULL,
  response      TEXT NOT NULL,
  times_worked  INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_objections_user ON objections(user_id, times_worked DESC);
