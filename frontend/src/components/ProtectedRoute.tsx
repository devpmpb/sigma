import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import usePermissions from "../hooks/usePermissions";
import { ModuleType, ActionType } from "../types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredModule?: ModuleType;
  requiredAction?: ActionType;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredModule,
  requiredAction = "view",
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const location = useLocation();

  if (isLoading) {
    // Mostrar indicador de carregamento
    return (
      <div className="flex items-center justify-center h-screen">
        Carregando...
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirecionar para login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar permissões se necessário
  if (requiredModule && !hasPermission(requiredModule, requiredAction)) {
    // Redirecionar para página de acesso negado
    return <Navigate to="/acesso-negado" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
