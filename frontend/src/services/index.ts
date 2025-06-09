// frontend/src/services/index.ts 
// Serviços comuns
export { default as bairroService } from "./common/bairroService";
export { default as logradouroService } from "./common/logradouroService";
export { default as pessoaService } from "./common/pessoaService";
export { default as propriedadeService } from "./common/propriedadeService";
export { default as produtorService } from "./common/produtorService";
//export { default as enderecoService } from "./common/enderecoService";

// Serviços de agricultura
export { default as grupoProdutoService } from "./agricultura/grupoProdutoService";
export { default as programaService } from "./common/programaService";
export { default as regrasNegocioService } from "./common/regrasNegocioService";

// Serviços de obras
export { default as tipoVeiculoService } from "./obras/tipoVeiculoService";

// Exportar tipos também
export type { Bairro, BairroDTO } from "./common/bairroService";
export type {
  Logradouro,
  LogradouroDTO,
  TipoLogradouro,
} from "./common/logradouroService";
export type {
  Pessoa,
  PessoaDTO,
  TipoPessoa,
  PessoaFisicaData,
  PessoaJuridicaData,
} from "./common/pessoaService";
export type {
  Propriedade,
  PropriedadeDTO,
  TipoPropriedade,
} from "./common/propriedadeService";
//export type { Endereco, EnderecoDTO, TipoEndereco } from "./common/enderecoService";
export type { 
  Produtor, 
  ProdutorDTO, 
  AreaEfetiva, 
  AreaEfetivaDTO 
} from "./common/produtorService";
export type {
  GrupoProduto,
  GrupoProdutoDTO,
} from "./agricultura/grupoProdutoService";
export type {
  Programa,
  ProgramaDTO,
  TipoPrograma,
  RegrasNegocio as ProgramaRegras,
  ProgramaComRegras,
  EstatisticasPrograma,
} from "./common/programaService";
export type {
  RegrasNegocio,
  RegrasNegocioDTO,
  TipoRegra,
  CondicaoRegra,
  TipoLimite,
  ParametroRegra,
  LimiteBeneficio,
  TipoRegraOption,
  TemplateRegra,
  ValidacaoRegra,
  ProdutorData,
} from "./common/regrasNegocioService";

export type { TipoVeiculo, TipoVeiculoDTO } from "./obras/tipoVeiculoService";
