import React, { useRef, useState } from "react";
import {
  Bell,
  Search,
  Menu as MenuIcon,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import useMenuItems from "../hooks/useMenuItems";
import useClickOutside from "../hooks/useClickOutside";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UiContext";
import { MenuGroup, SubMenuItem } from "../config/menuStructure";

const Navbar: React.FC = () => {
  const { user } = useAuth();
  const {
    isSidebarOpen,
    toggleSidebar,
    isCadastrosDropdownOpen,
    isMovimentosDropdownOpen,
    toggleCadastrosDropdown,
    toggleMovimentosDropdown,
    closeAllDropdowns,
  } = useUI();

  const {
    cadastrosGroups,
    movimentosGroups,
    showCadastrosMenu,
    showMovimentosMenu,
  } = useMenuItems();

  // Estados para os submenus
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  // Estado para menu mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileGroups, setExpandedMobileGroups] = useState<{
    [key: string]: boolean;
  }>({});

  // Refs para detectar cliques fora dos dropdowns
  const cadastrosRef = useRef<HTMLDivElement>(null);
  const movimentosRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Hooks para fechar dropdowns quando clicar fora
  useClickOutside(cadastrosRef, () => {
    if (isCadastrosDropdownOpen) closeAllDropdowns();
  });

  useClickOutside(movimentosRef, () => {
    if (isMovimentosDropdownOpen) closeAllDropdowns();
  });

  useClickOutside(mobileMenuRef, () => {
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  });

  // Funções para menu mobile
  const toggleMobileGroup = (groupId: string) => {
    setExpandedMobileGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Renderiza um grupo de menu
  const renderMenuGroup = (group: MenuGroup, closeMenu: () => void) => (
    <div
      key={group.id}
      className="py-2"
      onMouseEnter={() => setHoveredGroup(group.id)}
      onMouseLeave={() => setHoveredGroup(null)}
    >
      <div className="px-4 py-1 text-sm font-semibold text-gray-500 uppercase">
        {group.title}
      </div>
      {group.items.map((item) => (
        <NavLink
          key={item.id}
          to={item.path}
          className={({ isActive }) =>
            `block px-4 py-2 text-sm hover:bg-gray-100 ${
              isActive ? "bg-blue-50 text-blue-600" : "text-gray-700"
            }`
          }
          onClick={closeMenu}
        >
          {item.title}
        </NavLink>
      ))}
    </div>
  );

  // Componente de menu mobile
  const MobileMenu = () => (
    <div
      ref={mobileMenuRef}
      className="mobile-menu md:hidden fixed top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg max-h-[80vh] overflow-y-auto"
    >
      {showCadastrosMenu && (
        <div className="border-b border-gray-100">
          <button
            className="w-full flex items-center justify-between px-4 py-3 font-medium"
            onClick={() => toggleMobileGroup("cadastros")}
          >
            <span>Cadastros</span>
            {expandedMobileGroups["cadastros"] ? (
              <ChevronDown size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
          </button>
          {expandedMobileGroups["cadastros"] && (
            <div className="bg-gray-50 pl-4">
              {cadastrosGroups.map((group) => (
                <div key={group.id} className="mb-2">
                  <button
                    className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium"
                    onClick={() => toggleMobileGroup(`cadastros-${group.id}`)}
                  >
                    <span>{group.title}</span>
                    {expandedMobileGroups[`cadastros-${group.id}`] ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </button>
                  {expandedMobileGroups[`cadastros-${group.id}`] && (
                    <div className="pl-4">
                      {group.items.map((item) => (
                        <NavLink
                          key={item.id}
                          to={item.path}
                          className={({ isActive }) =>
                            `block px-4 py-2 text-sm ${
                              isActive ? "text-blue-600" : "text-gray-700"
                            }`
                          }
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {item.title}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showMovimentosMenu && (
        <div className="border-b border-gray-100">
          <button
            className="w-full flex items-center justify-between px-4 py-3 font-medium"
            onClick={() => toggleMobileGroup("movimentos")}
          >
            <span>Movimentos</span>
            {expandedMobileGroups["movimentos"] ? (
              <ChevronDown size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
          </button>
          {expandedMobileGroups["movimentos"] && (
            <div className="bg-gray-50 pl-4">
              {movimentosGroups.map((group) => (
                <div key={group.id} className="mb-2">
                  <button
                    className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium"
                    onClick={() => toggleMobileGroup(`movimentos-${group.id}`)}
                  >
                    <span>{group.title}</span>
                    {expandedMobileGroups[`movimentos-${group.id}`] ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </button>
                  {expandedMobileGroups[`movimentos-${group.id}`] && (
                    <div className="pl-4">
                      {group.items.map((item) => (
                        <NavLink
                          key={item.id}
                          to={item.path}
                          className={({ isActive }) =>
                            `block px-4 py-2 text-sm ${
                              isActive ? "text-blue-600" : "text-gray-700"
                            }`
                          }
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {item.title}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="navbar h-16 fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-4">
      <div className="flex items-center h-full">
        {/* Botão para toggle do menu lateral */}
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
            <MenuIcon size={20} className="text-gray-600" />
          )}
        </button>

        {/* Logo ou nome do sistema */}
        <div className="mr-8 font-bold text-lg text-gray-800">SIGMA</div>

        {/* Menus dropdown para desktop */}
        <div className="hidden md:flex space-x-2">
          {/* Dropdown Cadastros */}
          {showCadastrosMenu && (
            <div className="relative group" ref={cadastrosRef}>
              <button
                onClick={toggleCadastrosDropdown}
                className="flex items-center px-3 py-2 rounded hover:bg-gray-100"
              >
                <span>Cadastros</span>
                <ChevronDown size={16} className="ml-1" />
              </button>

              {isCadastrosDropdownOpen && (
                <div className="dropdown absolute left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg w-64 py-1 max-h-[80vh] overflow-y-auto">
                  <div className="divide-y divide-gray-100">
                    {cadastrosGroups.map((group) =>
                      renderMenuGroup(group, closeAllDropdowns)
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dropdown Movimentos */}
          {showMovimentosMenu && (
            <div className="relative group" ref={movimentosRef}>
              <button
                onClick={toggleMovimentosDropdown}
                className="flex items-center px-3 py-2 rounded hover:bg-gray-100"
              >
                <span>Movimentos</span>
                <ChevronDown size={16} className="ml-1" />
              </button>

              {isMovimentosDropdownOpen && (
                <div className="dropdown absolute left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg w-64 py-1 max-h-[80vh] overflow-y-auto">
                  <div className="divide-y divide-gray-100">
                    {movimentosGroups.map((group) =>
                      renderMenuGroup(group, closeAllDropdowns)
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botão para menu mobile */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-gray-100 ml-auto"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <MenuIcon size={20} />
        </button>

        {/* Barra de pesquisa - visível apenas em desktop */}
        <div className="hidden md:block relative ml-auto">
          <input
            type="text"
            placeholder="Pesquisar..."
            className="pl-9 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <Search size={18} />
          </div>
        </div>

        {/* Notificações */}
        <button className="p-2 relative rounded-full hover:bg-gray-100 ml-2">
          <Bell size={20} />
          <span className="absolute top-1 right-1 bg-red-500 rounded-full w-2 h-2"></span>
        </button>

        {/* Perfil de usuário */}
        <div className="flex items-center ml-4">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
            {user?.name?.charAt(0) || "U"}
          </div>
          <span className="ml-2 font-medium hidden md:block">
            {user?.name || "Usuário"}
          </span>
        </div>
      </div>

      {/* Menu mobile */}
      {isMobileMenuOpen && <MobileMenu />}
    </div>
  );
};

export default Navbar;
