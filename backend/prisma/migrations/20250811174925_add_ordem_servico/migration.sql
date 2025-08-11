-- CreateTable
CREATE TABLE "public"."ordens_servico" (
    "id" SERIAL NOT NULL,
    "numeroOrdem" TEXT NOT NULL,
    "pessoaId" INTEGER NOT NULL,
    "veiculoId" INTEGER NOT NULL,
    "dataServico" TIMESTAMP(3) NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "valorReferencial" DECIMAL(10,2) NOT NULL DEFAULT 180.00,
    "valorCalculado" DECIMAL(10,2) NOT NULL,
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "usuarioId" INTEGER,
    "enderecoServico" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordens_servico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ordens_servico_numeroOrdem_key" ON "public"."ordens_servico"("numeroOrdem");

-- AddForeignKey
ALTER TABLE "public"."ordens_servico" ADD CONSTRAINT "ordens_servico_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "public"."Pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ordens_servico" ADD CONSTRAINT "ordens_servico_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "public"."Veiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
