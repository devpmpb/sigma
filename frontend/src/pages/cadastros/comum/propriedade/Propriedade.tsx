import React from "react";

import { Column } from "../../../../components/common/DataTable";
import propriedadeService, {
  Propriedade,
  TipoPropriedade,
} from "../../../../services/common/propriedadeService";

import { CadastroBase } from "../../../../components/cadastro";
import PropriedadeForm from "./PropriedadeForm";

const Propriedade: React.FC = () => {
  const columns: Column<Propriedade>[] = [
    {
      title: "Nome",
      render: (item) => (
        <div>
          <div className="font-medium text-gray-900">{item.nome}</div>
          {item.matricula && (
            <div className="text-sm text-gray-500">
              Matrícula: {item.matricula}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Tipo",
      render: (item) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {propriedadeService.formatarTipoPropriedade(item.tipoPropriedade)}
        </span>
      ),
    },
    {
      title: "Área Total",
      align: "right",
      render: (item) => (
        <div className="text-right">
          <div className="font-medium">
            {propriedadeService.formatarArea(item.areaTotal)} alq
          </div>
        </div>
      ),
    },
    {
      title: "Proprietário",
      render: (item) => (
        <div>
          {item.proprietario ? (
            <>
              <div className="font-medium text-gray-900">
                {item.proprietario.nome}
              </div>
              <div className="text-sm text-gray-500">
                {item.proprietario.cpfCnpj}
              </div>
            </>
          ) : (
            <span className="text-gray-400">Não informado</span>
          )}
        </div>
      ),
    },
    {
      title: "Localização",
      render: (item) => (
        <div className="max-w-xs truncate" title={item.localizacao}>
          {item.localizacao || (
            <span className="text-gray-400">Não informada</span>
          )}
        </div>
      ),
    },
  ];

  /**
   * Página de listagem de propriedades
   */

  return (
    <CadastroBase
      title="Propriedades"
      service={propriedadeService}
      columns={columns}
      rowKey="id"
      baseUrl="/cadastros/comum/propriedades"
      module="comum"
      FormComponent={PropriedadeForm}
      showSearch={true}
      searchPlaceholder="Buscar por nome, matrícula ou proprietário..."
    />
  );
};

export default Propriedade;
