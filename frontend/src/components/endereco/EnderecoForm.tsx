// frontend/src/components/endereco/EnderecoForm.tsx
import React, { useState, useEffect } from "react";
import {
  EnderecoDTO,
  TipoEndereco,
  Endereco,
} from "../../services/comum/enderecoService";
import {
  logradouroService,
  bairroService,
  enderecoService,
} from "../../services";

interface EnderecoFormProps {
  pessoaId: number;
  endereco?: Endereco;
  onSuccess: (endereco: Endereco) => void;
  onCancel: () => void;
  className?: string;
}

interface FormData {
  tipoEndereco: TipoEndereco;
  isRural: boolean;
  logradouroId: string;
  numero: string;
  complemento: string;
  bairroId: string;
  areaRuralId: string;
  referenciaRural: string;
  coordenadas: string;
  principal: boolean;
}

export const EnderecoForm: React.FC<EnderecoFormProps> = ({
  pessoaId,
  endereco,
  onSuccess,
  onCancel,
  className = "",
}) => {
  const [formData, setFormData] = useState<FormData>({
    tipoEndereco: TipoEndereco.RESIDENCIAL,
    isRural: false,
    logradouroId: "",
    numero: "",
    complemento: "",
    bairroId: "",
    areaRuralId: "",
    referenciaRural: "",
    coordenadas: "",
    principal: false,
  });

  const [logradouros, setLogradouros] = useState<any[]>([]);
  const [bairros, setBairros] = useState<any[]>([]);
  const [areasRurais, setAreasRurais] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // ... (mantém toda a lógica igual)

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (endereco) {
      setFormData({
        tipoEndereco: endereco.tipoEndereco,
        isRural: !!endereco.areaRuralId,
        logradouroId: endereco.logradouroId?.toString() || "",
        numero: endereco.numero || "",
        complemento: endereco.complemento || "",
        bairroId: endereco.bairroId?.toString() || "",
        areaRuralId: endereco.areaRuralId?.toString() || "",
        referenciaRural: endereco.referenciaRural || "",
        coordenadas: endereco.coordenadas || "",
        principal: endereco.principal,
      });
    }
  }, [endereco]);

  const carregarDados = async () => {
    setLoadingData(true);
    try {
      const [logradourosData, bairrosData] = await Promise.all([
        logradouroService.getAll(),
        bairroService.getAll(),
      ]);

      setLogradouros(logradourosData);
      setBairros(bairrosData);

      setAreasRurais([
        { id: 1, nome: "Linha São Francisco" },
        { id: 2, nome: "Linha Norte" },
        { id: 3, nome: "Linha do Açude" },
        { id: 4, nome: "Estrada Rural Sul" },
      ]);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setErrors(["Erro ao carregar dados do formulário"]);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    try {
      const enderecoData: EnderecoDTO = {
        pessoaId,
        tipoEndereco: formData.tipoEndereco,
        principal: formData.principal,
        coordenadas: formData.coordenadas || undefined,

        ...(formData.isRural
          ? {}
          : {
              logradouroId: parseInt(formData.logradouroId) || undefined,
              numero: formData.numero || undefined,
              complemento: formData.complemento || undefined,
              bairroId: parseInt(formData.bairroId) || undefined,
            }),

        ...(formData.isRural
          ? {
              areaRuralId: parseInt(formData.areaRuralId) || undefined,
              referenciaRural: formData.referenciaRural || undefined,
            }
          : {}),
      };

      let novoEndereco: Endereco;

      if (endereco) {
        novoEndereco = await enderecoService.updateWithValidation(
          endereco.id,
          enderecoData
        );
      } else {
        novoEndereco = await enderecoService.createWithValidation(enderecoData);
      }

      onSuccess(novoEndereco);
    } catch (error: any) {
      console.error("Erro ao salvar endereço:", error);

      if (error.message) {
        setErrors([error.message]);
      } else if (error.response?.data?.message) {
        setErrors([error.response.data.message]);
      } else {
        setErrors(["Erro ao salvar endereço. Tente novamente."]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleTipoChange = (isRural: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isRural,
      ...(isRural
        ? {
            logradouroId: "",
            numero: "",
            complemento: "",
            bairroId: "",
          }
        : {
            areaRuralId: "",
            referenciaRural: "",
          }),
    }));
  };

  const tiposEndereco = enderecoService.getTiposEndereco();

  if (loadingData) {
    return (
      <div className={`flex justify-center items-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-500">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {endereco ? "Editar" : "Adicionar"} Endereço
          </h3>
          {endereco && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-2">
              ID: {endereco.id}
            </span>
          )}
        </div>

        {errors.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
              {errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Tipo de Endereço */}
        <div>
          <label
            htmlFor="tipoEndereco"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Tipo de Endereço <span className="text-red-500">*</span>
          </label>
          <select
            id="tipoEndereco"
            value={formData.tipoEndereco}
            onChange={(e) => handleChange("tipoEndereco", e.target.value)}
            required
            disabled={loading}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {tiposEndereco.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo: Urbano ou Rural */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Localização
          </label>
          <div className="space-y-3">
            <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="localizacao"
                checked={!formData.isRural}
                onChange={() => handleTipoChange(false)}
                disabled={loading}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">
                🏙️ Endereço Urbano
              </span>
            </label>
            <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="localizacao"
                checked={formData.isRural}
                onChange={() => handleTipoChange(true)}
                disabled={loading}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">
                🌾 Endereço Rural
              </span>
            </label>
          </div>
        </div>

        {/* Campos para Endereço Urbano */}
        {!formData.isRural && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md space-y-4">
            <div>
              <label
                htmlFor="logradouroId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Logradouro <span className="text-red-500">*</span>
              </label>
              <select
                id="logradouroId"
                value={formData.logradouroId}
                onChange={(e) => handleChange("logradouroId", e.target.value)}
                required
                disabled={loading}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Selecione o logradouro</option>
                {logradouros.map((logr: any) => (
                  <option key={logr.id} value={logr.id}>
                    {logr.tipo} {logr.descricao}{" "}
                    {logr.cep && `- CEP: ${logr.cep}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="numero"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Número
                </label>
                <input
                  id="numero"
                  type="text"
                  value={formData.numero}
                  onChange={(e) => handleChange("numero", e.target.value)}
                  placeholder="123"
                  disabled={loading}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label
                  htmlFor="complemento"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Complemento
                </label>
                <input
                  id="complemento"
                  type="text"
                  value={formData.complemento}
                  onChange={(e) => handleChange("complemento", e.target.value)}
                  placeholder="Apto 101, Bloco A, etc."
                  disabled={loading}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="bairroId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Bairro <span className="text-red-500">*</span>
              </label>
              <select
                id="bairroId"
                value={formData.bairroId}
                onChange={(e) => handleChange("bairroId", e.target.value)}
                required
                disabled={loading}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Selecione o bairro</option>
                {bairros.map((bairro: any) => (
                  <option key={bairro.id} value={bairro.id}>
                    {bairro.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Campos para Endereço Rural */}
        {formData.isRural && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md space-y-4">
            <div>
              <label
                htmlFor="areaRuralId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Área Rural <span className="text-red-500">*</span>
              </label>
              <select
                id="areaRuralId"
                value={formData.areaRuralId}
                onChange={(e) => handleChange("areaRuralId", e.target.value)}
                required
                disabled={loading}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Selecione a área rural</option>
                {areasRurais.map((area: any) => (
                  <option key={area.id} value={area.id}>
                    {area.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="referenciaRural"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Referência Rural <span className="text-red-500">*</span>
              </label>
              <textarea
                id="referenciaRural"
                value={formData.referenciaRural}
                onChange={(e) =>
                  handleChange("referenciaRural", e.target.value)
                }
                placeholder="Ex: Próximo ao açude, casa amarela, depois da ponte..."
                required
                disabled={loading}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 resize-none"
              />
            </div>
          </div>
        )}

        {/* Coordenadas */}
        <div>
          <label
            htmlFor="coordenadas"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Coordenadas GPS
            <span className="text-gray-500 font-normal"> (opcional)</span>
          </label>
          <input
            id="coordenadas"
            type="text"
            value={formData.coordenadas}
            onChange={(e) => handleChange("coordenadas", e.target.value)}
            placeholder="-24.954611,-54.057222"
            disabled={loading}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500">
            Formato: latitude,longitude (ex: -24.954611,-54.057222)
          </p>
        </div>

        {/* Endereço Principal */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.principal}
              onChange={(e) => handleChange("principal", e.target.checked)}
              disabled={loading}
              className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm font-medium text-gray-700">
              ⭐ Definir como endereço principal
            </span>
          </label>
          <p className="mt-1 text-xs text-gray-500 ml-7">
            O endereço principal é usado como padrão nas comunicações
          </p>
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={loading}
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {loading
              ? "Salvando..."
              : endereco
              ? "Atualizar Endereço"
              : "Adicionar Endereço"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EnderecoForm;
