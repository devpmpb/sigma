// frontend/src/pages/cadastros/obras/tipoServico/TiposServico.tsx
import React from "react";
import { Column } from "../../../../components/comum/DataTable";
import tipoServicoService, {
  TipoServico,
  TipoServicoDTO,
} from "../../../../services/obras/tipoServicoService";
import { CadastroBase } from "../../../../components/cadastro";
import TipoServicoForm from "./TipoServicoForm";

const TiposServico: React.FC = () => {
  // Definição das colunas da tabela
  const columns: Column<TipoServico>[] = [
    {
      title: "Nome",
      key: "nome",
      render: (tipo) => (
        <div>
          <div className="font-medium">{tipo.nome}</div>
        </div>
      ),
    },
    {
      title: "Unidade",
      key: "unidade",
      render: (tipo) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {tipo.unidade}
        </span>
      ),
    },
    {
      title: "Faixas de Preço",
      key: "faixasPreco",
      render: (tipo) => (
        <div className="text-sm">
          {tipo.faixasPreco && tipo.faixasPreco.length > 0 ? (
            <div className="space-y-1">
              {tipo.faixasPreco.map((faixa, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-600">
                    {faixa.quantidadeMin}
                    {faixa.quantidadeMax ? `-${faixa.quantidadeMax}` : "+"}:
                  </span>
                  <span className="font-semibold text-green-700">
                    {faixa.multiplicadorVR}×VR
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-gray-400">Sem faixas configuradas</span>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      key: "ativo",
      render: (tipo) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            tipo.ativo
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {tipo.ativo ? "Ativo" : "Inativo"}
        </span>
      ),
    },
  ];

  return (
    <CadastroBase<TipoServico, TipoServicoDTO>
      title="Tipos de Serviço"
      service={tipoServicoService}
      columns={columns}
      baseUrl="/cadastros/comum/tipoServico"
      rowKey="id"
      module="obras"
      FormComponent={TipoServicoForm}
      searchPlaceholder="Buscar tipos de serviço..."
      enableStatusToggle={false}
    />
  );
};

export default TiposServico;
