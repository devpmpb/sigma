-- AlterTable
ALTER TABLE "public"."AreaEfetiva" ADD COLUMN     "atividadeProdutiva" "public"."AtividadeProdutiva",
ADD COLUMN     "ramoAtividadeId" INTEGER;

-- CreateTable
CREATE TABLE "public"."RamoAtividade" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" "public"."AtividadeProdutiva" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RamoAtividade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProgramaRamoAtividade" (
    "programaId" INTEGER NOT NULL,
    "ramoAtividadeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramaRamoAtividade_pkey" PRIMARY KEY ("programaId","ramoAtividadeId")
);

-- CreateIndex
CREATE UNIQUE INDEX "RamoAtividade_nome_key" ON "public"."RamoAtividade"("nome");

-- CreateIndex
CREATE INDEX "RamoAtividade_categoria_idx" ON "public"."RamoAtividade"("categoria");

-- CreateIndex
CREATE INDEX "RamoAtividade_ativo_idx" ON "public"."RamoAtividade"("ativo");

-- CreateIndex
CREATE INDEX "ProgramaRamoAtividade_programaId_idx" ON "public"."ProgramaRamoAtividade"("programaId");

-- CreateIndex
CREATE INDEX "ProgramaRamoAtividade_ramoAtividadeId_idx" ON "public"."ProgramaRamoAtividade"("ramoAtividadeId");

-- CreateIndex
CREATE INDEX "AreaEfetiva_ramoAtividadeId_idx" ON "public"."AreaEfetiva"("ramoAtividadeId");

-- AddForeignKey
ALTER TABLE "public"."AreaEfetiva" ADD CONSTRAINT "AreaEfetiva_ramoAtividadeId_fkey" FOREIGN KEY ("ramoAtividadeId") REFERENCES "public"."RamoAtividade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgramaRamoAtividade" ADD CONSTRAINT "ProgramaRamoAtividade_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "public"."Programa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgramaRamoAtividade" ADD CONSTRAINT "ProgramaRamoAtividade_ramoAtividadeId_fkey" FOREIGN KEY ("ramoAtividadeId") REFERENCES "public"."RamoAtividade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
