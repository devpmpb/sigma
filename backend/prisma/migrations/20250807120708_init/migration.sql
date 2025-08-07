-- CreateEnum
CREATE TYPE "public"."TipoEndereco" AS ENUM ('RESIDENCIAL', 'COMERCIAL', 'RURAL', 'CORRESPONDENCIA');

-- CreateEnum
CREATE TYPE "public"."TipoLogradouro" AS ENUM ('RUA', 'AVENIDA', 'TRAVESSA', 'ALAMEDA', 'RODOVIA', 'LINHA', 'ESTRADA');

-- CreateEnum
CREATE TYPE "public"."TipoPropriedade" AS ENUM ('RURAL', 'LOTE_URBANO', 'COMERCIAL', 'INDUSTRIAL');

-- CreateEnum
CREATE TYPE "public"."TipoPessoa" AS ENUM ('FISICA', 'JURIDICA');

-- CreateEnum
CREATE TYPE "public"."SituacaoPropriedade" AS ENUM ('PROPRIA', 'CONDOMINIO', 'USUFRUTO');

-- CreateEnum
CREATE TYPE "public"."TipoPerfil" AS ENUM ('ADMIN', 'OBRAS', 'AGRICULTURA');

-- CreateEnum
CREATE TYPE "public"."ModuloSistema" AS ENUM ('OBRAS', 'AGRICULTURA', 'COMUM', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."AcaoPermissao" AS ENUM ('VIEW', 'CREATE', 'EDIT', 'DELETE');

-- CreateEnum
CREATE TYPE "public"."TipoPrograma" AS ENUM ('SUBSIDIO', 'MATERIAL', 'SERVICO', 'CREDITO', 'ASSISTENCIA');

-- CreateTable
CREATE TABLE "public"."Bairro" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bairro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AreaRural" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AreaRural_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Logradouro" (
    "id" SERIAL NOT NULL,
    "tipo" "public"."TipoLogradouro" NOT NULL,
    "descricao" TEXT NOT NULL,
    "cep" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Logradouro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GrupoProduto" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrupoProduto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TipoVeiculo" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TipoVeiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Veiculo" (
    "id" SERIAL NOT NULL,
    "tipoVeiculoId" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Veiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Pessoa" (
    "id" SERIAL NOT NULL,
    "tipoPessoa" "public"."TipoPessoa" NOT NULL,
    "nome" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pessoa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PessoaFisica" (
    "id" INTEGER NOT NULL,
    "rg" TEXT,
    "dataNascimento" TIMESTAMP(3),

    CONSTRAINT "PessoaFisica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PessoaJuridica" (
    "id" INTEGER NOT NULL,
    "nomeFantasia" TEXT,
    "inscricaoEstadual" TEXT,
    "inscricaoMunicipal" TEXT,
    "dataFundacao" TIMESTAMP(3),
    "representanteLegal" TEXT,

    CONSTRAINT "PessoaJuridica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Endereco" (
    "id" SERIAL NOT NULL,
    "pessoaId" INTEGER NOT NULL,
    "logradouroId" INTEGER,
    "numero" TEXT,
    "complemento" TEXT,
    "bairroId" INTEGER,
    "areaRuralId" INTEGER,
    "referenciaRural" TEXT,
    "coordenadas" TEXT,
    "tipoEndereco" "public"."TipoEndereco" NOT NULL,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "propriedadeId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Endereco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Produtor" (
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
CREATE TABLE "public"."AreaEfetiva" (
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
CREATE TABLE "public"."Propriedade" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "tipoPropriedade" "public"."TipoPropriedade" NOT NULL DEFAULT 'RURAL',
    "logradouroId" INTEGER,
    "numero" TEXT,
    "areaTotal" DECIMAL(10,2) NOT NULL,
    "unidadeArea" TEXT NOT NULL DEFAULT 'alqueires',
    "itr" TEXT,
    "incra" TEXT,
    "situacao" "public"."SituacaoPropriedade" NOT NULL,
    "proprietarioResidente" BOOLEAN NOT NULL DEFAULT false,
    "localizacao" TEXT,
    "matricula" TEXT,
    "proprietarioId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Propriedade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transferencias_propriedade" (
    "id" SERIAL NOT NULL,
    "propriedade_id" INTEGER NOT NULL,
    "proprietario_anterior_id" INTEGER NOT NULL,
    "proprietario_novo_id" INTEGER NOT NULL,
    "data_transferencia" DATE NOT NULL,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transferencias_propriedade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Arrendamento" (
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
CREATE TABLE "public"."SolicitacaoBeneficio" (
    "id" SERIAL NOT NULL,
    "pessoaId" INTEGER NOT NULL,
    "programaId" INTEGER NOT NULL,
    "datasolicitacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolicitacaoBeneficio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Programa" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "leiNumero" TEXT,
    "tipoPrograma" "public"."TipoPrograma" NOT NULL,
    "secretaria" "public"."TipoPerfil" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Programa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RegrasNegocio" (
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

-- CreateTable
CREATE TABLE "public"."Usuario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "perfilId" INTEGER NOT NULL,
    "ultimoLogin" TIMESTAMP(3),
    "tentativasLogin" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoAte" TIMESTAMP(3),

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Perfil" (
    "id" SERIAL NOT NULL,
    "nome" "public"."TipoPerfil" NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Permissao" (
    "id" SERIAL NOT NULL,
    "modulo" "public"."ModuloSistema" NOT NULL,
    "acao" "public"."AcaoPermissao" NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PerfilPermissao" (
    "id" SERIAL NOT NULL,
    "perfilId" INTEGER NOT NULL,
    "permissaoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerfilPermissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UsuarioSessao" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "UsuarioSessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditoriaLogin" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "sucesso" BOOLEAN NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditoriaLogin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bairro_nome_key" ON "public"."Bairro"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "AreaRural_nome_key" ON "public"."AreaRural"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Logradouro_cep_key" ON "public"."Logradouro"("cep");

-- CreateIndex
CREATE UNIQUE INDEX "GrupoProduto_descricao_key" ON "public"."GrupoProduto"("descricao");

-- CreateIndex
CREATE UNIQUE INDEX "TipoVeiculo_descricao_key" ON "public"."TipoVeiculo"("descricao");

-- CreateIndex
CREATE UNIQUE INDEX "Veiculo_placa_key" ON "public"."Veiculo"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "Pessoa_cpfCnpj_key" ON "public"."Pessoa"("cpfCnpj");

-- CreateIndex
CREATE INDEX "transferencias_propriedade_propriedade_id_idx" ON "public"."transferencias_propriedade"("propriedade_id");

-- CreateIndex
CREATE INDEX "transferencias_propriedade_data_transferencia_idx" ON "public"."transferencias_propriedade"("data_transferencia");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "public"."Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Perfil_nome_key" ON "public"."Perfil"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Permissao_modulo_acao_key" ON "public"."Permissao"("modulo", "acao");

-- CreateIndex
CREATE UNIQUE INDEX "PerfilPermissao_perfilId_permissaoId_key" ON "public"."PerfilPermissao"("perfilId", "permissaoId");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioSessao_token_key" ON "public"."UsuarioSessao"("token");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioSessao_refreshToken_key" ON "public"."UsuarioSessao"("refreshToken");

-- AddForeignKey
ALTER TABLE "public"."Veiculo" ADD CONSTRAINT "Veiculo_tipoVeiculoId_fkey" FOREIGN KEY ("tipoVeiculoId") REFERENCES "public"."TipoVeiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PessoaFisica" ADD CONSTRAINT "PessoaFisica_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."Pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PessoaJuridica" ADD CONSTRAINT "PessoaJuridica_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."Pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Endereco" ADD CONSTRAINT "Endereco_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "public"."Pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Endereco" ADD CONSTRAINT "Endereco_logradouroId_fkey" FOREIGN KEY ("logradouroId") REFERENCES "public"."Logradouro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Endereco" ADD CONSTRAINT "Endereco_bairroId_fkey" FOREIGN KEY ("bairroId") REFERENCES "public"."Bairro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Endereco" ADD CONSTRAINT "Endereco_areaRuralId_fkey" FOREIGN KEY ("areaRuralId") REFERENCES "public"."AreaRural"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Endereco" ADD CONSTRAINT "Endereco_propriedadeId_fkey" FOREIGN KEY ("propriedadeId") REFERENCES "public"."Propriedade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Produtor" ADD CONSTRAINT "Produtor_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."PessoaFisica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AreaEfetiva" ADD CONSTRAINT "AreaEfetiva_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."Produtor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Propriedade" ADD CONSTRAINT "Propriedade_logradouroId_fkey" FOREIGN KEY ("logradouroId") REFERENCES "public"."Logradouro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Propriedade" ADD CONSTRAINT "Propriedade_proprietarioId_fkey" FOREIGN KEY ("proprietarioId") REFERENCES "public"."Pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transferencias_propriedade" ADD CONSTRAINT "transferencias_propriedade_propriedade_id_fkey" FOREIGN KEY ("propriedade_id") REFERENCES "public"."Propriedade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transferencias_propriedade" ADD CONSTRAINT "transferencias_propriedade_proprietario_anterior_id_fkey" FOREIGN KEY ("proprietario_anterior_id") REFERENCES "public"."Pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transferencias_propriedade" ADD CONSTRAINT "transferencias_propriedade_proprietario_novo_id_fkey" FOREIGN KEY ("proprietario_novo_id") REFERENCES "public"."Pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Arrendamento" ADD CONSTRAINT "Arrendamento_propriedadeId_fkey" FOREIGN KEY ("propriedadeId") REFERENCES "public"."Propriedade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Arrendamento" ADD CONSTRAINT "Arrendamento_proprietarioId_fkey" FOREIGN KEY ("proprietarioId") REFERENCES "public"."PessoaFisica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Arrendamento" ADD CONSTRAINT "Arrendamento_arrendatarioId_fkey" FOREIGN KEY ("arrendatarioId") REFERENCES "public"."PessoaFisica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SolicitacaoBeneficio" ADD CONSTRAINT "SolicitacaoBeneficio_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "public"."Pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SolicitacaoBeneficio" ADD CONSTRAINT "SolicitacaoBeneficio_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "public"."Programa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RegrasNegocio" ADD CONSTRAINT "RegrasNegocio_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "public"."Programa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Usuario" ADD CONSTRAINT "Usuario_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "public"."Perfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PerfilPermissao" ADD CONSTRAINT "PerfilPermissao_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "public"."Perfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PerfilPermissao" ADD CONSTRAINT "PerfilPermissao_permissaoId_fkey" FOREIGN KEY ("permissaoId") REFERENCES "public"."Permissao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UsuarioSessao" ADD CONSTRAINT "UsuarioSessao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
