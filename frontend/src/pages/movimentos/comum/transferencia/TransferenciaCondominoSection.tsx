// frontend/src/pages/movimentos/comum/transferencia/TransferenciaCondominoSection.tsx
import React, { useState, useEffect } from "react";
import FormField from "../../../../components/comum/FormField";
import FormSection from "../../../../components/comum/FormSection";
import propriedadeCondominoService, {
  PropriedadeCondomino,
} from "../../../../services/comum/propriedadeCondominoService";
import { Pessoa } from "../../../../services/comum/pessoaService";

interface TransferenciaCondominoSectionProps {
  propriedadeId: number;
  pessoas: Pessoa[];
  onTransferenciaCompleta?: () => void;
}

/**
 * Seção para transferir participação entre condôminos
 * Só aparece quando a propriedade já é CONDOMÍNIO
 */
const TransferenciaCondominoSection: React.FC<
  TransferenciaCondominoSectionProps
> = ({ propriedadeId, pessoas, onTransferenciaCompleta }) => {
  const [condominosAtuais, setCondominosAtuais] = useState<
    PropriedadeCondomino[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  // Estado do formulário
  const [formData, setFormData] = useState({
    condominoSaiId: 0,
    condominoEntraId: 0,
    dataTransferencia: new Date().toISOString().split("T")[0],
    observacoes: "",
  });

  // Carregar condôminos atuais
  useEffect(() => {
    if (propriedadeId > 0) {
      carregarCondominos();
    }
  }, [propriedadeId]);

  const carregarCondominos = async () => {
    setLoading(true);
    try {
      const condominos = await propriedadeCondominoService.getCondominos(
        propriedadeId,
        true // Apenas ativos
      );
      setCondominosAtuais(condominos);
    } catch (error) {
      console.error("Erro ao carregar condôminos:", error);
      setErro("Erro ao carregar condôminos atuais");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    // Validações
    if (formData.condominoSaiId === 0) {
      setErro("Selecione o condômino que está saindo");
      return;
    }

    if (formData.condominoEntraId === 0) {
      setErro("Selecione a pessoa que está entrando");
      return;
    }

    if (formData.condominoSaiId === formData.condominoEntraId) {
      setErro("O condômino que sai deve ser diferente do que entra");
      return;
    }

    setSalvando(true);
    try {
      await propriedadeCondominoService.transferirCondomino(
        propriedadeId,
        formData
      );

      setSucesso("Transferência entre condôminos realizada com sucesso!");

      // Limpar formulário
      setFormData({
        condominoSaiId: 0,
        condominoEntraId: 0,
        dataTransferencia: new Date().toISOString().split("T")[0],
        observacoes: "",
      });

      // Recarregar condôminos
      await carregarCondominos();

      // Callback opcional
      if (onTransferenciaCompleta) {
        onTransferenciaCompleta();
      }
    } catch (error: any) {
      console.error("Erro ao transferir condômino:", error);
      setErro(error.response?.data?.erro || "Erro ao realizar transferência");
    } finally {
      setSalvando(false);
    }
  };

  if (condominosAtuais.length === 0 && !loading) {
    return (
      <FormSection
        title="Transferência entre Condôminos"
        description="Esta propriedade ainda não possui condôminos ativos"
      >
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-sm text-yellow-800">
          Para transferir entre condôminos, primeiro é necessário ter condôminos
          cadastrados. Use a transferência normal com situação "Condomínio" para
          adicionar os primeiros condôminos.
        </div>
      </FormSection>
    );
  }

  return (
    <FormSection
      title="Transferência entre Condôminos (Opcional)"
      description="Transferir a participação de um condômino para outra pessoa, mantendo o proprietário principal"
    >
      <div className="space-y-4">
        {/* Info sobre condôminos atuais */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="font-medium text-blue-900 mb-2">
            Condôminos Atuais ({condominosAtuais.length})
          </h4>
          <ul className="space-y-1 text-sm text-blue-800">
            {loading ? (
              <li>Carregando...</li>
            ) : (
              condominosAtuais.map((c) => (
                <li key={c.id}>
                  • {c.condomino?.nome || `ID: ${c.condominoId}`}
                  {c.percentual && ` - ${c.percentual}%`}
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Mensagens de feedback */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-800">
            {sucesso}
          </div>
        )}

        {/* Formulário de transferência */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Condômino que sai */}
            <FormField
              name="condominoSaiId"
              label="Condômino que está Saindo"
              required
            >
              <select
                id="condominoSaiId"
                name="condominoSaiId"
                value={formData.condominoSaiId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    condominoSaiId: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Selecione o condômino</option>
                {condominosAtuais.map((c) => (
                  <option key={c.condominoId} value={c.condominoId}>
                    {c.condomino?.nome || `ID: ${c.condominoId}`}
                    {c.percentual && ` (${c.percentual}%)`}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Pessoa que entra */}
            <FormField
              name="condominoEntraId"
              label="Pessoa que está Entrando"
              required
            >
              <select
                id="condominoEntraId"
                name="condominoEntraId"
                value={formData.condominoEntraId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    condominoEntraId: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Selecione a pessoa</option>
                {pessoas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} - {p.cpfCnpj}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data da transferência */}
            <FormField
              name="dataTransferencia"
              label="Data da Transferência"
              required
            >
              <input
                type="date"
                id="dataTransferencia"
                name="dataTransferencia"
                value={formData.dataTransferencia}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dataTransferencia: e.target.value,
                  })
                }
                max={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>

            {/* Observações */}
            <FormField name="observacoes" label="Observações">
              <input
                type="text"
                id="observacoes"
                name="observacoes"
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    observacoes: e.target.value,
                  })
                }
                placeholder="Motivo da transferência"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>
          </div>

          {/* Botão de salvar */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={salvando}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {salvando
                ? "Transferindo..."
                : "Realizar Transferência entre Condôminos"}
            </button>
          </div>
        </form>

        {/* Aviso importante */}
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-800">
          <strong>Atenção:</strong> Esta transferência apenas troca um condômino
          por outro, mantendo o mesmo percentual de participação. O proprietário
          principal da propriedade não será alterado.
        </div>
      </div>
    </FormSection>
  );
};

export default TransferenciaCondominoSection;
