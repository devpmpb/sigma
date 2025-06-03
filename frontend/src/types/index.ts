import { LucideIcon } from "lucide-react";

// Tipos compartilhados
export type ModuleType = "obras" | "agricultura" | "comum" | "admin";
export type ActionType = "view" | "create" | "edit" | "delete";

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
}

// Interfaces relacionadas a menu e navegação
export interface MenuItem {
  id: string;
  title: string;
  path: string;
  icon: LucideIcon | (() => null);
  module?: ModuleType;
}

// Para o menu de navegação específico das funcionalidades
export interface SubMenuItem {
  id: string;
  title: string;
  path: string;
  module: ModuleType;
}

// Interface para grupos de menu
export interface MenuGroup {
  id: string;
  title: string;
  module: ModuleType;
  items: SubMenuItem[];
}
