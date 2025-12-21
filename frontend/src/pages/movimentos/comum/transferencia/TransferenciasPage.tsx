// frontend/src/pages/movimentos/comum/transferencia/TransferenciasPage.tsx
import React, { useState } from "react";
import { CadastroBase } from "../../../../components/cadastro";
import { Column } from "../../../../components/comum/DataTable";
import transferenciaPropiedadeService, {
  TransferenciaPropriedade,
} from "../../../../services/comum/transferenciaPropiedadeService";
import TransferenciaPropiedadeForm from "./TransferenciaPropiedadeForm";
import { formatarData } from "../../../../utils/formatters";
import TransferenciaDetalhes from "./TransferenciaDetalhes";
import Modal from "../../../../components/comum/Modal";

/**
 * Página de listagem de transferências de propriedade
 * Agora usa CadastroBase com paginação
 */
const TransferenciasPage: React.FC = () => {
  const [selectedTransferencia, setSelectedTransferencia] =
    useState<TransferenciaPropriedade | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = (transferencia: TransferenciaPropriedade) => {
    setSelectedTransferencia(transferencia);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTransferencia(null);
  };

  // Definição das colunas da tabela
  const columns: Column<TransferenciaPropriedade>[] = [
    {
      title: "ID",
      key: "id",
      width: "80px",
    },
    {
      title: "Data",
      key: "dataTransferencia",
      render: (t) => formatarData(t.dataTransferencia),
      width: "120px",
    },
    {
      title: "Propriedade",
      key: "propriedade",
      render: (t) => (
        <div>
          <div className="font-medium">{t.propriedade?.nome || "-"}</div>
          {t.propriedade?.matricula && (
            <div className="text-sm text-gray-500">
              Matrícula: {t.propriedade.matricula}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "De (Anterior)",
      key: "proprietarioAnterior",
      render: (t) => (
        <div>
          <div className="font-medium">
            {t.proprietarioAnterior?.nome || "-"}
          </div>
          {t.proprietarioAnterior?.cpfCnpj && (
            <div className="text-sm text-gray-500">
              {t.proprietarioAnterior.cpfCnpj}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Para (Novo)",
      key: "proprietarioNovo",
      render: (t) => (
        <div>
          <div className="font-medium">{t.proprietarioNovo?.nome || "-"}</div>
          {t.proprietarioNovo?.cpfCnpj && (
            <div className="text-sm text-gray-500">
              {t.proprietarioNovo.cpfCnpj}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Tipo",
      key: "tipoTransferencia",
      render: (t) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {t.situacaoPropriedade}
        </span>
      ),
      width: "120px",
    },
    {
      title: "Detalhes",
      key: "detalhes",
      render: (t) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick(t);
          }}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Ver detalhes
        </button>
      ),
      width: "120px",
    },
  ];

  return (
    <>
      <CadastroBase<TransferenciaPropriedade, any>
        title="Transferências de Propriedade"
        service={transferenciaPropiedadeService}
        columns={columns}
        rowKey="id"
        baseUrl="/movimentos/comum/transferencias-propriedade"
        module="comum"
        FormComponent={TransferenciaPropiedadeForm}
        searchPlaceholder="Buscar por propriedade, proprietário ou matrícula..."
        enablePagination={true}
        initialPageSize={50}
      />

      {/* Modal de Detalhes */}
      {selectedTransferencia && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title="Detalhes da Transferência"
          size="lg"
        >
          <TransferenciaDetalhes transferencia={selectedTransferencia} />
        </Modal>
      )}
    </>
  );
};

export default TransferenciasPage;
