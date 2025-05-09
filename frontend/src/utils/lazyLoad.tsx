import React, { Suspense } from "react";

// Componente loader que será mostrado enquanto o componente principal carrega
const Loader = () => <div>Carregando...</div>;

// Função para facilitar o lazy loading de componentes
export function lazyLoad(importFunc: () => Promise<any>) {
  const LazyComponent = React.lazy(importFunc);

  return (props: any) => (
    <Suspense fallback={<Loader />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}
