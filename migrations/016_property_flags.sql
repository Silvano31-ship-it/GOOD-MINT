-- 016_property_flags.sql — exclusividade e alinhamento de preço do imóvel,
-- pra ajudar o corretor a priorizar onde vale mais a pena investir tempo.

ALTER TABLE properties ADD COLUMN is_exclusive BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE properties ADD COLUMN price_alignment TEXT;
