import { lazy } from "react";
import VeiculoForm from "../../../pages/cadastros/comum/veiculo/VeiculoForm";

const Bairro = lazy(() => import("../../../pages/cadastros/comum/Bairro"));
const Logradouro = lazy(
  () => import("../../../pages/cadastros/comum/logradouro/Logradouros")
);
const LogradouroForm = lazy(
  () => import("../../../pages/cadastros/comum/logradouro/LogradouroForm")
);
const Pessoa = lazy(
  () => import("../../../pages/cadastros/comum/pessoa/Pessoas")
);
const PessoaForm = lazy(
  () => import("../../../pages/cadastros/comum/pessoa/PessoaForm")
);
const Propriedade = lazy(
  () => import("../../../pages/cadastros/comum/propriedade/Propriedade")
);
const PropriedadeForm = lazy(
  () => import("../../../pages/cadastros/comum/propriedade/PropriedadeForm")
);
const Programas = lazy(
  () => import("../../../pages/cadastros/comum/programa/Programas")
);
const ProgramaForm = lazy(
  () => import("../../../pages/cadastros/comum/programa/ProgramaForm")
);
const RegrasNegocio = lazy(
  () => import("../../../pages/cadastros/comum/regrasNegocio/RegrasNegocio")
);
const RegrasNegocioForm = lazy(
  () => import("../../../pages/cadastros/comum/regrasNegocio/RegrasNegocioForm")
);
const Usuarios = lazy(
  () => import("../../../pages/cadastros/comum/usuario/Usuarios")
);
const UsuarioForm = lazy(
  () => import("../../../pages/cadastros/comum/usuario/UsuarioForm")
);

// Componentes de movimentos

const TransferenciasPage = lazy(
  () =>
    import("../../../pages/movimentos/comum/transferencia/TransferenciasPage")
);
const TransferenciaPropiedadeForm = lazy(
  () =>
    import(
      "../../../pages/movimentos/comum/transferencia/TransferenciaPropiedadeForm"
    )
);

const SolicitacoesBeneficio = lazy(
  () =>
    import(
      "../../../pages/movimentos/comum/solicitacoesBeneficio/SolicitacoesBeneficio"
    )
);

const SolicitacaoBeneficioForm = lazy(
  () =>
    import(
      "../../../pages/movimentos/comum/solicitacoesBeneficio/SolicitacaoBeneficioForm"
    )
);
const AvaliacoesBeneficio = lazy(
  () => import("../../../pages/movimentos/comum/AvaliacoesBeneficio")
);
const RelatoriosBeneficio = lazy(
  () => import("../../../pages/movimentos/comum/RelatoriosBeneficio")
);

const TipoVeiculo = lazy(
  () => import("../../../pages/cadastros/comum/TipoVeiculo")
);

const Veiculos = lazy(
  () => import("../../../pages/cadastros/comum/veiculo/Veiculos")
);

export const comunComponents = {
  Usuarios,
  UsuarioForm,
  Bairro,
  Logradouro,
  LogradouroForm,
  Pessoa,
  PessoaForm,
  Propriedade,
  PropriedadeForm,
  Programas,
  ProgramaForm,
  RegrasNegocio,
  RegrasNegocioForm,
  TransferenciaPropiedadeForm,
  SolicitacaoBeneficioForm,
  AvaliacoesBeneficio,
  RelatoriosBeneficio,
  TipoVeiculo,
  Veiculos,
};

export const comunRouteConfig = [
  //Rotas de usuários (apenas para admins)
  {
    path: "/cadastros/comum/usuarios",
    component: Usuarios,
    module: "admin",
    action: "view",
  },
  {
    path: "/cadastros/comum/usuarios/:id",
    component: UsuarioForm,
    module: "admin",
    action: "view",
  },

  // Cadastros básicos existentes
  {
    path: "/cadastros/comum/bairros",
    component: Bairro,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/bairros/:id",
    component: Bairro,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/logradouros",
    component: Logradouro,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/logradouros/:id",
    component: LogradouroForm,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/pessoas",
    component: Pessoa,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/pessoas/:id",
    component: PessoaForm,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/propriedades",
    component: Propriedade,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/propriedades/:id",
    component: PropriedadeForm,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/programas",
    component: Programas,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/programas/:id",
    component: ProgramaForm,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/regrasNegocio",
    component: RegrasNegocio,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/regrasNegocio/:id",
    component: RegrasNegocioForm,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/regrasNegocio/programa/:programaId",
    component: RegrasNegocio,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/regrasNegocio/programa/:programaId/:id",
    component: RegrasNegocioForm,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/regrasNegocio/programa/:programaId/novo",
    component: RegrasNegocioForm,
    module: "comum",
    action: "create",
  },
  {
    path: "/cadastros/comum/tipoVeiculo",
    component: TipoVeiculo,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/veiculos",
    component: Veiculos,
    module: "comum",
    action: "view",
  },
  {
    path: "/cadastros/comum/veiculos/:id",
    component: VeiculoForm,
    module: "comum",
    action: "view",
  },
  // Movimentos
  {
    path: "/movimentos/comum/transferencias-propriedade", // PLURAL agora
    component: TransferenciasPage, // MUDOU para a página de listagem
    module: "comum",
    action: "view",
  },
  {
    path: "/movimentos/comum/transferencias-propriedade/novo", // NOVA ROTA para formulário
    component: TransferenciaPropiedadeForm,
    module: "comum",
    action: "create",
  },
  {
    path: "/movimentos/comum/transferencias-propriedade/:id", // NOVA ROTA para edição (se necessário)
    component: TransferenciaPropiedadeForm,
    module: "comum",
    action: "edit",
  },
  {
    path: "/movimentos/comum/solicitacoesBeneficios",
    component: SolicitacoesBeneficio,
    module: "comum",
    action: "view",
  },
  {
    path: "/movimentos/comum/solicitacoesBeneficios/:id",
    component: SolicitacaoBeneficioForm,
    module: "comum",
    action: "view",
  },
  {
    path: "/movimentos/comum/avaliacoes",
    component: AvaliacoesBeneficio,
    module: "comum",
    action: "view",
  },
  {
    path: "/movimentos/comum/relatorios",
    component: RelatoriosBeneficio,
    module: "comum",
    action: "view",
  },
];
