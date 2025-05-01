import { Home, Users, ShoppingCart, Settings } from "lucide-react";
import { MenuItem } from "../types";

export const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    path: "/",
    icon: Home,
  },
  {
    id: "usuarios",
    title: "Usuários",
    path: "/usuarios",
    icon: Users,
  },
  {
    id: "produtos",
    title: "Produtos",
    path: "/produtos",
    icon: ShoppingCart,
  },
  {
    id: "configuracoes",
    title: "Configurações",
    path: "/configuracoes",
    icon: Settings,
  },
];
