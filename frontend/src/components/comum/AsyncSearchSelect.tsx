import React, { useState, useEffect, useRef } from "react";

interface Option<T = any> {
  id: number;
  label: string;
  subLabel?: string;
  item: T; // Store the full item
}

interface AsyncSearchSelectProps<T> {
  label: string;
  value: number | null;
  onChange: (value: number | null, selectedItem?: T) => void;
  searchFunction: (termo: string) => Promise<T[]>;
  getOptionLabel: (item: T) => string;
  getOptionSubLabel?: (item: T) => string;
  getId: (item: T) => number;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  minSearchLength?: number;
  initialLabel?: string; // Label to display when value is set initially
  initialSubLabel?: string; // SubLabel to display when value is set initially
}

const AsyncSearchSelect = <T,>({
  label,
  value,
  onChange,
  searchFunction,
  getOptionLabel,
  getOptionSubLabel,
  getId,
  placeholder = "Digite para buscar...",
  required = false,
  disabled = false,
  error,
  minSearchLength = 2,
  initialLabel,
  initialSubLabel,
}: AsyncSearchSelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  const containerRef = useRef<HTMLDivElement>(null);

  // Set initial selected option or clear when value changes
  useEffect(() => {
    if (value && initialLabel) {
      // If we have both value and initialLabel, set it directly without fetching
      setSelectedOption({
        id: value,
        label: initialLabel,
        subLabel: initialSubLabel,
        item: null as any, // We don't have the full item, but that's okay
      });
    } else if (!value) {
      setSelectedOption(null);
    }
  }, [value, initialLabel, initialSubLabel]);

  // Debounced search
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (searchTerm.length >= minSearchLength) {
      const timer = setTimeout(() => {
        performSearch(searchTerm);
      }, 300); // 300ms debounce

      setDebounceTimer(timer);
    } else if (searchTerm.length === 0) {
      setOptions([]);
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const performSearch = async (termo: string) => {
    setLoading(true);
    try {
      const results = await searchFunction(termo);
      const mappedOptions = results.map((item) => ({
        id: getId(item),
        label: getOptionLabel(item),
        subLabel: getOptionSubLabel ? getOptionSubLabel(item) : undefined,
        item: item, // Store the full item
      }));
      setOptions(mappedOptions);
    } catch (error) {
      console.error("Erro ao buscar opções:", error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(true);
  };

  const handleOptionClick = (option: Option<T>) => {
    setSelectedOption(option);
    onChange(option.id, option.item);
    setSearchTerm("");
    setIsOpen(false);
    setOptions([]);
  };

  const handleClear = () => {
    setSelectedOption(null);
    onChange(null);
    setSearchTerm("");
    setOptions([]);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (searchTerm.length >= minSearchLength && options.length === 0) {
      performSearch(searchTerm);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Selected Value Display */}
      {selectedOption && !isOpen ? (
        <div className="flex items-center gap-2">
          <div
            className={`flex-1 px-3 py-2 border rounded-md bg-gray-50 ${
              disabled ? "cursor-not-allowed" : ""
            }`}
          >
            <div className="font-medium text-gray-900">
              {selectedOption.label}
            </div>
            {selectedOption.subLabel && (
              <div className="text-sm text-gray-500">
                {selectedOption.subLabel}
              </div>
            )}
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
              title="Limpar seleção"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? "border-red-500" : "border-gray-300"
            } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
          />

          {/* Search Icon */}
          <div className="absolute right-3 top-2.5 text-gray-400">
            {loading ? (
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
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
            )}
          </div>
        </div>
      )}

      {/* Dropdown Options */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading && (
            <div className="px-4 py-3 text-center text-gray-500">
              Buscando...
            </div>
          )}

          {!loading && searchTerm.length < minSearchLength && (
            <div className="px-4 py-3 text-center text-gray-500">
              Digite pelo menos {minSearchLength} caracteres para buscar
            </div>
          )}

          {!loading &&
            searchTerm.length >= minSearchLength &&
            options.length === 0 && (
              <div className="px-4 py-3 text-center text-gray-500">
                Nenhum resultado encontrado
              </div>
            )}

          {!loading &&
            options.length > 0 &&
            options.map((option) => (
              <div
                key={option.id}
                onClick={() => handleOptionClick(option)}
                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900">{option.label}</div>
                {option.subLabel && (
                  <div className="text-sm text-gray-500">{option.subLabel}</div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Error Message */}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

      {/* Helper Text */}
      {!error && !selectedOption && !isOpen && (
        <p className="mt-1 text-sm text-gray-500">
          Digite para pesquisar e selecionar uma opção
        </p>
      )}
    </div>
  );
};

export default AsyncSearchSelect;
