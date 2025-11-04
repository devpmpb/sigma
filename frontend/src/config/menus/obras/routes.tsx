import { lazy } from "react";

// Usando lazy loading para componentes

const OrdensServico = lazy(() => import("../../../pages/movimentos/obras/ordemServico/OrdensServico"));
const OrdemServicoForm = lazy(() => import("../../../pages/movimentos/obras/ordemServico/OrdemServicoForm"));
const TiposServico = lazy(() => import("../../../pages/cadastros/obras/tipoServico/TiposServico"));
const TipoServicoForm = lazy(() => import("../../../pages/cadastros/obras/tipoServico/TipoServicoForm"));

// Exportamos os componentes para compatibilidade com código existente
export const obrasComponents = {
  OrdensServico,
  OrdemServicoForm,
  TiposServico,
  TipoServicoForm
};

// Exportamos as configurações das rotas para compatibilidade
export const obrasRouteConfig = [
  // Cadastros
  {
    path: "/cadastros/obras/tipos-servico",
    module: "obras",
    action: "view",
    component: TiposServico,
  },
  {
    path: "/cadastros/obras/tipos-servico/:id",
    module: "obras",
    action: "view",
    component: TipoServicoForm,
  },
  // Movimentos
  {
    path: "/movimentos/obras/ordens-servico",
    //id: "ordens-servico-list",
    module: "obras",
    action: "view",
    component: OrdensServico,
  },
  /*{
    path: "/movimentos/obras/ordens-servico/novo",
    id: "ordem-servico-create",
    component: () => <OrdemServicoForm onSave={() => window.history.back()} />,
  },*/
  {
    path: "/movimentos/obras/ordens-servico/:id",
    module: "obras",
    action: "view",
    component: OrdemServicoForm,
    //id: "ordem-servico-edit",
    //component: ({ params }: { params: { id: string } }) => (
    //  <OrdemServicoForm id={params.id} onSave={() => window.history.back()} />
    //),
  },
];
