import React from "react";

import CadastroSimples from "../../../components/cadastro/CadastroSimples";
import grupoProdutoService, {
  GrupoProduto,
  GrupoProdutoDTO,
} from "../../../services/agricultura/grupoProdutoService";

/**
 * Componente de Cadastro de Grupos de Produtos
 * Específico para a secretaria de Agricultura
 */
const GrupoProdutoPage: React.FC = () => {
  // Valor inicial para o formulário
  const valorInicial: GrupoProdutoDTO = {
    descricao: "",
    ativo: true,
  };

  return (
    <CadastroSimples<GrupoProduto, GrupoProdutoDTO>
      titulo="Cadastro de Grupos de Produtos"
      setor="Agricultura"
      tipo="Grupo de Produto"
      service={grupoProdutoService}
      valorInicial={valorInicial}
      campoExibicao="descricao"
      labelCampo="Descrição"
      placeholderBusca="Buscar grupos de produtos..."
    />
  );
};

export default GrupoProdutoPage;
