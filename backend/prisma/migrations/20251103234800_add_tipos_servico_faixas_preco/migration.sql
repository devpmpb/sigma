-- CreateTable
CREATE TABLE "tipos_servico" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faixas_preco_servico" (
    "id" SERIAL NOT NULL,
    "tipoServicoId" INTEGER NOT NULL,
    "quantidadeMin" INTEGER NOT NULL,
    "quantidadeMax" INTEGER,
    "multiplicadorVR" DECIMAL(4,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "vigenciaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigenciaFim" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faixas_preco_servico_pkey" PRIMARY KEY ("id")
);

-- AlterTable ordens_servico
-- Adicionar novos campos
ALTER TABLE "ordens_servico" ADD COLUMN "tipoServicoId" INTEGER;
ALTER TABLE "ordens_servico" ADD COLUMN "quantidadeSolicitada" DECIMAL(6,2);

-- Criar tipo de serviço padrão temporário para dados existentes
INSERT INTO "tipos_servico" ("nome", "unidade", "ativo", "updatedAt")
VALUES ('Serviço Padrão (Migração)', 'hora', true, CURRENT_TIMESTAMP);

-- Pegar o ID do tipo criado e atualizar ordens existentes
UPDATE "ordens_servico"
SET "tipoServicoId" = (SELECT "id" FROM "tipos_servico" WHERE "nome" = 'Serviço Padrão (Migração)' LIMIT 1),
    "quantidadeSolicitada" = COALESCE("horasEstimadas", 1)
WHERE "tipoServicoId" IS NULL;

-- Agora tornar os campos obrigatórios
ALTER TABLE "ordens_servico" ALTER COLUMN "tipoServicoId" SET NOT NULL;
ALTER TABLE "ordens_servico" ALTER COLUMN "quantidadeSolicitada" SET NOT NULL;

-- Remover campo antigo horasEstimadas
ALTER TABLE "ordens_servico" DROP COLUMN "horasEstimadas";

-- CreateIndex
CREATE UNIQUE INDEX "tipos_servico_nome_key" ON "tipos_servico"("nome");

-- CreateIndex
CREATE INDEX "faixas_preco_servico_tipoServicoId_idx" ON "faixas_preco_servico"("tipoServicoId");

-- CreateIndex
CREATE INDEX "ordens_servico_tipoServicoId_idx" ON "ordens_servico"("tipoServicoId");

-- AddForeignKey
ALTER TABLE "faixas_preco_servico" ADD CONSTRAINT "faixas_preco_servico_tipoServicoId_fkey" FOREIGN KEY ("tipoServicoId") REFERENCES "tipos_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_tipoServicoId_fkey" FOREIGN KEY ("tipoServicoId") REFERENCES "tipos_servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
