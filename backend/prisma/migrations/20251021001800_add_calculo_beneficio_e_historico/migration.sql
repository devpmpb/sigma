-- AlterTable
ALTER TABLE "public"."SolicitacaoBeneficio" ADD COLUMN     "calculoDetalhes" JSONB,
ADD COLUMN     "quantidadeSolicitada" DECIMAL(10,2),
ADD COLUMN     "regraAplicadaId" INTEGER,
ADD COLUMN     "valorCalculado" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "public"."historico_solicitacoes" (
    "id" SERIAL NOT NULL,
    "solicitacaoId" INTEGER NOT NULL,
    "statusAnterior" TEXT,
    "statusNovo" TEXT NOT NULL,
    "usuarioId" INTEGER,
    "motivo" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_solicitacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "historico_solicitacoes_solicitacaoId_idx" ON "public"."historico_solicitacoes"("solicitacaoId");

-- CreateIndex
CREATE INDEX "historico_solicitacoes_createdAt_idx" ON "public"."historico_solicitacoes"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."SolicitacaoBeneficio" ADD CONSTRAINT "SolicitacaoBeneficio_regraAplicadaId_fkey" FOREIGN KEY ("regraAplicadaId") REFERENCES "public"."RegrasNegocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."historico_solicitacoes" ADD CONSTRAINT "historico_solicitacoes_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "public"."SolicitacaoBeneficio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
