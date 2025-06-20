// frontend/src/pages/cadastros/comum/usuario/Usuarios.tsx
import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import userService, {
  UsuarioComPerfil,
} from "../../../../services/admin/userService";
import {
  SearchBar,
  StatusBadge,
  ActionButtons,
} from "../../../../components/common";
import { formatarData } from "../../../../utils/formatters";
import { TipoPerfilBackend } from "../../../../types";
import { usePermissions } from "../../../../hooks/usePermissions";
import { Users, UserPlus, Shield, Mail, Calendar } from "lucide-react";

/**
 * Componente de listagem de usuários
 * Restrito apenas para administradores
 */
const Usuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<UsuarioComPerfil[]>([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<
    UsuarioComPerfil[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<
    "todos" | "ativo" | "inativo"
  >("todos");
  const [filtroPerfil, setFiltroPerfil] = useState<TipoPerfilBackend | "todos">(
    "todos"
  );

  const { hasPermission } = usePermissions();

  // Verificar se o usuário tem permissão para acessar usuários
  const canView = hasPermission("admin", "view");
  const canEdit = hasPermission("admin", "edit");
  const canDelete = hasPermission("admin", "delete");

  // Carregar usuários
  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      setUsuarios(data);
      setUsuariosFiltrados(data);
    } catch (err: any) {
      console.error("Erro ao carregar usuários:", err);
      setError("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Filtrar usuários
  useEffect(() => {
    let usuariosFiltrados = [...usuarios];

    // Filtro por termo de busca
    if (termoBusca) {
      usuariosFiltrados = usuariosFiltrados.filter(
        (usuario) =>
          usuario.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
          usuario.email.toLowerCase().includes(termoBusca.toLowerCase())
      );
    }

    // Filtro por status
    if (filtroStatus !== "todos") {
      usuariosFiltrados = usuariosFiltrados.filter((usuario) =>
        filtroStatus === "ativo" ? usuario.ativo : !usuario.ativo
      );
    }

    // Filtro por perfil
    if (filtroPerfil !== "todos") {
      usuariosFiltrados = usuariosFiltrados.filter(
        (usuario) => usuario.perfil.nome === filtroPerfil
      );
    }

    setUsuariosFiltrados(usuariosFiltrados);
  }, [usuarios, termoBusca, filtroStatus, filtroPerfil]);

  // Alternar status do usuário
  const handleToggleStatus = async (id: number, novoStatus: boolean) => {
    try {
      await userService.toggleStatus(id, novoStatus);
      await fetchUsuarios();
    } catch (err: any) {
      console.error("Erro ao alterar status:", err);
      alert("Erro ao alterar status do usuário");
    }
  };

  // Resetar senha do usuário
  const handleResetSenha = async (id: number, nome: string) => {
    if (!window.confirm(`Tem certeza que deseja resetar a senha de ${nome}?`)) {
      return;
    }

    try {
      await userService.resetPassword(id);
      alert("Senha resetada com sucesso! Nova senha: 123456");
    } catch (err: any) {
      console.error("Erro ao resetar senha:", err);
      alert("Erro ao resetar senha");
    }
  };

  // Função para obter cor do perfil
  const getPerfilColor = (perfil: TipoPerfilBackend) => {
    switch (perfil) {
      case TipoPerfilBackend.ADMIN:
        return "bg-red-100 text-red-800";
      case TipoPerfilBackend.OBRAS:
        return "bg-blue-100 text-blue-800";
      case TipoPerfilBackend.AGRICULTURA:
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Verificar acesso
  if (!canView) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Acesso Negado
          </h2>
          <p className="text-red-600">
            Você não possui permissão para visualizar usuários do sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Usuários do Sistema
              </h1>
              <p className="text-gray-600">
                Gerencie usuários e suas permissões
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right text-sm text-gray-500">
              <p>{usuariosFiltrados.length} usuários encontrados</p>
              <p>{usuarios.filter((u) => u.ativo).length} ativos</p>
            </div>

            <Link
              to="/cadastros/comum/usuarios/novo"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Novo Usuário
            </Link>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <SearchBar
              value={termoBusca}
              onChange={setTermoBusca}
              placeholder="Buscar por nome ou email..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Perfil
            </label>
            <select
              value={filtroPerfil}
              onChange={(e) => setFiltroPerfil(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos os perfis</option>
              <option value={TipoPerfilBackend.ADMIN}>Administrador</option>
              <option value={TipoPerfilBackend.OBRAS}>Obras</option>
              <option value={TipoPerfilBackend.AGRICULTURA}>Agricultura</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Carregando usuários...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Lista de usuários */}
      {!loading && !error && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Perfil
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criado em
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {usuario.nome
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .substring(0, 2)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {usuario.nome}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {usuario.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPerfilColor(
                          usuario.perfil.nome
                        )}`}
                      >
                        {usuario.perfil.nome}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge ativo={usuario.ativo} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {usuario.ultimoLogin ? (
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                          {formatarData(usuario.ultimoLogin)}
                        </div>
                      ) : (
                        <span className="text-gray-400">Nunca logou</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatarData(usuario.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Link
                          to={`/cadastros/comum/usuarios/${usuario.id}`}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          Editar
                        </Link>

                        {canEdit && (
                          <>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() =>
                                handleResetSenha(usuario.id, usuario.nome)
                              }
                              className="text-orange-600 hover:text-orange-900 text-sm font-medium"
                            >
                              Reset Senha
                            </button>

                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() =>
                                handleToggleStatus(usuario.id, !usuario.ativo)
                              }
                              className={`text-sm font-medium ${
                                usuario.ativo
                                  ? "text-red-600 hover:text-red-900"
                                  : "text-green-600 hover:text-green-900"
                              }`}
                            >
                              {usuario.ativo ? "Desativar" : "Ativar"}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {usuariosFiltrados.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum usuário encontrado</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Usuarios;
