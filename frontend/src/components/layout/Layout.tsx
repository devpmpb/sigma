import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../layout/NavBar";
import Sidebar from "../layout/SideBar";
import { UIProvider, useUI } from "../../context/UiContext";

// Componente interno que usa o contexto
const LayoutContent: React.FC = () => {
  const { isSidebarOpen } = useUI();

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Navbar />

      <div className="flex flex-1 pt-16">
        <Sidebar isOpen={isSidebarOpen} />
        <main
          className={`flex-1 overflow-y-auto transition-all duration-300 ${
            isSidebarOpen ? "ml-64" : "ml-0"
          }`}
        >
          <div className="container mx-auto p-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

// Componente de Layout que provê o contexto
const Layout: React.FC = () => {
  return (
    <UIProvider>
      <LayoutContent />
    </UIProvider>
  );
};

export default Layout;
