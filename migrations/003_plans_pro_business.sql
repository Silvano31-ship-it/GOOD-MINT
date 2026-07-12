-- ============================================================================
-- GOOD MINT — Migração 003: planos MINT Pro e MINT Business
-- Adiciona os planos pagos superiores (leads/imóveis ilimitados). O schema
-- já suportava múltiplos planos desde o início (migrations/001_schema.sql).
-- Multi-usuário (max_users > 1) fica para uma fase futura — por ora os 3
-- planos diferem apenas nos limites de leads/imóveis.
-- ============================================================================

INSERT INTO plans (code, name, price_cents, lead_limit, property_limit, max_users)
VALUES
  ('mint_pro', 'MINT Pro', 4990, NULL, NULL, 1),
  ('mint_business', 'MINT Business', 8000, NULL, NULL, 1)
ON CONFLICT (code) DO NOTHING;
