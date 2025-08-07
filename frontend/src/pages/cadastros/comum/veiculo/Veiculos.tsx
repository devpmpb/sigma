import React from "react";

import { formatarData } from "../../../../utils/formatters";
import StatusBadge from "../../../../components/comum/StatusBadge";
import { Column } from "../../../../components/comum/DataTable";
import veiculoService, {
  Veiculo,
  VeiculoDTO,
} from "../../../../services/comum/veiculoService";
import { CadastroBase } from "../../../../components/cadastro";


const Veiculos: React.FC = () => {
  // Definição das colunas da tabela
  const columns: Column<Veiculo>[] = [
    { title: "ID", key: "id", width: "80px" },
    {
      title: "Tipo",
      key: "tipoVeiculo",
      render: (veiculo) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
          {veiculo.tipoVeiculo?.descricao || "N/A"}
        </span>
      ),
    },
    { title: "Descrição", key: "descricao" },
    {
      title: "Placa",
      key: "placa",
      render: (veiculo) => (
        <span className="font-mono font-semibold text-gray-900">
          {veiculoService.formatarPlaca(veiculo.placa)}
        </span>
      ),
    },
    {
      title: "Status",
      key: "ativo",
      render: (veiculo) => (
        <StatusBadge ativo={veiculo.ativo} showToggle={false} />
      ),
    },
    {
      title: "Criado em",
      key: "createdAt",
      render: (veiculo) => formatarData(veiculo.createdAt),
    },
  ];

  return (
    <CadastroBase<Veiculo, VeiculoDTO>
      title="Cadastro de Veículos"
      service={veiculoService}
      columns={columns}
      rowKey="id"
      baseUrl="/cadastros/comum/veiculos"
      module="comum"
      //FormComponent={VeiculoForm}
      searchPlaceholder="Buscar veículos por descrição, placa ou tipo..."
      enableStatusToggle={true}
      statusColumn={{
        title: "Status",
        activeText: "Ativo",
        inactiveText: "Inativo",
      }}
    />
  );
};

export default Veiculos;