import { LucideIcon } from "lucide-react";

// Tipos compartilhados - Frontend usa lowercase, Backend usa UPPERCASE
export type ModuleType = "obras" | "agricultura" | "comum" | "admin";
export type ActionType = "view" | "create" | "edit" | "delete";

// ENUMs do backend (para referência)
export enum TipoPerfilBackend {
  ADMIN = "ADMIN",
  OBRAS = "OBRAS", 
  AGRICULTURA = "AGRICULTURA"
}

export enum ModuloSistemaBackend {
  OBRAS = "OBRAS",
  AGRICULTURA = "AGRICULTURA",
  COMUM = "COMUM",
  ADMIN = "ADMIN"
}

export enum AcaoPermissaoBackend {
  VIEW = "VIEW",
  CREATE = "CREATE",
  EDIT = "EDIT",
  DELETE = "DELETE"
}

// Interfaces relacionadas a usuários e permissões
export interface Permission {
  module: ModuleType;
  action: ActionType;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  sector: "obras" | "agricultura" | "admin";
  permissions: Permission[];
  // Campos opcionais do backend
  perfil?: {
    id: number;
    nome: string;
    descricao: string | null;
  };
}

// Tipos para usuários do backend (para serviços)
export interface UsuarioBackend {
  id: number;
  nome: string;
  email: string;
  ativo: boolean;
  perfilId: number;
  perfil: {
    id: number;
    nome: TipoPerfilBackend;
    descricao: string | null;
  };
  permissions: Array<{
    modulo: ModuloSistemaBackend;
    acao: AcaoPermissaoBackend;
  }>;
  ultimoLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: number;
  nome: TipoPerfilBackend;
  descricao: string | null;
  ativo: boolean;
}

export interface UsuarioDTO {
  nome: string;
  email: string;
  senha?: string; // Opcional para updates
  perfilId: number;
  ativo?: boolean;
}

export interface ChangePasswordDTO {
  senhaAtual: string;
  novaSenha: string;
  confirmarSenha: string;
}

export interface MenuItem {
  id: string;
  title: string;
  path: string;
  icon: LucideIcon | (() => null);
  module?: ModuleType;
}

export interface SubMenuItem {
  id: string;
  title: string;
  path: string;
  module: ModuleType;
}

export interface MenuGroup {
  id: string;
  title: string;
  module: ModuleType;
  items: SubMenuItem[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: UsuarioBackend;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  user: UsuarioBackend;
  accessToken: string;
  refreshToken: string;
}

export const convertBackendUserToFrontend = (backendUser: UsuarioBackend): User => {
  return {
    id: backendUser.id.toString(),
    name: backendUser.nome,
    email: backendUser.email,
    role: backendUser.perfil.nome.toLowerCase(),
    sector: backendUser.perfil.nome === TipoPerfilBackend.ADMIN 
      ? "admin" 
      : backendUser.perfil.nome.toLowerCase() as "obras" | "agricultura" | "admin",
    permissions: backendUser.permissions.map(p => ({
      module: p.modulo.toLowerCase() as ModuleType,
      action: p.acao.toLowerCase() as ActionType
    })),
    perfil: {
      id: backendUser.perfil.id,
      nome: backendUser.perfil.nome,
      descricao: backendUser.perfil.descricao
    }
  };
};

export const convertModuleToBackend = (module: ModuleType): ModuloSistemaBackend => {
  const mapping: Record<ModuleType, ModuloSistemaBackend> = {
    "obras": ModuloSistemaBackend.OBRAS,
    "agricultura": ModuloSistemaBackend.AGRICULTURA,
    "comum": ModuloSistemaBackend.COMUM,
    "admin": ModuloSistemaBackend.ADMIN
  };
  return mapping[module];
};

export const convertActionToBackend = (action: ActionType): AcaoPermissaoBackend => {
  const mapping: Record<ActionType, AcaoPermissaoBackend> = {
    "view": AcaoPermissaoBackend.VIEW,
    "create": AcaoPermissaoBackend.CREATE,
    "edit": AcaoPermissaoBackend.EDIT,
    "delete": AcaoPermissaoBackend.DELETE
  };
  return mapping[action];
};