import React, { useState, useEffect } from "react";
import { FormBase } from "../../../../components/cadastro";
import propriedadeService, {
  PropriedadeDTO,
  TipoPropriedade,
  Propriedade,
} from "../../../../services/common/propriedadeService";
import pessoaService, {
  Pessoa,
} from "../../../../services/common/pessoaService";

interface PropriedadeFormProps {
  id?: string | number;
  onSave: () => void;
}

/**
 * Formulário para cadastro e edição de propriedades
 */
const PropriedadeForm: React.FC<PropriedadeFormProps> = ({ id, onSave }) => {
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [loadingPessoas, setLoadingPessoas] = useState(false);

  // Valores iniciais do formulário
  const initialValues: PropriedadeDTO = {
    nome: "",
    tipoPropriedade: TipoPropriedade.RURAL,
    areaTotal: "",
    localizacao: "",
    matricula: "",
    proprietarioId: 0,
  };

  // Carregar pessoas para seleção
  useEffect(() => {
    const fetchPessoas = async () => {
      setLoadingPessoas(true);
      try {
        const data = await pessoaService.getAll();
        setPessoas(data);
      } catch (error) {
        console.error("Erro ao carregar pessoas:", error);
      } finally {
        setLoadingPessoas(false);
      }
    };

    fetchPessoas();
  }, []);

  // Validação do formulário
  const validate = (values: PropriedadeDTO): Record<string, string> | null => {
    const errors: Record<string, string> = {};

    if (!values.nome?.trim()) {
      errors.nome = "Nome é obrigatório";
    }

    if (!values.tipoPropriedade) {
      errors.tipoPropriedade = "Tipo de propriedade é obrigatório";
    }

    if (!values.areaTotal || Number(values.areaTotal) <= 0) {
      errors.areaTotal = "Área total deve ser maior que zero";
    }

    if (!values.proprietarioId || values.proprietarioId === 0) {
      errors.proprietarioId = "Proprietário é obrigatório";
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  // Opções de tipo de propriedade
  const tiposPropriedade = propriedadeService.getTiposPropriedade();

  return (
    <FormBase<Propriedade, PropriedadeDTO>
      title="Propriedade"
      service={propriedadeService}
      id={id}
      initialValues={initialValues}
      validate={validate}
      onSave={onSave}
      returnUrl="/cadastros/comum/propriedades"
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        setValue,
        setFieldTouched,
      }) => (
        <>
          {/* Nome */}
          <div>
            <label
              htmlFor="nome"
              className="block text-sm font-medium text-gray-700"
            >
              Nome da Propriedade *
            </label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={values.nome}
              onChange={handleChange}
              onBlur={() => setFieldTouched("nome")}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                errors.nome && touched.nome ? "border-red-500" : ""
              }`}
              placeholder="Digite o nome da propriedade"
            />
            {errors.nome && touched.nome && (
              <p className="mt-1 text-sm text-red-600">{errors.nome}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo de Propriedade */}
            <div>
              <label
                htmlFor="tipoPropriedade"
                className="block text-sm font-medium text-gray-700"
              >
                Tipo de Propriedade *
              </label>
              <select
                id="tipoPropriedade"
                name="tipoPropriedade"
                value={values.tipoPropriedade}
                onChange={handleChange}
                onBlur={() => setFieldTouched("tipoPropriedade")}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.tipoPropriedade && touched.tipoPropriedade
                    ? "border-red-500"
                    : ""
                }`}
              >
                <option value="">Selecione o tipo</option>
                {tiposPropriedade.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
              {errors.tipoPropriedade && touched.tipoPropriedade && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.tipoPropriedade}
                </p>
              )}
            </div>

            {/* Área Total */}
            <div>
              <label
                htmlFor="areaTotal"
                className="block text-sm font-medium text-gray-700"
              >
                Área Total (alqueires) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                id="areaTotal"
                name="areaTotal"
                value={values.areaTotal}
                onChange={handleChange}
                onBlur={() => setFieldTouched("areaTotal")}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.areaTotal && touched.areaTotal ? "border-red-500" : ""
                }`}
                placeholder="0,00"
              />
              {errors.areaTotal && touched.areaTotal && (
                <p className="mt-1 text-sm text-red-600">{errors.areaTotal}</p>
              )}
            </div>
          </div>

          {/* Proprietário */}
          <div>
            <label
              htmlFor="proprietarioId"
              className="block text-sm font-medium text-gray-700"
            >
              Proprietário *
            </label>
            <select
              id="proprietarioId"
              name="proprietarioId"
              value={values.proprietarioId}
              onChange={(e) =>
                setValue("proprietarioId", Number(e.target.value))
              }
              onBlur={() => setFieldTouched("proprietarioId")}
              disabled={loadingPessoas}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                errors.proprietarioId && touched.proprietarioId
                  ? "border-red-500"
                  : ""
              }`}
            >
              <option value="0">
                {loadingPessoas ? "Carregando..." : "Selecione o proprietário"}
              </option>
              {pessoas.map((pessoa) => (
                <option key={pessoa.id} value={pessoa.id}>
                  {pessoa.nome} - {pessoa.cpfCnpj}
                </option>
              ))}
            </select>
            {errors.proprietarioId && touched.proprietarioId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.proprietarioId}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Matrícula */}
            <div>
              <label
                htmlFor="matricula"
                className="block text-sm font-medium text-gray-700"
              >
                Matrícula do Imóvel
              </label>
              <input
                type="text"
                id="matricula"
                name="matricula"
                value={values.matricula || ""}
                onChange={handleChange}
                onBlur={() => setFieldTouched("matricula")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Digite a matrícula do imóvel"
              />
              <p className="mt-1 text-sm text-gray-500">
                Número da matrícula no cartório de registro de imóveis
              </p>
            </div>
            <div></div> {/* Espaço vazio para alinhamento */}
          </div>

          {/* Localização */}
          <div>
            <label
              htmlFor="localizacao"
              className="block text-sm font-medium text-gray-700"
            >
              Localização/Descrição
            </label>
            <textarea
              id="localizacao"
              name="localizacao"
              rows={3}
              value={values.localizacao || ""}
              onChange={handleChange}
              onBlur={() => setFieldTouched("localizacao")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Descreva a localização da propriedade (ex: Linha São Francisco, próximo ao açude municipal)"
            />
            <p className="mt-1 text-sm text-gray-500">
              Descrição detalhada da localização para facilitar a identificação
            </p>
          </div>
        </>
      )}
    </FormBase>
  );
};

export default PropriedadeForm;
