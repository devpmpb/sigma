import React from "react";
import { formatarData } from "../../../../utils/formatters";
import StatusBadge from "../../../../components/common/StatusBadge";
import { Column } from "../../../../components/common/DataTable";
import userService, {
  UsuarioComPerfil,
} from "../../../../services/admin/userService";
import { UsuarioDTO, TipoPerfilBackend } from "../../../../types";
import { CadastroBase } from "../../../../components/cadastro";
import UsuarioForm from "./UsuarioForm";
import { Mail, Calendar, Shield } from "lucide-react";

const Usuarios: React.FC = () => {
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

  // Definição das colunas da tabela
  const columns: Column<UsuarioComPerfil>[] = [
    {
      title: "ID",
      key: "id",
      width: "80px",
      align: "center",
    },
    {
      title: "Usuário",
      key: "nome",
      render: (usuario) => (
        <div className="flex items-center">
          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-blue-600 font-medium text-sm">
              {usuario.nome
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase()}
            </span>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {usuario.nome}
            </div>
            <div className="text-sm text-gray-500 flex items-center">
              <Mail className="h-3 w-3 mr-1" />
              {usuario.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Perfil",
      key: "perfil",
      render: (usuario) => (
        <span
          className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getPerfilColor(
            usuario.perfil.nome
          )}`}
        >
          <Shield className="h-3 w-3 mr-1" />
          {usuario.perfil.nome}
        </span>
      ),
    },
    {
      title: "Status",
      key: "ativo",
      render: (usuario) => (
        <StatusBadge ativo={usuario.ativo} showToggle={false} />
      ),
    },
    {
      title: "Último Login",
      key: "ultimoLogin",
      render: (usuario) =>
        usuario.ultimoLogin ? (
          <div className="flex items-center text-sm text-gray-900">
            <Calendar className="h-3 w-3 mr-1 text-gray-400" />
            {formatarData(usuario.ultimoLogin)}
          </div>
        ) : (
          <span className="text-gray-400 text-sm">Nunca logou</span>
        ),
    },
    {
      title: "Criado em",
      key: "createdAt",
      render: (usuario) => (
        <span className="text-sm text-gray-500">
          {formatarData(usuario.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <CadastroBase<UsuarioComPerfil, UsuarioDTO>
      title="Usuários do Sistema"
      service={userService}
      columns={columns}
      rowKey="id"
      baseUrl="/cadastros/comum/usuarios"
      module="admin" // Restrito para admins
      FormComponent={UsuarioForm}
      searchPlaceholder="Buscar usuários por nome ou email..."
      // Filtros rápidos para usuários
      quickFilters={[
        {
          label: "Administradores",
          filter: (usuarios) =>
            usuarios.filter((u) => u.perfil.nome === TipoPerfilBackend.ADMIN),
          color: "red",
        },
        {
          label: "Obras",
          filter: (usuarios) =>
            usuarios.filter((u) => u.perfil.nome === TipoPerfilBackend.OBRAS),
          color: "blue",
        },
        {
          label: "Agricultura",
          filter: (usuarios) =>
            usuarios.filter(
              (u) => u.perfil.nome === TipoPerfilBackend.AGRICULTURA
            ),
          color: "green",
        },
        {
          label: "Nunca logaram",
          filter: (usuarios) => usuarios.filter((u) => !u.ultimoLogin),
          color: "yellow",
        },
      ]}
      // Métricas para dashboard
      showMetrics={true}
      calculateMetrics={(usuarios) => ({
        total: usuarios.length,
        ativos: usuarios.filter((u) => u.ativo).length,
        inativos: usuarios.filter((u) => !u.ativo).length,
        admins: usuarios.filter(
          (u) => u.perfil.nome === TipoPerfilBackend.ADMIN
        ).length,
        obras: usuarios.filter((u) => u.perfil.nome === TipoPerfilBackend.OBRAS)
          .length,
        agricultura: usuarios.filter(
          (u) => u.perfil.nome === TipoPerfilBackend.AGRICULTURA
        ).length,
        semLogin: usuarios.filter((u) => !u.ultimoLogin).length,
      })}
    />
  );
};

export default Usuarios;
