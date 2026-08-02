-- migrations/032_sheets.sql — EXCEL GOOD ✅: planilhas livres do corretor.
-- Cada planilha guarda só o conteúdo CRU das células num JSONB ({ "A1": "10",
-- "B1": "=SOMA(A1:A3)" }); os valores calculados são derivados no cliente pelo
-- motor lib/excel/engine.ts. Aditiva/idempotente.

CREATE TABLE IF NOT EXISTS sheets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'Nova planilha',
  data        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sheets_user ON sheets(user_id, updated_at DESC);
