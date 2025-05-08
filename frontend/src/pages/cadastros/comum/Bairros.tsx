import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import bairroService, {
  Bairro,
  BairroDTO,
} from "../../../services/cadastros/bairroService";
import useApiService from "../../../hooks/useApiService";

// Componente para o cadastro de bairros
const Bairros: React.FC = () => {
  // Estados locais
  const [termoBusca, setTermoBusca] = useState("");
  const [editando, setEditando] = useState(false);
  const [bairroAtual, setBairroAtual] = useState<BairroDTO>({
    nome: "",
    ativo: true,
  });
  const [idAtual, setIdAtual] = useState<number | null>(null);

  const navigate = useNavigate();

  // Usando o hook personalizado para o serviço de bairros
  const {
    data: bairros,
    loading,
    error,
    fetchAll,
    searchByTerm,
    create,
    update,
    toggleStatus,
    remove,
    clearItem,
  } = useApiService<Bairro, BairroDTO>(bairroService);

  // Carregar bairros ao iniciar o componente
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Função para buscar bairros por termo
  const buscarBairrosPorTermo = () => {
    searchByTerm(termoBusca);
  };

  // Funções de manipulação de formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setBairroAtual((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bairroAtual.nome.trim()) {
      alert("Nome do bairro é obrigatório.");
      return;
    }

    let success = false;

    console.log("bairro" + bairroAtual);

    if (editando && idAtual) {
      // Atualiza o bairro existente
      const result = await update(idAtual, bairroAtual);
      success = !!result;

      if (success) alert("Bairro atualizado com sucesso!");
    } else {
      // Cria um novo bairro
      const result = await create(bairroAtual);
      success = !!result;

      if (success) alert("Bairro cadastrado com sucesso!");
    }

    if (success) {
      // Limpar formulário e recarregar lista
      resetForm();
      fetchAll();
    }
  };

  // Funções para editar e excluir bairros
  const handleEditar = (bairro: Bairro) => {
    setIdAtual(bairro.id);
    setBairroAtual({
      nome: bairro.nome,
      ativo: bairro.ativo,
    });
    setEditando(true);
  };

  const handleExcluir = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este bairro?")) return;

    const success = await remove(id);

    if (success) {
      alert("Bairro excluído com sucesso!");
      fetchAll();
    }
  };

  // Função para alternar status ativo/inativo
  const handleToggleAtivo = async (bairro: Bairro) => {
    const result = await toggleStatus(bairro.id, !bairro.ativo);

    if (result) fetchAll();
  };

  // Função para cancelar edição
  const handleCancelar = () => {
    resetForm();
  };

  // Função para limpar o formulário
  const resetForm = () => {
    setIdAtual(null);
    setBairroAtual({ nome: "", ativo: true });
    setEditando(false);
    clearItem();
  };

  // Formatação de data para exibição
  const formatarData = (dataString: string) => {
    if (!dataString) return "";
    const data = new Date(dataString);
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Renderização do componente
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Cadastro de Bairros
        </h1>

        {/* Mensagem de erro */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Formulário de cadastro/edição */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="mb-4">
            <label
              htmlFor="nome"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nome do Bairro
            </label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={bairroAtual.nome}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite o nome do bairro"
              required
            />
          </div>

          {editando && (
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  id="ativo"
                  name="ativo"
                  checked={bairroAtual.ativo}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Ativo</span>
              </label>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Salvando..." : editando ? "Atualizar" : "Cadastrar"}
            </button>

            {editando && (
              <button
                type="button"
                onClick={handleCancelar}
                className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        {/* Barra de busca */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <div className="flex-grow">
              <div className="relative">
                <input
                  type="text"
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && buscarBairrosPorTermo()
                  }
                  placeholder="Buscar bairros..."
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
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
            <button
              onClick={buscarBairrosPorTermo}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Buscar
            </button>
            {termoBusca && (
              <button
                onClick={() => {
                  setTermoBusca("");
                  fetchAll();
                }}
                className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Tabela de bairros */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Nome
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Criado em
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    Carregando...
                  </td>
                </tr>
              ) : bairros.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    Nenhum bairro encontrado.
                  </td>
                </tr>
              ) : (
                bairros.map((bairro) => (
                  <tr key={bairro.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bairro.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bairro.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          bairro.ativo
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {bairro.ativo ? "Ativo" : "Inativo"}
                      </span>
                      <button
                        onClick={() => handleToggleAtivo(bairro)}
                        className="ml-2 text-xs text-blue-600 hover:text-blue-900"
                      >
                        Alternar
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatarData(bairro.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditar(bairro)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="Editar"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleExcluir(bairro.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Excluir"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Bairros;
