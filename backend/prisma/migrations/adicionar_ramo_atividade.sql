-- Migration: Adicionar RamoAtividade e ProgramaRamoAtividade
-- Data: 2025-01-10
-- Descrição: Substitui ENUM AtividadeProdutiva por tabela flexível

-- ============================================================================
-- PASSO 1: Criar tabela RamoAtividade
-- ============================================================================

CREATE TABLE "RamoAtividade" (
  "id" SERIAL PRIMARY KEY,
  "nome" VARCHAR(100) NOT NULL UNIQUE,
  "descricao" TEXT,
  "categoria" "AtividadeProdutiva",  -- Mantém referência ao ENUM para agrupamento
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PASSO 2: Criar tabela de relação Programa x RamoAtividade
-- ============================================================================

CREATE TABLE "ProgramaRamoAtividade" (
  "programaId" INTEGER NOT NULL,
  "ramoAtividadeId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT "ProgramaRamoAtividade_pkey" PRIMARY KEY ("programaId", "ramoAtividadeId"),
  CONSTRAINT "ProgramaRamoAtividade_programaId_fkey"
    FOREIGN KEY ("programaId") REFERENCES "Programa"("id") ON DELETE CASCADE,
  CONSTRAINT "ProgramaRamoAtividade_ramoAtividadeId_fkey"
    FOREIGN KEY ("ramoAtividadeId") REFERENCES "RamoAtividade"("id") ON DELETE CASCADE
);

-- ============================================================================
-- PASSO 3: Modificar AreaEfetiva para usar RamoAtividade
-- ============================================================================

-- NOTA: Comentado porque requer migração de dados
-- Se quiser usar RamoAtividade em vez de ENUM, descomente e ajuste:

/*
ALTER TABLE "AreaEfetiva"
  ADD COLUMN "ramoAtividadeId" INTEGER;

ALTER TABLE "AreaEfetiva"
  ADD CONSTRAINT "AreaEfetiva_ramoAtividadeId_fkey"
  FOREIGN KEY ("ramoAtividadeId") REFERENCES "RamoAtividade"("id");

-- Depois de popular RamoAtividade e migrar dados:
-- ALTER TABLE "AreaEfetiva" DROP COLUMN "atividadeProdutiva";
*/

-- ============================================================================
-- PASSO 4: Criar índices para performance
-- ============================================================================

CREATE INDEX "ProgramaRamoAtividade_programaId_idx"
  ON "ProgramaRamoAtividade"("programaId");

CREATE INDEX "ProgramaRamoAtividade_ramoAtividadeId_idx"
  ON "ProgramaRamoAtividade"("ramoAtividadeId");

CREATE INDEX "RamoAtividade_categoria_idx"
  ON "RamoAtividade"("categoria");

CREATE INDEX "RamoAtividade_ativo_idx"
  ON "RamoAtividade"("ativo");

-- ============================================================================
-- PASSO 5: Popular com dados básicos (mapeamento do ENUM)
-- ============================================================================

INSERT INTO "RamoAtividade" ("nome", "descricao", "categoria", "ativo") VALUES
  ('Agricultura Geral', 'Atividades agrícolas diversas', 'AGRICULTURA', true),
  ('Pecuária Geral', 'Atividades pecuárias diversas', 'PECUARIA', true),
  ('Agricultura e Pecuária', 'Atividades mistas', 'AGRICULTURA_PECUARIA', true),
  ('Silvicultura', 'Produção florestal', 'SILVICULTURA', true),
  ('Aquicultura', 'Criação de organismos aquáticos', 'AQUICULTURA', true),
  ('Hortifrúti', 'Produção de hortaliças e frutas', 'HORTIFRUTI', true),
  ('Avicultura', 'Criação de aves', 'AVICULTURA', true),
  ('Suinocultura', 'Criação de suínos', 'SUINOCULTURA', true),
  ('Outras Atividades', 'Outras atividades produtivas', 'OUTROS', true)
ON CONFLICT (nome) DO NOTHING;

-- ============================================================================
-- OBSERVAÇÕES
-- ============================================================================

/*
IMPORTANTE:

1. Esta migration cria as tabelas mas NÃO migra dados ainda
2. Os dados do GIM serão migrados via script SQL separado
3. A coluna "atividadeProdutiva" em AreaEfetiva ainda existe (compatibilidade)
4. Futuramente pode-se migrar AreaEfetiva para usar ramoAtividadeId

PRÓXIMOS PASSOS:

1. Rodar esta migration: npx prisma migrate dev
2. Executar script de migração de dados do GIM (09-migrar-ramos-atividade.sql)
3. Validar dados migrados
4. (Opcional) Migrar AreaEfetiva.atividadeProdutiva → ramoAtividadeId
*/
