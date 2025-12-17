-- CreateEnum
CREATE TYPE "TipoEndereco" AS ENUM ('RESIDENCIAL', 'COMERCIAL', 'RURAL', 'CORRESPONDENCIA');

-- CreateEnum
CREATE TYPE "TipoLogradouro" AS ENUM ('RUA', 'AVENIDA', 'TRAVESSA', 'ALAMEDA', 'RODOVIA', 'LINHA', 'ESTRADA', 'OUTROS');

-- CreateEnum
CREATE TYPE "TipoPropriedade" AS ENUM ('RURAL', 'LOTE_URBANO', 'COMERCIAL', 'INDUSTRIAL');

-- CreateEnum
CREATE TYPE "TipoPessoa" AS ENUM ('FISICA', 'JURIDICA');

-- CreateEnum
CREATE TYPE "SituacaoPropriedade" AS ENUM ('PROPRIA', 'CONDOMINIO', 'USUFRUTO');

-- CreateEnum
CREATE TYPE "TipoPerfil" AS ENUM ('ADMIN', 'OBRAS', 'AGRICULTURA');

-- CreateEnum
CREATE TYPE "ModuloSistema" AS ENUM ('OBRAS', 'AGRICULTURA', 'COMUM', 'ADMIN');

-- CreateEnum
CREATE TYPE "AcaoPermissao" AS ENUM ('VIEW', 'CREATE', 'EDIT', 'DELETE');

-- CreateEnum
CREATE TYPE "TipoPrograma" AS ENUM ('SUBSIDIO', 'MATERIAL', 'SERVICO', 'CREDITO', 'ASSISTENCIA');

-- CreateEnum
CREATE TYPE "AtividadeProdutiva" AS ENUM ('AGRICULTURA', 'PECUARIA', 'AGRICULTURA_PECUARIA', 'SILVICULTURA', 'AQUICULTURA', 'HORTIFRUTI', 'AVICULTURA', 'SUINOCULTURA', 'OUTROS');

-- CreateEnum
CREATE TYPE "TipoTelefone" AS ENUM ('CELULAR', 'RESIDENCIAL', 'COMERCIAL', 'OUTRO');

