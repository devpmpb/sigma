import React, { useEffect, useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import useMenuItems from "../../hooks/useMenuItems";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { sidebarItems } = useMenuItems();
  const router = useRouter();
  
  // Estado local para forçar uma re-renderização quando a rota muda
  const [currentPath, setCurrentPath] = useState(router.state.location.pathname);

  // Atualiza o estado local quando a rota muda
  useEffect(() => {
    // Esta função será chamada sempre que a navegação for iniciada
    const onBeforeNavigate = () => {
      console.log("Navegação iniciada");
    };

    // Esta função será chamada sempre que a navegação for concluída
    const onNavigationComplete = () => {
      console.log("Navegação concluída, novo caminho:", router.state.location.pathname);
      setCurrentPath(router.state.location.pathname);
    };

    // Inscreve-se nos eventos de navegação
    const unsubscribe1 = router.subscribe("onBeforeLoad", onBeforeNavigate);
    const unsubscribe2 = router.subscribe("onNavigation", onNavigationComplete);
    
    // Evento adicional para garantir que capture todas as mudanças
    const unsubscribe3 = router.subscribe("onResolved", onNavigationComplete);

    console.log("Caminho atual ao montar o componente:", router.state.location.pathname);
    
    // Cancela a inscrição quando o componente é desmontado
    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    };
  }, [router]);

  // Função auxiliar para verificar se um link está ativo
  const isLinkActive = (path: string) => {
    // Tratamento especial para a rota raiz: apenas ativa quando estamos exatamente na rota raiz
    if (path === '/') {
      return currentPath === '/';
    }
    
    // Para outras rotas: ativa quando estamos na rota exata ou em uma sub-rota
    return currentPath === path || 
           (path !== '/' && currentPath.startsWith(`${path}/`));
  };

  return (
    <div
      className={`sidebar bg-gray-800 text-white shadow-lg fixed transition-all duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <nav className="mt-4">
        <ul>
          {sidebarItems.map((item) => {
            const active = isLinkActive(item.path);
            
            return (
              <li key={item.id} className="mb-1">
                <Link
                  to={item.path}
                  onClick={() => {
                    // Força atualização do estado imediatamente após o clique
                    setTimeout(() => {
                      const newPath = router.state.location.pathname;
                      console.log(`Link clicked: ${item.title}, New path: ${newPath}`);
                      setCurrentPath(newPath);
                    }, 0);
                  }}
                  className={`flex items-center px-4 py-3 hover:bg-gray-700 transition-colors ${
                    active ? "link-active" : ""
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              </li>
            );
          })}
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