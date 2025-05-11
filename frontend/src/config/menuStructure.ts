
import { MenuGroup } from "../types";
import { cadastrosAgriculturaMenu, cadastrosComunMenu, cadastrosObrasMenu, 
movimentosAgriculturaMenu, movimentosComunMenu, movimentosObrasMenu } 
from "./menus";


// Estrutura de cadastros
export const cadastrosMenu: MenuGroup[] = [
  cadastrosObrasMenu,
  cadastrosAgriculturaMenu,
  cadastrosComunMenu,
];

// Estrutura de movimentos
export const movimentosMenu: MenuGroup[] = [
  movimentosObrasMenu,
  movimentosAgriculturaMenu,
  movimentosComunMenu,
];