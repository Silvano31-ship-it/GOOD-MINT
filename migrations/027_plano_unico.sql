-- migrations/027_plano_unico.sql — Plano Único (R$ 49,90/mês, tudo ilimitado).
-- Reaproveita a linha do MINT Pro (que já custava 49,90 e já era ilimitado em
-- leads/imóveis): renomeia e zera também as cotas de IA (NULL = ilimitado,
-- ver lib/ai-quota.ts). Assinantes legados do MINT Start não são alterados.
-- O gate do teste grátis (só funções essenciais liberadas) é aplicado no app,
-- por account_status = 'trialing' — ver components/PlanGate.tsx.

UPDATE plans
SET name = 'Plano Único',
    price_cents = 4990,
    lead_limit = NULL,
    property_limit = NULL,
    ai_text_limit = NULL,
    ai_image_limit = NULL
WHERE code = 'mint_pro';
