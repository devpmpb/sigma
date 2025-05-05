import { Home, FileText, BarChart2, Settings } from "lucide-react";
import { MenuItem } from "../types";

export const menuItems: MenuItem[] = [
  {
    id: "inicio",
    title: "Início",
    path: "/",
    icon: Home,
  },
  {
    id: "relatorios",
    title: "Relatórios",
    path: "/relatorios",
    icon: FileText,
  },
  {
    id: "dashboards",
    title: "Dashboards",
    path: "/dashboards",
    icon: BarChart2,
  },
  {
    id: "configuracoes",
    title: "Configurações",
    path: "/configuracoes",
    icon: Settings,
  },
];

export default menuItems;
