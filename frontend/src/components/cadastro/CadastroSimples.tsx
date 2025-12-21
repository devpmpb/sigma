import React, { useState, useEffect, ReactNode } from "react";
import { formatarData } from "../../utils/formatters";
import useApiService from "../../hooks/useApiService";
import { ActionButtons, SearchBar, StatusBadge } from "../comum";

interface CadastroSimplesProps<T, R> {
  /**
   * Título da página
   */
  titulo: string;

  /**
   * Setor do cadastro (obras, agricultura, comum)
   */
  setor: string;

  /**
   * Tipo de cadastro
   */
  tipo: string;

  /**
   * Serviço de API para o cadastro
   */
  service: any;

  /**
   * Valor inicial para o formulário
   */
  valorInicial: R;

  /**
   * Campo a ser exibido na listagem (ex: "nome", "descricao")
   */
  campoExibicao: keyof T;

  /**
   * Label do campo principal do formulário
   */
  labelCampo: string;

  /**
   * Placeholder para o campo de busca
   */
  placeholderBusca?: string;

  /**
   * Campos adicionais do formulário
   */
  camposAdicionais?: ReactNode;

  /**
   * Colunas extras para a tabela
   */
  colunasExtras?: {
    titulo: string;
    render: (item: T) => ReactNode;
  }[];
}

/**
 * Componente base para cadastros simples
 * Inclui formulário e listagem na mesma página
 */
function CadastroSimples<
  T extends { id: number; ativo: boolean; createdAt: string },
  R extends Record<string, any>
>({
  titulo,
  setor,
  tipo,
  service,
  valorInicial,
  campoExibicao,
  labelCampo,
  placeholderBusca,
  camposAdicionais,
  colunasExtras = [],
}: CadastroSimplesProps<T, R>) {
  // Estados locais
  const [termoBusca, setTermoBusca] = useState("");
  const [editando, setEditando] = useState(false);
  const [itemAtual, setItemAtual] = useState<R>(valorInicial);
  const [idAtual, setIdAtual] = useState<number | null>(null);

  // Hook para serviço de API
  const {
    data: itens,
    loading,
    error,
    fetchAll,
    searchByTerm,
    create,
    update,
    toggleStatus,
    remove,
    clearItem,
  } = useApiService<T, R>(service);

  // Carregar dados ao iniciar o componente
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Função para buscar por termo
  const buscarPorTermo = (termo: string) => {
    setTermoBusca(termo);
    searchByTerm(termo);
  };

  // Funções de manipulação de formulário
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setItemAtual((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação básica
    const camposPrincipais = Object.entries(itemAtual).filter(
      ([key]) => key !== "ativo"
    );

    for (const [key, value] of camposPrincipais) {
      if (typeof value === "string" && !value.trim()) {
        alert(`O campo ${key} é obrigatório.`);
        return;
      }
    }

    let success = false;

    if (editando && idAtual) {
      // Atualiza o item existente
      const result = await update(idAtual, itemAtual);
      success = !!result;

      if (success) alert(`${tipo} atualizado com sucesso!`);
    } else {
      // Cria um novo item
      const result = await create(itemAtual);
      success = !!result;

      if (success) alert(`${tipo} cadastrado com sucesso!`);
    }

    if (success) {
      // Limpar formulário e recarregar lista
      resetForm();
      fetchAll();
    }
  };

  // Funções para editar e excluir
  const handleEditar = (item: T) => {
    setIdAtual(item.id);

    // Converter o item para o formato do DTO
    const itemDTO = { ...item } as unknown as R;
    delete (itemDTO as any).id;
    delete (itemDTO as any).createdAt;
    delete (itemDTO as any).updatedAt;

    setItemAtual(itemDTO);
    setEditando(true);
  };

  const handleExcluir = async (id: number) => {
    if (!window.confirm(`Tem certeza que deseja excluir este ${tipo}?`)) return;

    const success = await remove(id);

    if (success) {
      alert(`${tipo} excluído com sucesso!`);
      fetchAll();
    }
  };

  // Função para alternar status ativo/inativo
  const handleToggleAtivo = async (item: T) => {
    const result = await toggleStatus(item.id, !item.ativo);

    if (result) fetchAll();
  };

  // Função para cancelar edição
  const handleCancelar = () => {
    resetForm();
  };

  // Função para limpar o formulário
  const resetForm = () => {
    setIdAtual(null);
    setItemAtual(valorInicial);
    setEditando(false);
    clearItem();
  };

  // Renderização do componente
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg p-6">
        {/* Cabeçalho com breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{titulo}</h1>
          <div className="text-sm breadcrumbs">
            <ul className="flex">
              <li className="text-gray-500">Início</li>
              <li className="before:content-['>'] before:mx-2 text-gray-500">
                Cadastros
              </li>
              <li className="before:content-['>'] before:mx-2 text-gray-500">
                {setor}
              </li>
              <li className="before:content-['>'] before:mx-2 text-gray-700">
                {tipo}
              </li>
            </ul>
          </div>
        </div>

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
              htmlFor={campoExibicao.toString()}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {labelCampo}
            </label>
            <input
              type="text"
              id={campoExibicao.toString()}
              name={campoExibicao.toString()}
              value={(itemAtual as any)[campoExibicao.toString()] || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Digite ${labelCampo.toLowerCase()}`}
              required
            />
          </div>

          {/* Campos adicionais (se existirem) */}
          {camposAdicionais}

          {/* Campo de ativo para edição */}
          {editando && (
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  id="ativo"
                  name="ativo"
                  checked={(itemAtual as any).ativo || false}
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
          <SearchBar
            placeholder={placeholderBusca || `Buscar ${tipo.toLowerCase()}...`}
            initialValue={termoBusca}
            onSearch={buscarPorTermo}
            loading={loading}
          />
        </div>

        {/* Tabela de itens */}
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
                  {labelCampo}
                </th>

                {/* Colunas extras */}
                {colunasExtras.map((coluna, index) => (
                  <th
                    key={index}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {coluna.titulo}
                  </th>
                ))}

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
                    colSpan={5 + colunasExtras.length}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    Carregando...
                  </td>
                </tr>
              ) : itens.length === 0 ? (
                <tr>
                  <td
                    colSpan={5 + colunasExtras.length}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    Nenhum {tipo.toLowerCase()} encontrado.
                  </td>
                </tr>
              ) : (
                itens.map((item: T) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(item as any)[campoExibicao.toString()]}
                    </td>

                    {/* Células para colunas extras */}
                    {colunasExtras.map((coluna, index) => (
                      <td
                        key={index}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {coluna.render(item)}
                      </td>
                    ))}

                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <StatusBadge
                        ativo={item.ativo}
                        onToggle={() => handleToggleAtivo(item)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatarData(item.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <ActionButtons
                        onEdit={() => handleEditar(item)}
                        onDelete={() => handleExcluir(item.id)}
                      />
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
}

export default CadastroSimples;
