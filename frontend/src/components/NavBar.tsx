import React from "react";
import { Bell, Search, Menu, X } from "lucide-react";

interface NavbarProps {
  toggleSidebar: () => void;
  isSidebarOpen?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({
  toggleSidebar,
  isSidebarOpen = true,
}) => {
  return (
    <div className="h-16 fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-20 px-4">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 mr-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label={
              isSidebarOpen ? "Fechar menu lateral" : "Abrir menu lateral"
            }
          >
            {isSidebarOpen ? (
              <X size={20} className="text-gray-600" />
            ) : (
              <Menu size={20} className="text-gray-600" />
            )}
          </button>
          <div className="relative">
            <input
              type="text"
              placeholder="Pesquisar..."
              className="pl-9 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <Search size={18} />
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <button className="p-2 relative rounded-full hover:bg-gray-100 mr-2">
            <Bell size={20} />
            <span className="absolute top-1 right-1 bg-red-500 rounded-full w-2 h-2"></span>
          </button>

          <div className="flex items-center ml-4">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
              U
            </div>
            <span className="ml-2 font-medium hidden md:block">Usuário</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
