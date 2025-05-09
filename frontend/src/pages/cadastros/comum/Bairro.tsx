import React from "react";
import CadastroSimples from "../../../components/cadastro/CadastroSimples";
import { bairroService } from "../../../services";
import { BairroDTO, Bairro } from "../../../services/common/bairroService";

/**
 * Componente de Cadastro de Bairros
 * Cadastro comum - acessível a todas as secretarias
 */
const BairrosPage: React.FC = () => {
  // Valor inicial para o formulário
  const valorInicial: BairroDTO = {
    nome: "",
    ativo: true,
  };

  return (
    <CadastroSimples<Bairro, BairroDTO>
      titulo="Cadastro de Bairros"
      setor="Comum"
      tipo="Bairro"
      service={bairroService}
      valorInicial={valorInicial}
      campoExibicao="nome"
      labelCampo="Nome do Bairro"
      placeholderBusca="Buscar bairros..."
    />
  );
};

export default BairrosPage;
