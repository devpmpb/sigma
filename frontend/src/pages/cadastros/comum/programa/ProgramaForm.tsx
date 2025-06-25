import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import programaService, {
  Programa,
  ProgramaDTO,
  TipoPrograma,
  RegrasNegocio,
} from "../../../../services/comum/programaService";
import { FormBase } from "../../../../components/cadastro";
import { FormField } from "../../../../components/comum";

interface ProgramaFormProps {
  id?: string | number;
  onSave: () => void;
}

/**
 * Componente de Formulário de Programas
 * Inclui visualização das regras existentes e opção de duplicar
 */
const ProgramaForm: React.FC<ProgramaFormProps> = ({ id, onSave }) => {
  const navigate = useNavigate();
  const programaId = id || useParams({ strict: false }).id;
  const [regras, setRegras] = useState<RegrasNegocio[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateName, setDuplicateName] = useState("");
  const [duplicating, setDuplicating] = useState(false);

  // Valor inicial para o formulário
  const initialValues: ProgramaDTO = {
    nome: "",
    descricao: "",
    leiNumero: "",
    tipoPrograma: TipoPrograma.SUBSIDIO,
    ativo: true,
  };

  // Carregar regras se estiver editando
  useEffect(() => {
    const loadRegras = async () => {
      if (programaId && programaId !== "novo") {
        try {
          const programaComRegras = await programaService.getByIdWithRules(
            programaId
          );
          setRegras(programaComRegras.regras || []);
        } catch (error) {
          console.error("Erro ao carregar regras:", error);
        }
      }
    };

    loadRegras();
  }, [programaId]);

  // Validação do formulário
  const validate = (values: ProgramaDTO) => {
    const errors: Record<string, string> = {};

    if (!values.nome?.trim()) {
      errors.nome = "Nome é obrigatório";
    }

    if (!values.tipoPrograma) {
      errors.tipoPrograma = "Tipo de programa é obrigatório";
    }

    if (values.leiNumero && values.leiNumero.trim()) {
      const leiPattern = /^(LEI\s+)?N[°º]?\s*\d+/i;
      if (!leiPattern.test(values.leiNumero)) {
        errors.leiNumero = "Formato inválido. Ex: LEI Nº 1234/2023";
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  // Função para duplicar programa
  const handleDuplicate = async () => {
    if (!duplicateName.trim()) {
      alert("Nome do novo programa é obrigatório");
      return;
    }

    setDuplicating(true);
    try {
      await programaService.duplicarPrograma(programaId!, {
        novoNome: duplicateName,
      });
      alert("Programa duplicado com sucesso!");
      setShowDuplicateModal(false);
      setDuplicateName("");
      onSave();
    } catch (error: any) {
      console.error("Erro ao duplicar programa:", error);
      alert(error.response?.data?.erro || "Erro ao duplicar programa");
    } finally {
      setDuplicating(false);
    }
  };

  // Função para navegar para gerenciar regras
  const handleManageRules = () => {
    navigate({
      to: `/cadastros/comum/regrasNegocio/programa/${programaId}`,
    });
  };

  return (
    <>
      <FormBase<Programa, ProgramaDTO>
        title="Programa de Incentivo"
        service={programaService}
        id={programaId}
        initialValues={initialValues}
        validate={validate}
        returnUrl="/cadastros/comum/programas"
        onSave={onSave}
      >
        {({ values, errors, touched, handleChange, setValue }) => (
          <>
            {/* Botões de ação extras */}
            {programaId && programaId !== "novo" && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleManageRules}
                    className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    Gerenciar Regras ({regras.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDuplicateModal(true)}
                    className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Duplicar Programa
                  </button>
                </div>
              </div>
            )}

            {/* Campos do formulário */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="tipoPrograma"
                label="Tipo de Programa"
                error={errors.tipoPrograma}
                touched={touched.tipoPrograma}
                required
              >
                <select
                  id="tipoPrograma"
                  name="tipoPrograma"
                  value={values.tipoPrograma}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {programaService.getTiposPrograma().map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                name="leiNumero"
                label="Número da Lei"
                error={errors.leiNumero}
                touched={touched.leiNumero}
                helpText="Formato: LEI Nº 1234/2023"
              >
                <input
                  type="text"
                  id="leiNumero"
                  name="leiNumero"
                  value={values.leiNumero || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="LEI Nº 1234/2023"
                />
              </FormField>
            </div>

            <FormField
              name="nome"
              label="Nome do Programa"
              error={errors.nome}
              touched={touched.nome}
              required
            >
              <input
                type="text"
                id="nome"
                name="nome"
                value={values.nome}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome do programa de incentivo"
              />
            </FormField>

            <FormField
              name="descricao"
              label="Descrição"
              error={errors.descricao}
              touched={touched.descricao}
            >
              <textarea
                id="descricao"
                name="descricao"
                value={values.descricao || ""}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descrição detalhada do programa..."
              />
            </FormField>

            {programaId && programaId !== "novo" && (
              <FormField name="ativo" label="Ativo" type="checkbox">
                <input
                  type="checkbox"
                  id="ativo"
                  name="ativo"
                  checked={values.ativo}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </FormField>
            )}

            {/* Resumo das regras existentes */}
            {regras.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Regras de Negócio ({regras.length})
                </h3>
                <div className="space-y-2">
                  {regras.map((regra) => (
                    <div
                      key={regra.id}
                      className="bg-gray-50 p-3 rounded-md flex justify-between items-center"
                    >
                      <div>
                        <span className="font-medium">{regra.tipoRegra}</span>
                        <span className="text-gray-600 ml-2">
                          R$ {regra.valorBeneficio.toFixed(2)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          navigate({
                            to: `/cadastros/comum/regrasNegocio/${regra.id}`,
                          })
                        }
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        Editar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </FormBase>

      {/* Modal de duplicação */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                Duplicar Programa
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Digite o nome para o novo programa:
                </p>
                <input
                  type="text"
                  value={duplicateName}
                  onChange={(e) => setDuplicateName(e.target.value)}
                  className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do novo programa"
                />
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleDuplicate}
                  disabled={duplicating}
                  className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
                >
                  {duplicating ? "..." : "Duplicar"}
                </button>
                <button
                  onClick={() => {
                    setShowDuplicateModal(false);
                    setDuplicateName("");
                  }}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProgramaForm;
