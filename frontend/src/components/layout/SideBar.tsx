import React from "react";
import { Link } from "@tanstack/react-router";
import useMenuItems from "../../hooks/useMenuItems";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { sidebarItems } = useMenuItems();

  return (
    <div
      className={`sidebar bg-gray-800 text-white shadow-lg fixed transition-all duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <nav className="mt-4">
        <ul>
          {sidebarItems.map((item) => (
            <li key={item.id} className="mb-1">
              <Link
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 hover:bg-gray-700 transition-colors ${
                    isActive ? "bg-gray-700 border-l-4 border-blue-500" : ""
                  }`
                }
              >
                <item.icon className="mr-3 h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-500 mr-2"></div>
          <span>Usuário</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;