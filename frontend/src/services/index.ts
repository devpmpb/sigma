// Serviços comuns
export { default as bairroService } from "./comum/bairroService";
export { default as logradouroService } from "./comum/logradouroService";
export { default as pessoaService } from "./comum/pessoaService";
export { default as propriedadeService } from "./comum/propriedadeService";
export { default as produtorService } from "./comum/produtorService";
export { default as enderecoService } from "./comum/enderecoService";

// Serviços de agricultura
export { default as grupoProdutoService } from "./agricultura/grupoProdutoService";
export { default as programaService } from "./comum/programaService";
export { default as regrasNegocioService } from "./comum/regrasNegocioService";
export { default as arrendamentoService } from "./agricultura/arrendamentoService";

// Serviços de obras
export { default as tipoVeiculoService } from "./obras/tipoVeiculoService";

// Exportar tipos também
export type { Bairro, BairroDTO } from "./comum/bairroService";
export type {
  Logradouro,
  LogradouroDTO,
  TipoLogradouro,
} from "./comum/logradouroService";
export {
  type Pessoa,
  type PessoaDTO,
  TipoPessoa,
  type PessoaFisicaData,
  type PessoaJuridicaData,
} from "./comum/pessoaService";
export type {
  Propriedade,
  PropriedadeDTO,
  TipoPropriedade,
} from "./comum/propriedadeService";
//export type { Endereco, EnderecoDTO, TipoEndereco } from "./common/enderecoService";
export type {
  Produtor,
  ProdutorDTO,
  AreaEfetiva,
  AreaEfetivaDTO,
} from "./comum/produtorService";
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
} from "./comum/programaService";
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
} from "./comum/regrasNegocioService";

export type { TipoVeiculo, TipoVeiculoDTO } from "./obras/tipoVeiculoService";

export type {
  Arrendamento,
  ArrendamentoDTO,
  StatusArrendamentoType,
} from "./agricultura/arrendamentoService";
export { StatusArrendamento } from "./agricultura/arrendamentoService";
