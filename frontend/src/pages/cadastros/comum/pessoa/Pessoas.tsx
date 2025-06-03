import React, { useState } from "react";
import { formatarData, formatarCPFCNPJ, formatarTelefone } from "../../../../utils/formatters";
import StatusBadge from "../../../../components/common/StatusBadge";
import { Column } from "../../../../components/common/DataTable";
import {
  Pessoa,
  PessoaDTO,
  TipoPessoa,
  pessoaService,
} from "../../../../services";
import { CadastroBase } from "../../../../components/cadastro";
import PessoaForm from "./PessoaForm";
import useApiService from "../../../../hooks/useApiService";

/**
 * Componente de Listagem de Pessoas
 * Utiliza o CadastroBase para mostrar a listagem em uma página separada
 */
const Pessoas: React.FC = () => {

 

  const handleToggleStatus = async (pessoa: Pessoa) => {
    try {
      const isAtivo = pessoa.ativo === true;
      const statusText = isAtivo ? "inativar" : "ativar";
      
      if (!window.confirm(`Tem certeza que deseja ${statusText} esta pessoa?`)) {
        return;
      }
      // Usa o método do BaseApiService que espera (id, ativo: boolean)
      await pessoaService.alterarStatus(pessoa.id, !isAtivo);
          
    } catch (error) {
      console.error("Erro ao alterar status da pessoa:", error);
      alert("Erro ao alterar status. Tente novamente.");
    }
  };

  const handleToggleAtivo = async (item: T) => {
    const result = await toggleStatus(item.id, !item.ativo);

    if (result) fetchAll();
  };

  // Definição das colunas da tabela
  const columns: Column<Pessoa>[] = [
    { title: "ID", key: "id", width: "80px" },
    {
      title: "Tipo",
      key: "tipoPessoa",
      render: (pessoa) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          pessoa.tipoPessoa === TipoPessoa.FISICA 
            ? "bg-green-100 text-green-800" 
            : "bg-purple-100 text-purple-800"
        }`}>
          {pessoa.tipoPessoa === TipoPessoa.FISICA ? "Física" : "Jurídica"}
        </span>
      ),
    },
    { 
      title: "Nome", 
      key: "nome",
      render: (pessoa) => (
        <div>
          <div className="font-medium">{pessoa.nome}</div>
          {pessoa.tipoPessoa === TipoPessoa.JURIDICA && pessoa.pessoaJuridica?.nomeFantasia && (
            <div className="text-sm text-gray-500">
              {pessoa.pessoaJuridica.nomeFantasia}
            </div>
          )}
        </div>
      )
    },
    {
      title: "CPF/CNPJ",
      key: "cpfCnpj",
      render: (pessoa) => formatarCPFCNPJ(pessoa.cpfCnpj, pessoa.tipoPessoa),
    },
    { 
      title: "E-mail", 
      key: "email",
      render: (pessoa) => pessoa.email || "-"
    },
    {
      title: "Telefone",
      key: "telefone",
      render: (pessoa) => pessoa.telefone ? formatarTelefone(pessoa.telefone) : "-",
    },
    {
      title: "Info Adicional",
      key: "info",
      render: (pessoa) => (
        <div className="text-sm text-gray-600">
          {pessoa.tipoPessoa === TipoPessoa.FISICA ? (
            pessoa.pessoaFisica?.dataNascimento ? (
              <div>Nasc: {formatarData(pessoa.pessoaFisica.dataNascimento, false)}</div>
            ) : null
          ) : (
            pessoa.pessoaJuridica?.representanteLegal ? (
              <div>Rep: {pessoa.pessoaJuridica.representanteLegal}</div>
            ) : null
          )}
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (pessoa) => (
        <StatusBadge 
          ativo={pessoa.ativo} 
          showToggle={true}
          onToggle={() => handleToggleStatus(pessoa)}
        />
      ),
    },
    {
      title: "Cadastrado em",
      key: "createdAt",
      render: (pessoa) => formatarData(pessoa.createdAt, false),
    },
  ];

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
    />
  );
};

export default Pessoas;