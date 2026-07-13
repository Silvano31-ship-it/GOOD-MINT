-- migrations/006_pos_venda_stage_expansion.sql
-- Expande post_sale_stage de 6 para 13 valores (9 usados pelo novo fluxo +
-- 4 legados mantidos como somente-leitura, pois Postgres não permite remover
-- valor de enum). ALTER TYPE ... ADD VALUE não pode rodar na mesma transação
-- que lê/escreve o novo valor — por isso este arquivo só faz isso, sozinho.
-- Rodar este arquivo e aguardar o commit antes de aplicar o 007.

ALTER TYPE post_sale_stage ADD VALUE IF NOT EXISTS 'envio_documentos_cartorio' AFTER 'assinatura_contrato';
ALTER TYPE post_sale_stage ADD VALUE IF NOT EXISTS 'validacao_registro' AFTER 'envio_documentos_cartorio';
ALTER TYPE post_sale_stage ADD VALUE IF NOT EXISTS 'liberacao_financiamento' AFTER 'validacao_registro';
ALTER TYPE post_sale_stage ADD VALUE IF NOT EXISTS 'vistoria_imovel' AFTER 'liberacao_financiamento';
ALTER TYPE post_sale_stage ADD VALUE IF NOT EXISTS 'assinatura_escritura' AFTER 'vistoria_imovel';
-- 'entrega_chaves' já existe no enum, mantém a posição atual.
ALTER TYPE post_sale_stage ADD VALUE IF NOT EXISTS 'transferencia_contas' AFTER 'entrega_chaves';
ALTER TYPE post_sale_stage ADD VALUE IF NOT EXISTS 'pesquisa_satisfacao' AFTER 'transferencia_contas';

-- Os 4 valores legados abaixo continuam existindo no enum (não podem ser
-- removidos), mas passam a ser somente-leitura a partir daqui — nenhuma linha
-- nova volta a usá-los: 'documentacao_enviada', 'analise_credito', 'aprovacao',
-- 'registro_cartorio'. A migration 007 remapeia as linhas existentes.
