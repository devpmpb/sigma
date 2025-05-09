import React, { useState, KeyboardEvent } from "react";

interface SearchBarProps {
  /**
   * Placeholder para o campo de busca
   */
  placeholder?: string;

  /**
   * Função chamada quando a busca é acionada
   */
  onSearch: (termo: string) => void;

  /**
   * Valor inicial do campo de busca
   */
  initialValue?: string;

  /**
   * Se está carregando
   */
  loading?: boolean;

  /**
   * Classes CSS adicionais para o componente
   */
  className?: string;
}

/**
 * Componente de barra de busca reutilizável
 */
const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Buscar...",
  onSearch,
  initialValue = "",
  loading = false,
  className = "",
}) => {
  const [termo, setTermo] = useState(initialValue);

  const handleSearch = () => {
    onSearch(termo);
  };

  const handleClear = () => {
    setTermo("");
    onSearch("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-grow">
        <div className="relative">
          <input
            type="text"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
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
        onClick={handleSearch}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
      >
        {loading ? "Buscando..." : "Buscar"}
      </button>
      {termo && (
        <button
          onClick={handleClear}
          className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Limpar
        </button>
      )}
    </div>
  );
};

export default SearchBar;
