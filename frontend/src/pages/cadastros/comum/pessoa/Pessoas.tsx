import React from "react";
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

/**
 * Componente de Listagem de Pessoas
 * Utiliza o CadastroBase para mostrar a listagem em uma página separada
 */
const Pessoas: React.FC = () => {
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
    { title: "Nome", key: "nome" },
    {
      title: "CPF/CNPJ",
      key: "cpfCnpj",
      render: (pessoa) => formatarCPFCNPJ(pessoa.cpfCnpj, pessoa.tipoPessoa),
    },
    { title: "E-mail", key: "email" },
    {
      title: "Telefone",
      key: "telefone",
      render: (pessoa) => formatarTelefone(pessoa.telefone),
    },
    {
      title: "Status",
      key: "ativo",
      render: (pessoa) => (
        <StatusBadge ativo={pessoa.ativo} showToggle={false} />
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