// frontend/src/pages/movimentos/comum/transferencia/TransferenciasPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import transferenciaPropiedadeService, {
  TransferenciaPropriedade,
} from "../../../../services/comum/transferenciaPropiedadeService";
import TransferenciaCard from "./TransferenciaCard";
import TransferenciaDetalhes from "./TransferenciaDetalhes";
import Modal from "../../../../components/comum/Modal";

/**
 * Página de listagem de transferências de propriedade
 * Visualização em cards com modal de detalhes (read-only)
 */
const TransferenciasPage: React.FC = () => {
  const navigate = useNavigate();
  const [transferencias, setTransferencias] = useState<
    TransferenciaPropriedade[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTransferencia, setSelectedTransferencia] =
    useState<TransferenciaPropriedade | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Carregar transferências
  useEffect(() => {
    const fetchTransferencias = async () => {
      setLoading(true);
      try {
        const data = await transferenciaPropiedadeService.getAll();
        setTransferencias(data);
      } catch (error) {
        console.error("Erro ao carregar transferências:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransferencias();
  }, []);

  // Filtrar transferências pela busca
  const transferenciasFiltradas = transferencias.filter((t) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      t.propriedade?.nome?.toLowerCase().includes(searchLower) ||
      t.propriedade?.matricula?.toLowerCase().includes(searchLower) ||
      t.proprietarioAnterior?.nome?.toLowerCase().includes(searchLower) ||
      t.proprietarioNovo?.nome?.toLowerCase().includes(searchLower)
    );
  });

  const handleCardClick = (transferencia: TransferenciaPropriedade) => {
    setSelectedTransferencia(transferencia);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTransferencia(null);
  };

  const handleNovaTransferencia = () => {
    navigate({ to: "/movimentos/comum/transferencias-propriedade/novo" });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Transferências de Propriedade
          </h1>
          <p className="text-gray-600 mt-1">
            Histórico de transferências e alterações de propriedades
          </p>
        </div>
        <button
          onClick={handleNovaTransferencia}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Nova Transferência
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por propriedade, proprietário ou matrícula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando transferências...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && transferenciasFiltradas.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm
              ? "Nenhuma transferência encontrada"
              : "Nenhuma transferência cadastrada"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? "Tente usar outros termos de busca."
              : "Comece criando uma nova transferência de propriedade."}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <button
                onClick={handleNovaTransferencia}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Nova Transferência
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cards Grid */}
      {!loading && transferenciasFiltradas.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {transferenciasFiltradas.map((transferencia) => (
            <TransferenciaCard
              key={transferencia.id}
              transferencia={transferencia}
              onClick={() => handleCardClick(transferencia)}
            />
          ))}
        </div>
      )}

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
    </div>
  );
};

export default TransferenciasPage;
