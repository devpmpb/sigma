// frontend/src/components/endereco/EnderecoLista.tsx
import React, { useState } from "react";
import { Endereco, TipoEndereco } from "../../services/common/enderecoService";
import { enderecoService } from "../../services";

interface EnderecoListaProps {
  enderecos: Endereco[];
  loading?: boolean;
  onEditar?: (endereco: Endereco) => void;
  onRemover?: (enderecoId: number) => void;
  onDefinirPrincipal?: (enderecoId: number) => void;
  showActions?: boolean;
  className?: string;
}

interface EnderecoItemProps {
  endereco: Endereco;
  onEditar?: (endereco: Endereco) => void;
  onRemover?: (enderecoId: number) => void;
  onDefinirPrincipal?: (enderecoId: number) => void;
  showActions: boolean;
}

const EnderecoItem: React.FC<EnderecoItemProps> = ({
  endereco,
  onEditar,
  onRemover,
  onDefinirPrincipal,
  showActions,
}) => {
  const [removendo, setRemovendo] = useState(false);
  const [definindoPrincipal, setDefinindoPrincipal] = useState(false);

  const handleRemover = async () => {
    if (
      !onRemover ||
      !confirm("Tem certeza que deseja remover este endereço?")
    ) {
      return;
    }

    setRemovendo(true);
    try {
      await onRemover(endereco.id);
    } finally {
      setRemovendo(false);
    }
  };

  const handleDefinirPrincipal = async () => {
    if (!onDefinirPrincipal) return;

    setDefinindoPrincipal(true);
    try {
      await onDefinirPrincipal(endereco.id);
    } finally {
      setDefinindoPrincipal(false);
    }
  };

  const getTipoIcon = (tipo: TipoEndereco): string => {
    switch (tipo) {
      case TipoEndereco.RESIDENCIAL:
        return "🏠";
      case TipoEndereco.COMERCIAL:
        return "🏢";
      case TipoEndereco.RURAL:
        return "🌾";
      case TipoEndereco.CORRESPONDENCIA:
        return "📬";
      default:
        return "📍";
    }
  };

  const getTipoColor = (tipo: TipoEndereco): string => {
    switch (tipo) {
      case TipoEndereco.RESIDENCIAL:
        return "bg-blue-100 text-blue-800";
      case TipoEndereco.COMERCIAL:
        return "bg-green-100 text-green-800";
      case TipoEndereco.RURAL:
        return "bg-emerald-100 text-emerald-800";
      case TipoEndereco.CORRESPONDENCIA:
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div
      className={`p-4 border rounded-lg ${
        endereco.principal
          ? "border-yellow-300 bg-yellow-50"
          : "border-gray-200 bg-white"
      } hover:shadow-sm transition-shadow`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoColor(
              endereco.tipoEndereco
            )}`}
          >
            {getTipoIcon(endereco.tipoEndereco)} {endereco.tipoEndereco}
          </span>
          {endereco.principal && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              ⭐ Principal
            </span>
          )}
        </div>

        {showActions && (
          <div className="flex items-center space-x-2">
            {!endereco.principal && onDefinirPrincipal && (
              <button
                onClick={handleDefinirPrincipal}
                disabled={definindoPrincipal}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                title="Definir como principal"
              >
                {definindoPrincipal ? "⏳" : "⭐"}
              </button>
            )}

            {onEditar && (
              <button
                onClick={() => onEditar(endereco)}
                className="text-sm text-gray-600 hover:text-gray-800"
                title="Editar endereço"
              >
                ✏️
              </button>
            )}

            {onRemover && (
              <button
                onClick={handleRemover}
                disabled={removendo}
                className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                title="Remover endereço"
              >
                {removendo ? "⏳" : "🗑️"}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="text-gray-900 font-medium mb-2">
        {enderecoService.formatarEnderecoCompleto(endereco)}
      </div>

      {endereco.coordenadas && (
        <div className="text-sm text-gray-500 mb-2">
          📍 {endereco.coordenadas}
        </div>
      )}

      {endereco.propriedade && (
        <div className="text-sm text-green-600 mb-2">
          🏡 Propriedade: {endereco.propriedade.nome}
        </div>
      )}

      <div className="text-xs text-gray-400">
        Cadastrado em {new Date(endereco.createdAt).toLocaleDateString("pt-BR")}
        {endereco.createdAt !== endereco.updatedAt && (
          <span>
            {" "}
            • Atualizado em{" "}
            {new Date(endereco.updatedAt).toLocaleDateString("pt-BR")}
          </span>
        )}
      </div>
    </div>
  );
};

export const EnderecoLista: React.FC<EnderecoListaProps> = ({
  enderecos,
  loading = false,
  onEditar,
  onRemover,
  onDefinirPrincipal,
  showActions = true,
  className = "",
}) => {
  const [filtroTipo, setFiltroTipo] = useState<TipoEndereco | "TODOS">("TODOS");
  const [mostrarApenasPrincipal, setMostrarApenasPrincipal] = useState(false);

  // Filtrar endereços
  const enderecosFiltrados = enderecos.filter((endereco) => {
    const passaTipoFiltro =
      filtroTipo === "TODOS" || endereco.tipoEndereco === filtroTipo;
    const passaPrincipalFiltro = !mostrarApenasPrincipal || endereco.principal;

    return passaTipoFiltro && passaPrincipalFiltro;
  });

  // Ordenar: principal primeiro, depois por data de criação
  const enderecosOrdenados = [...enderecosFiltrados].sort((a, b) => {
    if (a.principal && !b.principal) return -1;
    if (!a.principal && b.principal) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const tiposEndereco = enderecoService.getTiposEndereco();

  if (loading) {
    return (
      <div className={`flex justify-center items-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Carregando endereços...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-lg font-medium text-gray-900">
            Endereços ({enderecos.length})
          </h4>
          {enderecos.length > 0 && (
            <p className="text-sm text-gray-500">
              {enderecos.filter((e) => e.principal).length > 0 ? "⭐ " : ""}
              {enderecosOrdenados.length}{" "}
              {enderecosOrdenados.length !== enderecos.length
                ? "filtrados"
                : "total"}
            </p>
          )}
        </div>

        {enderecos.length > 1 && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label
                htmlFor="filtroTipo"
                className="text-sm font-medium text-gray-700"
              >
                Tipo:
              </label>
              <select
                id="filtroTipo"
                value={filtroTipo}
                onChange={(e) =>
                  setFiltroTipo(e.target.value as TipoEndereco | "TODOS")
                }
                className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="TODOS">Todos</option>
                {tiposEndereco.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                id="apenasPrincipal"
                type="checkbox"
                checked={mostrarApenasPrincipal}
                onChange={(e) => setMostrarApenasPrincipal(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="apenasPrincipal"
                className="ml-2 text-sm text-gray-700"
              >
                Apenas principal
              </label>
            </div>
          </div>
        )}
      </div>

      {enderecosOrdenados.length === 0 ? (
        <div className="text-center py-8">
          {enderecos.length === 0 ? (
            <div>
              <div className="text-4xl mb-4">📍</div>
              <h5 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum endereço cadastrado
              </h5>
              <p className="text-gray-500">
                Esta pessoa ainda não possui endereços cadastrados.
              </p>
            </div>
          ) : (
            <div>
              <div className="text-4xl mb-4">🔍</div>
              <h5 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum endereço encontrado
              </h5>
              <p className="text-gray-500 mb-4">
                Não há endereços que correspondam aos filtros aplicados.
              </p>
              <button
                onClick={() => {
                  setFiltroTipo("TODOS");
                  setMostrarApenasPrincipal(false);
                }}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {enderecosOrdenados.map((endereco) => (
            <EnderecoItem
              key={endereco.id}
              endereco={endereco}
              onEditar={onEditar}
              onRemover={onRemover}
              onDefinirPrincipal={onDefinirPrincipal}
              showActions={showActions}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Componente simplificado apenas para exibição (sem ações)
export const EnderecoListaReadonly: React.FC<{
  enderecos: Endereco[];
  loading?: boolean;
  className?: string;
}> = ({ enderecos, loading, className }) => {
  return (
    <EnderecoLista
      enderecos={enderecos}
      loading={loading}
      showActions={false}
      className={className}
    />
  );
};

// Componente para mostrar apenas o endereço principal
export const EnderecoPrincipal: React.FC<{
  endereco: Endereco | null;
  loading?: boolean;
  onEditar?: (endereco: Endereco) => void;
  className?: string;
}> = ({ endereco, loading, onEditar, className }) => {
  if (loading) {
    return (
      <div
        className={`p-4 border border-gray-200 rounded-lg bg-gray-50 ${
          className || ""
        }`}
      >
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-gray-500">Carregando endereço...</span>
        </div>
      </div>
    );
  }

  if (!endereco) {
    return (
      <div
        className={`p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50 ${
          className || ""
        }`}
      >
        <div className="text-center text-gray-500">
          📍 Nenhum endereço principal definido
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 border border-yellow-300 rounded-lg bg-yellow-50 ${
        className || ""
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <span className="text-sm font-medium text-yellow-800">
              📍 Endereço Principal
            </span>
            {onEditar && (
              <button
                onClick={() => onEditar(endereco)}
                className="ml-2 text-sm text-yellow-700 hover:text-yellow-900"
                title="Editar endereço"
              >
                ✏️
              </button>
            )}
          </div>
          <div className="text-gray-900 font-medium">
            {enderecoService.formatarEnderecoCompleto(endereco)}
          </div>
          {endereco.coordenadas && (
            <div className="text-sm text-gray-600 mt-1">
              🌐 {endereco.coordenadas}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnderecoLista;
