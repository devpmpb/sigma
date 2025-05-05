import React from "react";
import { useAuth } from "../context/AuthContext";
import { Home, FileText, Users, Settings } from "lucide-react";

const Inicio: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tela Inicial</h1>
        <div className="text-sm text-gray-500">
          Bem-vindo, {user?.name || "Usuário"}!
        </div>
      </div>

      {/* Resumo do Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Módulo de Obras</h3>
            <div className="p-2 rounded-full bg-blue-100">
              <Home className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-gray-500 text-sm mb-3">
            Cadastros e movimentos relacionados a obras e infraestrutura.
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Cadastros:</span>
            <span className="font-medium">25</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Movimentos:</span>
            <span className="font-medium">48</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Módulo de Agricultura</h3>
            <div className="p-2 rounded-full bg-green-100">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-gray-500 text-sm mb-3">
            Cadastros e movimentos relacionados ao setor agrícola.
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Cadastros:</span>
            <span className="font-medium">32</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Movimentos:</span>
            <span className="font-medium">56</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Módulos Comuns</h3>
            <div className="p-2 rounded-full bg-purple-100">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-gray-500 text-sm mb-3">
            Cadastros e movimentos comuns a todos os setores.
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Cadastros:</span>
            <span className="font-medium">18</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Movimentos:</span>
            <span className="font-medium">29</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Configurações</h3>
            <div className="p-2 rounded-full bg-gray-100">
              <Settings className="h-5 w-5 text-gray-600" />
            </div>
          </div>
          <p className="text-gray-500 text-sm mb-3">
            Configurações do sistema e preferências.
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Usuários:</span>
            <span className="font-medium">12</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Última atualização:</span>
            <span className="font-medium">2 dias atrás</span>
          </div>
        </div>
      </div>

      {/* Atividades Recentes */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="font-bold text-lg mb-4">Atividades Recentes</h2>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <Home className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Novo cadastro adicionado em Obras</p>
              <p className="text-sm text-gray-500">Há 3 horas atrás</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="bg-green-100 p-2 rounded-full mr-3">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium">Movimento registrado em Agricultura</p>
              <p className="text-sm text-gray-500">Ontem às 15:30</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="bg-purple-100 p-2 rounded-full mr-3">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium">Cadastro comum atualizado</p>
              <p className="text-sm text-gray-500">Há 2 dias atrás</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mensagem de Permissões */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="font-bold text-lg mb-4">Suas Permissões</h2>
        <p className="text-gray-600 mb-4">
          Você tem acesso aos seguintes módulos:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user?.sector === "admin" && (
            <>
              <div className="flex items-center p-3 bg-blue-50 rounded">
                <div className="p-2 bg-blue-100 rounded-full mr-3">
                  <Home className="h-4 w-4 text-blue-600" />
                </div>
                <span>Módulo de Obras (Completo)</span>
              </div>

              <div className="flex items-center p-3 bg-green-50 rounded">
                <div className="p-2 bg-green-100 rounded-full mr-3">
                  <FileText className="h-4 w-4 text-green-600" />
                </div>
                <span>Módulo de Agricultura (Completo)</span>
              </div>
            </>
          )}

          {(user?.sector === "obras" || user?.sector === "admin") && (
            <div className="flex items-center p-3 bg-blue-50 rounded">
              <div className="p-2 bg-blue-100 rounded-full mr-3">
                <Home className="h-4 w-4 text-blue-600" />
              </div>
              <span>
                Módulo de Obras {user?.sector !== "admin" && "(Parcial)"}
              </span>
            </div>
          )}

          {(user?.sector === "agricultura" || user?.sector === "admin") && (
            <div className="flex items-center p-3 bg-green-50 rounded">
              <div className="p-2 bg-green-100 rounded-full mr-3">
                <FileText className="h-4 w-4 text-green-600" />
              </div>
              <span>
                Módulo de Agricultura {user?.sector !== "admin" && "(Parcial)"}
              </span>
            </div>
          )}

          <div className="flex items-center p-3 bg-purple-50 rounded">
            <div className="p-2 bg-purple-100 rounded-full mr-3">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <span>
              Módulos Comuns {user?.sector !== "admin" && "(Somente Leitura)"}
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-4">
          Para solicitar acesso a outros módulos, entre em contato com o
          administrador do sistema.
        </p>
      </div>
    </div>
  );
};

export default Inicio;
