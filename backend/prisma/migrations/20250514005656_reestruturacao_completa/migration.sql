-- CreateEnum
CREATE TYPE "TipoEndereco" AS ENUM ('RESIDENCIAL', 'COMERCIAL', 'RURAL', 'CORRESPONDENCIA');

-- CreateEnum
CREATE TYPE "TipoLogradouro" AS ENUM ('RUA', 'AVENIDA', 'TRAVESSA', 'ALAMEDA', 'RODOVIA', 'LINHA', 'ESTRADA');

-- CreateTable
CREATE TABLE "Bairro" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bairro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AreaRural" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AreaRural_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Logradouro" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoLogradouro" NOT NULL,
    "descricao" TEXT NOT NULL,
    "cep" TEXT,
    "bairroId" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Logradouro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrupoProduto" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrupoProduto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoVeiculo" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TipoVeiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pessoa" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "rg" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "telefone" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pessoa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Endereco" (
    "id" SERIAL NOT NULL,
    "pessoaId" INTEGER NOT NULL,
    "logradouroId" INTEGER,
    "numero" TEXT,
    "complemento" TEXT,
    "bairroId" INTEGER,
    "areaRuralId" INTEGER,
    "referenciaRural" TEXT,
    "coordenadas" TEXT,
    "tipoEndereco" "TipoEndereco" NOT NULL,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Endereco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produtor" (
    "id" INTEGER NOT NULL,
    "inscricaoEstadual" TEXT,
    "dap" TEXT,
    "tipoProdutor" TEXT,
    "atividadePrincipal" TEXT,
    "contratoAssistencia" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,

    CONSTRAINT "Produtor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AreaEfetiva" (
    "id" INTEGER NOT NULL,
    "anoReferencia" INTEGER NOT NULL,
    "areaPropria" DECIMAL(10,2) NOT NULL,
    "areaArrendadaRecebida" DECIMAL(10,2) NOT NULL,
    "areaArrendadaCedida" DECIMAL(10,2) NOT NULL,
    "areaEfetiva" DECIMAL(10,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AreaEfetiva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Propriedade" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "areaTotal" DECIMAL(10,2) NOT NULL,
    "localizacao" TEXT,
    "matricula" TEXT,
    "proprietarioId" INTEGER NOT NULL,

    CONSTRAINT "Propriedade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Arrendamento" (
    "id" SERIAL NOT NULL,
    "propriedadeId" INTEGER NOT NULL,
    "proprietarioId" INTEGER NOT NULL,
    "arrendatarioId" INTEGER NOT NULL,
    "areaArrendada" DECIMAL(10,2) NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "documentoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Arrendamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitacaoBeneficio" (
    "id" SERIAL NOT NULL,
    "produtorId" INTEGER NOT NULL,
    "programaId" INTEGER NOT NULL,
    "datasolicitacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolicitacaoBeneficio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Programa" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "leiNumero" TEXT,
    "tipoPrograma" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Programa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegrasNegocio" (
    "id" SERIAL NOT NULL,
    "programaId" INTEGER NOT NULL,
    "tipoRegra" TEXT NOT NULL,
    "parametro" JSONB NOT NULL,
    "valorBeneficio" DECIMAL(10,2) NOT NULL,
    "limiteBeneficio" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegrasNegocio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bairro_nome_key" ON "Bairro"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "AreaRural_nome_key" ON "AreaRural"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Logradouro_cep_key" ON "Logradouro"("cep");

-- CreateIndex
CREATE UNIQUE INDEX "GrupoProduto_descricao_key" ON "GrupoProduto"("descricao");

-- CreateIndex
CREATE UNIQUE INDEX "TipoVeiculo_descricao_key" ON "TipoVeiculo"("descricao");

-- CreateIndex
CREATE UNIQUE INDEX "Pessoa_cpfCnpj_key" ON "Pessoa"("cpfCnpj");

-- AddForeignKey
ALTER TABLE "Logradouro" ADD CONSTRAINT "Logradouro_bairroId_fkey" FOREIGN KEY ("bairroId") REFERENCES "Bairro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endereco" ADD CONSTRAINT "Endereco_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endereco" ADD CONSTRAINT "Endereco_logradouroId_fkey" FOREIGN KEY ("logradouroId") REFERENCES "Logradouro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endereco" ADD CONSTRAINT "Endereco_bairroId_fkey" FOREIGN KEY ("bairroId") REFERENCES "Bairro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endereco" ADD CONSTRAINT "Endereco_areaRuralId_fkey" FOREIGN KEY ("areaRuralId") REFERENCES "AreaRural"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produtor" ADD CONSTRAINT "Produtor_id_fkey" FOREIGN KEY ("id") REFERENCES "Pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AreaEfetiva" ADD CONSTRAINT "AreaEfetiva_id_fkey" FOREIGN KEY ("id") REFERENCES "Produtor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Propriedade" ADD CONSTRAINT "Propriedade_proprietarioId_fkey" FOREIGN KEY ("proprietarioId") REFERENCES "Pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Arrendamento" ADD CONSTRAINT "Arrendamento_propriedadeId_fkey" FOREIGN KEY ("propriedadeId") REFERENCES "Propriedade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Arrendamento" ADD CONSTRAINT "Arrendamento_proprietarioId_fkey" FOREIGN KEY ("proprietarioId") REFERENCES "Pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Arrendamento" ADD CONSTRAINT "Arrendamento_arrendatarioId_fkey" FOREIGN KEY ("arrendatarioId") REFERENCES "Pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitacaoBeneficio" ADD CONSTRAINT "SolicitacaoBeneficio_produtorId_fkey" FOREIGN KEY ("produtorId") REFERENCES "Produtor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitacaoBeneficio" ADD CONSTRAINT "SolicitacaoBeneficio_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "Programa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegrasNegocio" ADD CONSTRAINT "RegrasNegocio_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "Programa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
