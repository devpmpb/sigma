// Configuração da API
export { default as apiClient } from "./apiConfig";

// Serviços de cadastros comuns
export { default as bairroService } from "./common/bairroService";
export { default as logradouroService } from "./common/logradouroService";
export { default as pessoaService } from './common/pessoaService';

// Serviços específicos - Obras
export { default as tipoVeiculoService } from "./obras/tipoVeiculoService";

// Serviços específicos - Agricultura
export { default as grupoProdutoService } from "./agricultura/grupoProdutoService";

// Re-exportar tipos
export type { Bairro, BairroDTO } from "./common/bairroService";
export type {
  Logradouro,
  LogradouroDTO,
  TipoLogradouro,
} from "./common/logradouroService";
export type { TipoVeiculo, TipoVeiculoDTO } from "./obras/tipoVeiculoService";
export type {
  GrupoProduto,
  GrupoProdutoDTO,
} from "./agricultura/grupoProdutoService";
export * from './common/pessoaService';

export { default as userService } from "./admin/userService";
export type { Usuario, UsuarioDTO, ChangePasswordDTO } from "./admin/userService";