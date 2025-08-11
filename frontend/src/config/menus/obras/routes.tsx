import { lazy } from "react";

// Usando lazy loading para componentes

const OrdensServico = lazy(() => import("../../../pages/movimentos/obras/ordemServico/OrdensServico"));
const OrdemServicoForm = lazy(() => import("../../../pages/movimentos/obras/ordemServico/OrdemServicoForm"));

// Exportamos os componentes para compatibilidade com código existente
export const obrasComponents = {
  OrdensServico,
  OrdemServicoForm
};

// Exportamos as configurações das rotas para compatibilidade
export const obrasRouteConfig = [
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
