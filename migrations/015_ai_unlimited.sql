-- migrations/015_ai_unlimited.sql — permite marcar contas específicas (ex.:
-- o dono do SaaS) como isentas do limite mensal de IA, sem mexer nos limites
-- compartilhados dos planos (que continuam valendo pros demais clientes).

ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_unlimited BOOLEAN NOT NULL DEFAULT false;
