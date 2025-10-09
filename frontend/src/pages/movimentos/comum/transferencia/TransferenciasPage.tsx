// frontend/src/pages/movimentos/comum/transferencia/TransferenciasPage.tsx
import React from "react";
import { CadastroBase } from "../../../../components/cadastro";
import { Column } from "../../../../components/comum/DataTable";
import transferenciaPropiedadeService, {
  TransferenciaPropriedade,
  TransferenciaPropiedadeDTO,
} from "../../../../services/comum/transferenciaPropiedadeService";
import TransferenciaPropiedadeForm from "./TransferenciaPropiedadeForm";
import { formatarData } from "../../../../utils/formatters";

/**
 * Página de listagem de transferências de propriedade
 * Usa CadastroBase para manter padrão do projeto
 */
const TransferenciasPage: React.FC = () => {
  // Definição das colunas da tabela
  const columns: Column<TransferenciaPropriedade>[] = [
    {
      title: "ID",
      key: "id",
      width: "80px",
      sortable: true,
    },
    {
      title: "Propriedade",
      key: "propriedade",
      render: (transferencia) => (
        <div>
          <div className="font-medium text-gray-900">
            {transferencia.propriedade?.nome ||
              `ID: ${transferencia.propriedadeId}`}
          </div>
          {transferencia.propriedade?.matricula && (
            <div className="text-xs text-gray-500">
              Matrícula: {transferencia.propriedade.matricula}
            </div>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      title: "De (Proprietário Anterior)",
      key: "proprietarioAnterior",
      render: (transferencia) => (
        <div>
          <div className="font-medium text-gray-900">
            {transferencia.proprietarioAnterior?.nome ||
              `ID: ${transferencia.proprietarioAnteriorId}`}
          </div>
          {transferencia.proprietarioAnterior?.cpfCnpj && (
            <div className="text-xs text-gray-500">
              {transferencia.proprietarioAnterior.cpfCnpj}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Para (Novo Proprietário)",
      key: "proprietarioNovo",
      render: (transferencia) => (
        <div>
          <div className="font-medium text-gray-900">
            {transferencia.proprietarioNovo?.nome ||
              `ID: ${transferencia.proprietarioNovoId}`}
          </div>
          {transferencia.proprietarioNovo?.cpfCnpj && (
            <div className="text-xs text-gray-500">
              {transferencia.proprietarioNovo.cpfCnpj}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Data da Transferência",
      key: "dataTransferencia",
      render: (transferencia) => (
        <span className="text-sm text-gray-900">
          {formatarData(transferencia.dataTransferencia, false)}
        </span>
      ),
      sortable: true,
    },
    {
      title: "Observações",
      key: "observacoes",
      render: (transferencia) => (
        <div className="max-w-xs truncate text-sm text-gray-600">
          {transferencia.observacoes || "-"}
        </div>
      ),
    },
  ];

  return (
    <CadastroBase<TransferenciaPropriedade, TransferenciaPropiedadeDTO>
      title="Transferências de Propriedade"
      service={transferenciaPropiedadeService}
      columns={columns}
      rowKey="id"
      baseUrl="/movimentos/comum/transferencias-propriedade"
      module="comum"
      FormComponent={TransferenciaPropiedadeForm}
      searchPlaceholder="Buscar por propriedade, proprietário ou matrícula..."
      enableStatusToggle={false}
      showSearch={true}
    />
  );
};

export default TransferenciasPage;
