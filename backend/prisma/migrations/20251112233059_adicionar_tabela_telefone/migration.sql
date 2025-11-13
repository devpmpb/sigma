-- CreateEnum
CREATE TYPE "public"."TipoTelefone" AS ENUM ('CELULAR', 'RESIDENCIAL', 'COMERCIAL', 'OUTRO');

-- CreateTable
CREATE TABLE "public"."Telefone" (
    "id" SERIAL NOT NULL,
    "pessoaId" INTEGER NOT NULL,
    "ddd" TEXT,
    "numero" TEXT NOT NULL,
    "ramal" TEXT,
    "tipo" "public"."TipoTelefone" NOT NULL DEFAULT 'CELULAR',
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Telefone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Telefone_pessoaId_idx" ON "public"."Telefone"("pessoaId");

-- CreateIndex
CREATE INDEX "Telefone_pessoaId_principal_idx" ON "public"."Telefone"("pessoaId", "principal");

-- AddForeignKey
ALTER TABLE "public"."Telefone" ADD CONSTRAINT "Telefone_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "public"."Pessoa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