-- CreateEnum
CREATE TYPE "Periodicidade" AS ENUM ('ANUAL', 'BIENAL', 'TRIENAL', 'UNICO');

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
CREATE TABLE "Veiculo" (
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
CREATE TABLE "Pessoa" (
    "id" SERIAL NOT NULL,
    "tipoPessoa" "TipoPessoa" NOT NULL,
    "nome" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "isProdutor" BOOLEAN DEFAULT false,
    "inscricaoEstadualProdutor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pessoa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PessoaFisica" (
    "id" INTEGER NOT NULL,
    "rg" TEXT,
    "dataNascimento" TIMESTAMP(3),

    CONSTRAINT "PessoaFisica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PessoaJuridica" (
    "id" INTEGER NOT NULL,
    "nomeFantasia" TEXT,
    "inscricaoEstadual" TEXT,
    "inscricaoMunicipal" TEXT,
    "dataFundacao" TIMESTAMP(3),
    "representanteLegal" TEXT,

    CONSTRAINT "PessoaJuridica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Telefone" (
    "id" SERIAL NOT NULL,
    "pessoaId" INTEGER NOT NULL,
    "ddd" TEXT,
    "numero" TEXT NOT NULL,
    "ramal" TEXT,
    "tipo" "TipoTelefone" NOT NULL DEFAULT 'CELULAR',
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Telefone_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "AreaEfetiva" (
    "id" SERIAL NOT NULL,
    "pessoaId" INTEGER NOT NULL,
    "anoReferencia" INTEGER NOT NULL,
    "areaPropria" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "areaArrendadaRecebida" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "areaArrendadaCedida" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "areaEfetiva" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "atividadeProdutiva" "AtividadeProdutiva",
    "ramoAtividadeId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AreaEfetiva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Propriedade" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "tipoPropriedade" "TipoPropriedade" NOT NULL DEFAULT 'RURAL',
    "numero" TEXT,
    "areaTotal" DECIMAL(10,2) NOT NULL,
    "unidadeArea" TEXT NOT NULL DEFAULT 'alqueires',
    "itr" TEXT,
    "incra" TEXT,
    "atividadeProdutiva" "AtividadeProdutiva",
    "situacao" "SituacaoPropriedade" NOT NULL,
    "isproprietarioResidente" BOOLEAN NOT NULL DEFAULT false,
    "localizacao" TEXT,
    "matricula" TEXT,
    "proprietarioId" INTEGER NOT NULL,
    "nuProprietarioId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "enderecoId" INTEGER,

    CONSTRAINT "Propriedade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transferencias_propriedade" (
    "id" SERIAL NOT NULL,
    "propriedade_id" INTEGER NOT NULL,
    "proprietario_anterior_id" INTEGER NOT NULL,
    "proprietario_novo_id" INTEGER NOT NULL,
    "data_transferencia" DATE NOT NULL,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "nu_proprietario_novo_id" INTEGER,
    "situacao_propriedade" "SituacaoPropriedade" NOT NULL DEFAULT 'PROPRIA',

    CONSTRAINT "transferencias_propriedade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropriedadeCondomino" (
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
    "residente" BOOLEAN NOT NULL DEFAULT false,
    "atividadeProdutiva" "AtividadeProdutiva",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Arrendamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitacaoBeneficio" (
    "id" SERIAL NOT NULL,
    "pessoaId" INTEGER NOT NULL,
    "programaId" INTEGER NOT NULL,
    "datasolicitacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "observacoes" TEXT,
    "modalidade" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "calculoDetalhes" JSONB,
    "quantidadeSolicitada" DECIMAL(10,2),
    "regraAplicadaId" INTEGER,
    "valorCalculado" DECIMAL(10,2),
    "enquadramento" TEXT,

    CONSTRAINT "SolicitacaoBeneficio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RamoAtividade" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" "AtividadeProdutiva" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RamoAtividade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Programa" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "leiNumero" TEXT,
    "tipoPrograma" "TipoPrograma" NOT NULL,
    "secretaria" "TipoPerfil" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "periodicidade" "Periodicidade" NOT NULL DEFAULT 'ANUAL',
    "unidadeLimite" VARCHAR(50),
    "limiteMaximoFamilia" DECIMAL(10,2),

    CONSTRAINT "Programa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramaRamoAtividade" (
    "programaId" INTEGER NOT NULL,
    "ramoAtividadeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramaRamoAtividade_pkey" PRIMARY KEY ("programaId","ramoAtividadeId")
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

-- CreateTable
CREATE TABLE "historico_solicitacoes" (
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

-- CreateTable
CREATE TABLE "ordens_servico" (
    "id" SERIAL NOT NULL,
    "numeroOrdem" TEXT NOT NULL,
    "pessoaId" INTEGER NOT NULL,
    "veiculoId" INTEGER NOT NULL,
    "dataServico" TIMESTAMP(3) NOT NULL,
    "horaInicio" TEXT,
    "horaFim" TEXT,
    "valorReferencial" DECIMAL(10,2) NOT NULL DEFAULT 180.00,
    "valorCalculado" DECIMAL(10,2) NOT NULL,
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "usuarioId" INTEGER,
    "enderecoServico" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tipoServicoId" INTEGER NOT NULL,
    "quantidadeSolicitada" DECIMAL(6,2) NOT NULL,

    CONSTRAINT "ordens_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
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
CREATE TABLE "Perfil" (
    "id" SERIAL NOT NULL,
    "nome" "TipoPerfil" NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permissao" (
    "id" SERIAL NOT NULL,
    "modulo" "ModuloSistema" NOT NULL,
    "acao" "AcaoPermissao" NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerfilPermissao" (
    "id" SERIAL NOT NULL,
    "perfilId" INTEGER NOT NULL,
    "permissaoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerfilPermissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioSessao" (
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
CREATE TABLE "AuditoriaLogin" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "sucesso" BOOLEAN NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditoriaLogin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "v_programas_gim" (
    "count" BIGINT
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
CREATE UNIQUE INDEX "Veiculo_placa_key" ON "Veiculo"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "Pessoa_cpfCnpj_key" ON "Pessoa"("cpfCnpj");

-- CreateIndex
CREATE INDEX "Telefone_pessoaId_idx" ON "Telefone"("pessoaId");

-- CreateIndex
CREATE INDEX "Telefone_pessoaId_principal_idx" ON "Telefone"("pessoaId", "principal");

-- CreateIndex
CREATE INDEX "AreaEfetiva_pessoaId_idx" ON "AreaEfetiva"("pessoaId");

-- CreateIndex
CREATE INDEX "AreaEfetiva_ramoAtividadeId_idx" ON "AreaEfetiva"("ramoAtividadeId");

-- CreateIndex
CREATE INDEX "AreaEfetiva_anoReferencia_idx" ON "AreaEfetiva"("anoReferencia");

-- CreateIndex
CREATE UNIQUE INDEX "AreaEfetiva_pessoaId_anoReferencia_key" ON "AreaEfetiva"("pessoaId", "anoReferencia");

-- CreateIndex
CREATE INDEX "transferencias_propriedade_propriedade_id_idx" ON "transferencias_propriedade"("propriedade_id");

-- CreateIndex
CREATE INDEX "transferencias_propriedade_data_transferencia_idx" ON "transferencias_propriedade"("data_transferencia");

-- CreateIndex
CREATE INDEX "propriedades_condominos_condomino_id_idx" ON "PropriedadeCondomino"("condomino_id");

-- CreateIndex
CREATE INDEX "propriedades_condominos_propriedade_id_idx" ON "PropriedadeCondomino"("propriedade_id");

-- CreateIndex
CREATE UNIQUE INDEX "propriedades_condominos_propriedade_id_condomino_id_data_fi_key" ON "PropriedadeCondomino"("propriedade_id", "condomino_id", "data_fim");

-- CreateIndex
CREATE UNIQUE INDEX "RamoAtividade_nome_key" ON "RamoAtividade"("nome");

-- CreateIndex
CREATE INDEX "RamoAtividade_categoria_idx" ON "RamoAtividade"("categoria");

-- CreateIndex
CREATE INDEX "RamoAtividade_ativo_idx" ON "RamoAtividade"("ativo");

-- CreateIndex
CREATE INDEX "Programa_periodicidade_idx" ON "Programa"("periodicidade");

-- CreateIndex
CREATE INDEX "ProgramaRamoAtividade_programaId_idx" ON "ProgramaRamoAtividade"("programaId");

-- CreateIndex
CREATE INDEX "ProgramaRamoAtividade_ramoAtividadeId_idx" ON "ProgramaRamoAtividade"("ramoAtividadeId");

-- CreateIndex
CREATE INDEX "historico_solicitacoes_solicitacaoId_idx" ON "historico_solicitacoes"("solicitacaoId");

-- CreateIndex
CREATE INDEX "historico_solicitacoes_createdAt_idx" ON "historico_solicitacoes"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_servico_nome_key" ON "tipos_servico"("nome");

-- CreateIndex
CREATE INDEX "faixas_preco_servico_tipoServicoId_idx" ON "faixas_preco_servico"("tipoServicoId");

-- CreateIndex
CREATE UNIQUE INDEX "ordens_servico_numeroOrdem_key" ON "ordens_servico"("numeroOrdem");

-- CreateIndex
CREATE INDEX "ordens_servico_tipoServicoId_idx" ON "ordens_servico"("tipoServicoId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Perfil_nome_key" ON "Perfil"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Permissao_modulo_acao_key" ON "Permissao"("modulo", "acao");

-- CreateIndex
CREATE UNIQUE INDEX "PerfilPermissao_perfilId_permissaoId_key" ON "PerfilPermissao"("perfilId", "permissaoId");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioSessao_token_key" ON "UsuarioSessao"("token");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioSessao_refreshToken_key" ON "UsuarioSessao"("refreshToken");

-- AddForeignKey
ALTER TABLE "Veiculo" ADD CONSTRAINT "Veiculo_tipoVeiculoId_fkey" FOREIGN KEY ("tipoVeiculoId") REFERENCES "TipoVeiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PessoaFisica" ADD CONSTRAINT "PessoaFisica_id_fkey" FOREIGN KEY ("id") REFERENCES "Pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PessoaJuridica" ADD CONSTRAINT "PessoaJuridica_id_fkey" FOREIGN KEY ("id") REFERENCES "Pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Telefone" ADD CONSTRAINT "Telefone_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endereco" ADD CONSTRAINT "Endereco_areaRuralId_fkey" FOREIGN KEY ("areaRuralId") REFERENCES "AreaRural"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endereco" ADD CONSTRAINT "Endereco_bairroId_fkey" FOREIGN KEY ("bairroId") REFERENCES "Bairro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endereco" ADD CONSTRAINT "Endereco_logradouroId_fkey" FOREIGN KEY ("logradouroId") REFERENCES "Logradouro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endereco" ADD CONSTRAINT "Endereco_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AreaEfetiva" ADD CONSTRAINT "AreaEfetiva_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AreaEfetiva" ADD CONSTRAINT "AreaEfetiva_ramoAtividadeId_fkey" FOREIGN KEY ("ramoAtividadeId") REFERENCES "RamoAtividade"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Propriedade" ADD CONSTRAINT "Propriedade_enderecoId_fkey" FOREIGN KEY ("enderecoId") REFERENCES "Endereco"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Propriedade" ADD CONSTRAINT "Propriedade_nuProprietarioId_fkey" FOREIGN KEY ("nuProprietarioId") REFERENCES "Pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Propriedade" ADD CONSTRAINT "Propriedade_proprietarioId_fkey" FOREIGN KEY ("proprietarioId") REFERENCES "Pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias_propriedade" ADD CONSTRAINT "transferencias_propriedade_nu_proprietario_novo_id_fkey" FOREIGN KEY ("nu_proprietario_novo_id") REFERENCES "Pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias_propriedade" ADD CONSTRAINT "transferencias_propriedade_propriedade_id_fkey" FOREIGN KEY ("propriedade_id") REFERENCES "Propriedade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias_propriedade" ADD CONSTRAINT "transferencias_propriedade_proprietario_anterior_id_fkey" FOREIGN KEY ("proprietario_anterior_id") REFERENCES "Pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencias_propriedade" ADD CONSTRAINT "transferencias_propriedade_proprietario_novo_id_fkey" FOREIGN KEY ("proprietario_novo_id") REFERENCES "Pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropriedadeCondomino" ADD CONSTRAINT "propriedades_condominos_condomino_id_fkey" FOREIGN KEY ("condomino_id") REFERENCES "Pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropriedadeCondomino" ADD CONSTRAINT "propriedades_condominos_propriedade_id_fkey" FOREIGN KEY ("propriedade_id") REFERENCES "Propriedade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Arrendamento" ADD CONSTRAINT "Arrendamento_arrendatarioId_fkey" FOREIGN KEY ("arrendatarioId") REFERENCES "Pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Arrendamento" ADD CONSTRAINT "Arrendamento_propriedadeId_fkey" FOREIGN KEY ("propriedadeId") REFERENCES "Propriedade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Arrendamento" ADD CONSTRAINT "Arrendamento_proprietarioId_fkey" FOREIGN KEY ("proprietarioId") REFERENCES "Pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitacaoBeneficio" ADD CONSTRAINT "SolicitacaoBeneficio_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitacaoBeneficio" ADD CONSTRAINT "SolicitacaoBeneficio_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "Programa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitacaoBeneficio" ADD CONSTRAINT "SolicitacaoBeneficio_regraAplicadaId_fkey" FOREIGN KEY ("regraAplicadaId") REFERENCES "RegrasNegocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramaRamoAtividade" ADD CONSTRAINT "ProgramaRamoAtividade_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "Programa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramaRamoAtividade" ADD CONSTRAINT "ProgramaRamoAtividade_ramoAtividadeId_fkey" FOREIGN KEY ("ramoAtividadeId") REFERENCES "RamoAtividade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegrasNegocio" ADD CONSTRAINT "RegrasNegocio_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "Programa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_solicitacoes" ADD CONSTRAINT "historico_solicitacoes_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "SolicitacaoBeneficio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faixas_preco_servico" ADD CONSTRAINT "faixas_preco_servico_tipoServicoId_fkey" FOREIGN KEY ("tipoServicoId") REFERENCES "tipos_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_tipoServicoId_fkey" FOREIGN KEY ("tipoServicoId") REFERENCES "tipos_servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "Perfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfilPermissao" ADD CONSTRAINT "PerfilPermissao_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "Perfil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfilPermissao" ADD CONSTRAINT "PerfilPermissao_permissaoId_fkey" FOREIGN KEY ("permissaoId") REFERENCES "Permissao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioSessao" ADD CONSTRAINT "UsuarioSessao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

