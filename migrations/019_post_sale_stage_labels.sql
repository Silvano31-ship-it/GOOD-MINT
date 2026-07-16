-- 019_post_sale_stage_labels.sql — permite o corretor renomear os nomes das
-- etapas do pós-venda (ex.: trocar "Envio de Documentos ao Cartório" por um
-- nome próprio). Guardado como JSON {chave_da_etapa: "nome novo"} — só as
-- etapas renomeadas aparecem aqui, o resto usa o nome padrão.

ALTER TABLE users ADD COLUMN post_sale_stage_labels JSONB NOT NULL DEFAULT '{}'::jsonb;
