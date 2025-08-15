// frontend/src/pages/cadastros/comum/pessoa/Pessoas.tsx - VERSÃO ATUALIZADA
import React from "react";
import {
  formatarData,
  formatarCPFCNPJ,
  formatarTelefone,
} from "../../../../utils/formatters";
import { Column } from "../../../../components/comum/DataTable";
import {
  Pessoa,
  PessoaDTO,
  pessoaService,
  TipoPessoa,
} from "../../../../services";
import { CadastroBase } from "../../../../components/cadastro";
import PessoaForm from "./PessoaForm";

/**
 * Componente de Listagem de Pessoas
 * 🆕 ATUALIZADO: Agora mostra status de produtor rural e área efetiva
 */
const Pessoas: React.FC = () => {
  // Definição das colunas da tabela
  const columns: Column<Pessoa>[] = [
    { title: "ID", key: "id", width: "80px" },
    {
      title: "Tipo",
      key: "tipoPessoa",
      render: (pessoa) => (
        <div className="flex flex-col gap-1">
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              pessoa.tipoPessoa === TipoPessoa.FISICA
                ? "bg-green-100 text-green-800"
                : "bg-purple-100 text-purple-800"
            }`}
          >
            {pessoa.tipoPessoa === TipoPessoa.FISICA ? "Física" : "Jurídica"}
          </span>
          
          {/* 🆕 Badge para produtor rural */}
          {pessoa.produtorRural && (
            <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 font-medium">
              🌾 Produtor
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Nome",
      key: "nome",
      render: (pessoa) => (
        <div>
          <div className="font-medium">{pessoa.nome}</div>
          {pessoa.tipoPessoa === TipoPessoa.JURIDICA &&
            pessoa.pessoaJuridica?.nomeFantasia && (
              <div className="text-sm text-gray-500">
                {pessoa.pessoaJuridica.nomeFantasia}
              </div>
            )}
          
          {/* 🆕 Mostrar inscrição estadual se for produtor */}
          {pessoa.produtorRural && pessoa.inscricaoEstadual && (
            <div className="text-xs text-green-600">
              IE: {pessoa.inscricaoEstadual}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "CPF/CNPJ",
      key: "cpfCnpj",
      render: (pessoa) => formatarCPFCNPJ(pessoa.cpfCnpj, pessoa.tipoPessoa),
    },
    {
      title: "Contato",
      key: "contato",
      render: (pessoa) => (
        <div className="text-sm">
          {pessoa.email && (
            <div className="text-blue-600">{pessoa.email}</div>
          )}
          {pessoa.telefone && (
            <div className="text-gray-600">
              {formatarTelefone(pessoa.telefone)}
            </div>
          )}
          {!pessoa.email && !pessoa.telefone && (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      title: "Info Adicional",
      key: "info",
      render: (pessoa) => (
        <div className="text-sm text-gray-600">
          {pessoa.tipoPessoa === TipoPessoa.FISICA ? (
            pessoa.pessoaFisica?.dataNascimento ? (
              <div>
                Nasc: {formatarData(pessoa.pessoaFisica.dataNascimento, false)}
              </div>
            ) : null
          ) : pessoa.pessoaJuridica?.representanteLegal ? (
            <div>Rep: {pessoa.pessoaJuridica.representanteLegal}</div>
          ) : null}
          
          {/* 🆕 Mostrar área efetiva se for produtor */}
          {pessoa.produtorRural && pessoa.areaEfetiva && (
            <div className="text-green-600 font-medium">
              Área: {pessoaService.formatarArea(pessoa.areaEfetiva.areaEfetiva)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Cadastrado em",
      key: "createdAt",
      render: (pessoa) => formatarData(pessoa.createdAt, false),
    },
  ];

  // 🆕 Filtros rápidos para a listagem
  const quickFilters = [
    {
      label: "Todos",
      filter: (pessoas: Pessoa[]) => pessoas,
      color: "gray" as const,
    },
    {
      label: "Pessoas Físicas",
      filter: (pessoas: Pessoa[]) => 
        pessoas.filter(p => p.tipoPessoa === TipoPessoa.FISICA),
      color: "green" as const,
    },
    {
      label: "Pessoas Jurídicas",
      filter: (pessoas: Pessoa[]) => 
        pessoas.filter(p => p.tipoPessoa === TipoPessoa.JURIDICA),
      color: "purple" as const,
    },
    {
      label: "Produtores Rurais",
      filter: (pessoas: Pessoa[]) => pessoas.filter(p => p.produtorRural),
      color: "yellow" as const,
    },
    {
      label: "Com Área Efetiva",
      filter: (pessoas: Pessoa[]) => pessoas.filter(p => p.areaEfetiva),
      color: "blue" as const,
    },
  ];

  // 🆕 Função para calcular métricas
  const calculateMetrics = (pessoas: Pessoa[]) => {
    const total = pessoas.length;
    const produtores = pessoas.filter(p => p.produtorRural).length;
    const comAreaEfetiva = pessoas.filter(p => p.areaEfetiva).length;
    const pessoasFisicas = pessoas.filter(p => p.tipoPessoa === TipoPessoa.FISICA).length;
    const pessoasJuridicas = pessoas.filter(p => p.tipoPessoa === TipoPessoa.JURIDICA).length;
    
    // Calcular área total efetiva
    const areaTotal = pessoas
      .filter(p => p.areaEfetiva)
      .reduce((sum, p) => sum + Number(p.areaEfetiva!.areaEfetiva), 0);

    return {
      total,
      produtores,
      comAreaEfetiva,
      pessoasFisicas,
      pessoasJuridicas,
      areaTotal: pessoaService.formatarArea(areaTotal),
    };
  };

  return (
    <CadastroBase<Pessoa, PessoaDTO>
      title="Cadastro de Pessoas"
      service={pessoaService}
      columns={columns}
      rowKey="id"
      baseUrl="/cadastros/comum/pessoas"
      module="comum"
      FormComponent={PessoaForm}
      searchPlaceholder="Buscar pessoas por nome, CPF/CNPJ ou e-mail..."
      enableStatusToggle={true}
      statusColumn={{
        title: "Status",
        activeText: "Ativo",
        inactiveText: "Inativo",
      }}
      // 🆕 Novas props para melhor experiência
      quickFilters={quickFilters}
      showMetrics={true}
      calculateMetrics={calculateMetrics}
    />
  );
};

export default Pessoas;