import React, { createContext, useContext, useState, ReactNode } from "react";

interface UIContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;

  isCadastrosDropdownOpen: boolean;
  isMovimentosDropdownOpen: boolean;
  toggleCadastrosDropdown: () => void;
  toggleMovimentosDropdown: () => void;
  closeAllDropdowns: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isCadastrosDropdownOpen, setCadastrosDropdownOpen] =
    useState<boolean>(false);
  const [isMovimentosDropdownOpen, setMovimentosDropdownOpen] =
    useState<boolean>(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleCadastrosDropdown = () => {
    setCadastrosDropdownOpen(!isCadastrosDropdownOpen);
    if (!isCadastrosDropdownOpen) {
      setMovimentosDropdownOpen(false);
    }
  };

  const toggleMovimentosDropdown = () => {
    setMovimentosDropdownOpen(!isMovimentosDropdownOpen);
    if (!isMovimentosDropdownOpen) {
      setCadastrosDropdownOpen(false);
    }
  };

  const closeAllDropdowns = () => {
    setCadastrosDropdownOpen(false);
    setMovimentosDropdownOpen(false);
  };

  return (
    <UIContext.Provider
      value={{
        isSidebarOpen,
        toggleSidebar,
        isCadastrosDropdownOpen,
        isMovimentosDropdownOpen,
        toggleCadastrosDropdown,
        toggleMovimentosDropdown,
        closeAllDropdowns,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = (): UIContextType => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
};

export default UIContext;
