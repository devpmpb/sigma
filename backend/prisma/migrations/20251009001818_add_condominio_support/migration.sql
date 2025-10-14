-- AlterTable
ALTER TABLE "public"."transferencias_propriedade" ADD COLUMN     "nu_proprietario_novo_id" INTEGER,
ADD COLUMN     "situacao_propriedade" "public"."SituacaoPropriedade" NOT NULL DEFAULT 'PROPRIA';

-- CreateTable
CREATE TABLE "public"."propriedades_condominos" (
    "id" SERIAL NOT NULL,
    "propriedade_id" INTEGER NOT NULL,
    "condomino_id" INTEGER NOT NULL,
    "percentual" DECIMAL(5,2),
    "data_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_fim" TIMESTAMP(3),
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "propriedades_condominos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "propriedades_condominos_propriedade_id_idx" ON "public"."propriedades_condominos"("propriedade_id");

-- CreateIndex
CREATE INDEX "propriedades_condominos_condomino_id_idx" ON "public"."propriedades_condominos"("condomino_id");

-- CreateIndex
CREATE UNIQUE INDEX "propriedades_condominos_propriedade_id_condomino_id_data_fi_key" ON "public"."propriedades_condominos"("propriedade_id", "condomino_id", "data_fim");

-- AddForeignKey
ALTER TABLE "public"."transferencias_propriedade" ADD CONSTRAINT "transferencias_propriedade_nu_proprietario_novo_id_fkey" FOREIGN KEY ("nu_proprietario_novo_id") REFERENCES "public"."Pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."propriedades_condominos" ADD CONSTRAINT "propriedades_condominos_propriedade_id_fkey" FOREIGN KEY ("propriedade_id") REFERENCES "public"."Propriedade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."propriedades_condominos" ADD CONSTRAINT "propriedades_condominos_condomino_id_fkey" FOREIGN KEY ("condomino_id") REFERENCES "public"."Pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
