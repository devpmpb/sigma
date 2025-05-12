import React from "react";
import CadastroSimples from "../../../components/cadastro/CadastroSimples";
import tipoVeiculoService, {
  TipoVeiculo,
  TipoVeiculoDTO,
} from "../../../services/obras/tipoVeiculoService";

/**
 * Componente de Cadastro de Tipos de Veículos
 * Específico para a secretaria de Obras
 */
const TipoVeiculoPage: React.FC = () => {
  // Valor inicial para o formulário
  const valorInicial: TipoVeiculoDTO = {
    descricao: "",
    ativo: true,
  };

  return (
    <CadastroSimples<TipoVeiculo, TipoVeiculoDTO>
      titulo="Cadastro de Tipos de Veículos"
      setor="obras"
      tipo="Tipo de Veículo"
      service={tipoVeiculoService}
      valorInicial={valorInicial}
      campoExibicao="descricao"
      labelCampo="Descrição"
      placeholderBusca="Buscar tipos de veículos..."
    />
  );
};

export default TipoVeiculoPage;
