import React from "react";
import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";

const AcessoNegado: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="text-red-500 mb-6">
        <Shield size={80} />
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
        Acesso Negado
      </h1>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-md">
        Você não tem permissão para acessar esta página. Entre em contato com o
        administrador do sistema para obter acesso.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Voltar para o Início
        </button>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          Voltar para a Página Anterior
        </button>
      </div>
    </div>
  );
};

export default AcessoNegado;
