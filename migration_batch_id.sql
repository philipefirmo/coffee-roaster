-- Migration: Adicionar campo batch_id para agrupar movimentações múltiplas
-- Data: 2026-02-14
-- Descrição: Adiciona coluna batch_id UUID para identificar movimentações feitas em batch

-- Adicionar coluna batch_id à tabela movements
ALTER TABLE movements 
ADD COLUMN IF NOT EXISTS batch_id UUID;

-- Criar índice para performance em consultas por batch
CREATE INDEX IF NOT EXISTS idx_movements_batch_id 
ON movements(batch_id);

-- Comentário da coluna
COMMENT ON COLUMN movements.batch_id IS 'UUID para agrupar movimentações múltiplas feitas simultaneamente';
