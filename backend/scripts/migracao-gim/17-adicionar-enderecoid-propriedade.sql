-- ============================================================================
-- SCRIPT: ADICIONAR enderecoId NA PROPRIEDADE E MIGRAR DADOS
-- ============================================================================
--
-- PROBLEMA: Campo logradouroId estava sendo usado, mas o CSV tem um campo
--           'endereco' que é na verdade um ID de endereço
--
-- SOLUÇÃO:
--   1. Adicionar coluna endereco_id na tabela Propriedade
--   2. Migrar dados do campo 'endereco' do CSV para endereco_id
--   3. Remover coluna logradouro_id
--
-- ============================================================================

-- PASSO 1: Adicionar coluna endereco_id
ALTER TABLE "Propriedade"
ADD COLUMN endereco_id INTEGER;

-- PASSO 2: Adicionar FK para Endereco
ALTER TABLE "Propriedade"
ADD CONSTRAINT "Propriedade_enderecoId_fkey"
FOREIGN KEY (endereco_id) REFERENCES "Endereco"(id);

-- PASSO 3: Migrar dados do CSV para endereco_id
UPDATE "Propriedade" prop
SET endereco_id = p_csv.endereco::INTEGER
FROM staging_gim.propriedade_csv p_csv
INNER JOIN staging_gim.map_propriedades map ON map.id_gim = p_csv.cod_propriedade
WHERE prop.id = map.id_sigma
  AND p_csv.endereco IS NOT NULL
  AND p_csv.endereco != '';

-- PASSO 4: Remover coluna logradouro_id (se existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Propriedade'
        AND column_name = 'logradouroId'
    ) THEN
        ALTER TABLE "Propriedade" DROP COLUMN "logradouroId";
        RAISE NOTICE 'Coluna logradouroId removida';
    END IF;
END $$;

-- RELATÓRIO
SELECT
    COUNT(*) as total_propriedades,
    COUNT(endereco_id) as com_endereco,
    COUNT(*) - COUNT(endereco_id) as sem_endereco
FROM "Propriedade";
