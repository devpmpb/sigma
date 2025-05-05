import { LucideIcon } from "lucide-react";

export interface MenuItem {
  id: string;
  title: string;
  path: string;
  icon: LucideIcon | (() => null);
  module?: ModuleType;
}

export type ModuleType = "obras" | "agricultura" | "comum";
export type ActionType = "view" | "create" | "edit" | "delete";

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
