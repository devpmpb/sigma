import React from "react";

import { formatarData, formatarCEP } from "../../../../utils/formatters";
import StatusBadge from "../../../../components/comum/StatusBadge";
import { Column } from "../../../../components/comum/DataTable";
import {
  Logradouro,
  LogradouroDTO,
  logradouroService,
} from "../../../../services";
import { CadastroBase } from "../../../../components/cadastro";
import LogradouroForm from "./LogradouroForm";

/**
 * Componente de Listagem de Logradouros
 * Utiliza o CadastroBase para mostrar a listagem em uma página separada
 */
const Logradouros: React.FC = () => {
  // Definição das colunas da tabela
  const columns: Column<Logradouro>[] = [
    { title: "ID", key: "id", width: "80px" },
    {
      title: "Tipo",
      key: "tipo",
      render: (logradouro) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
          {logradouro.tipo}
        </span>
      ),
    },
    { title: "Descrição", key: "descricao" },
    {
      title: "CEP",
      key: "cep",
      render: (logradouro) => formatarCEP(logradouro.cep),
    },
    {
      title: "Status",
      key: "ativo",
      render: (logradouro) => (
        <StatusBadge ativo={logradouro.ativo} showToggle={false} />
      ),
    },
    {
      title: "Criado em",
      key: "createdAt",
      render: (logradouro) => formatarData(logradouro.createdAt),
    },
  ];

  return (
    <CadastroBase<Logradouro, LogradouroDTO>
      title="Cadastro de Logradouros"
      service={logradouroService}
      columns={columns}
      rowKey="id"
      baseUrl="/cadastros/comum/logradouros"
      module="comum"
      FormComponent={LogradouroForm}
      searchPlaceholder="Buscar logradouros por descrição ou CEP..."
    />
  );
};

export default Logradouros;
