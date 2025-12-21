// frontend/src/components/comum/AreaEfetivaCard.tsx

import React, { useState, useEffect, useCallback } from "react";
import { Calculator, RefreshCw, Save } from "lucide-react";
import areaEfetivaService, {
  AreaEfetiva,
  AreaEfetivaDTO,
} from "../../services/comum/areaEfetivaService";

interface AreaEfetivaCardProps {
  pessoaId: number;
  isProdutor: boolean;
  readOnly?: boolean;
}

const AreaEfetivaCard: React.FC<AreaEfetivaCardProps> = ({
  pessoaId,
  isProdutor,
  readOnly = false,
}) => {
  const [areaEfetiva, setAreaEfetiva] = useState<AreaEfetiva | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const anoAtual = new Date().getFullYear();
  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual);

  const [formData, setFormData] = useState<AreaEfetivaDTO>({
    areaPropria: 0,
    areaArrendadaRecebida: 0,
    areaArrendadaCedida: 0,
  });

  const carregarAreaEfetiva = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await areaEfetivaService.getByPessoa(
        pessoaId,
        anoSelecionado
      );
      if (data.length > 0) {
        setAreaEfetiva(data[0]);
        setFormData({
          areaPropria: data[0].areaPropria,
          areaArrendadaRecebida: data[0].areaArrendadaRecebida,
          areaArrendadaCedida: data[0].areaArrendadaCedida,
        });
      } else {
        setAreaEfetiva(null);
        setFormData({
          areaPropria: 0,
          areaArrendadaRecebida: 0,
          areaArrendadaCedida: 0,
        });
      }
    } catch (err) {
      console.error("Erro ao carregar área efetiva:", err);
      setError("Erro ao carregar área efetiva");
    } finally {
      setLoading(false);
    }
  }, [pessoaId, anoSelecionado]);

  useEffect(() => {
    if (pessoaId && isProdutor) {
      carregarAreaEfetiva();
    }
  }, [pessoaId, isProdutor, carregarAreaEfetiva]);

  const handleRecalcular = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await areaEfetivaService.recalcular(
        pessoaId,
        anoSelecionado
      );
      setAreaEfetiva(result);
      setFormData({
        areaPropria: result.areaPropria,
        areaArrendadaRecebida: result.areaArrendadaRecebida,
        areaArrendadaCedida: result.areaArrendadaCedida,
      });
      alert(
        `Área efetiva recalculada com sucesso!\n\nPropriedades: ${result.detalhes.propriedadesCount}\nArrendamentos recebidos: ${result.detalhes.arrendamentosRecebidosCount}\nArrendamentos cedidos: ${result.detalhes.arrendamentosCedidosCount}`
      );
    } catch (err: any) {
      console.error("Erro ao recalcular área efetiva:", err);
      setError(err.response?.data?.erro || "Erro ao recalcular área efetiva");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await areaEfetivaService.update(pessoaId, {
        ...formData,
        anoReferencia: anoSelecionado,
      });
      setAreaEfetiva(result);
      setEditMode(false);
      alert("Área efetiva salva com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar área efetiva:", err);
      setError(err.response?.data?.erro || "Erro ao salvar área efetiva");
    } finally {
      setSaving(false);
    }
  };

  if (!isProdutor) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-500 text-sm">
          Área efetiva disponível apenas para produtores rurais.
        </p>
      </div>
    );
  }

  const areaCalculada =
    (Number(formData.areaPropria) || 0) +
    (Number(formData.areaArrendadaRecebida) || 0) -
    (Number(formData.areaArrendadaCedida) || 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calculator className="h-5 w-5 text-green-600" />
          Área Efetiva
        </h3>

        <div className="flex items-center gap-2">
          <select
            value={anoSelecionado}
            onChange={(e) => setAnoSelecionado(Number(e.target.value))}
            className="px-2 py-1 border rounded text-sm"
          >
            {[anoAtual, anoAtual - 1, anoAtual - 2].map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>

          {!readOnly && (
            <>
              <button
                onClick={handleRecalcular}
                disabled={saving}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                title="Recalcular automaticamente"
              >
                <RefreshCw
                  className={`h-4 w-4 ${saving ? "animate-spin" : ""}`}
                />
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {/* Área Própria */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Área Própria:</span>
            {editMode ? (
              <input
                type="number"
                step="0.01"
                value={formData.areaPropria}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    areaPropria: Number(e.target.value),
                  })
                }
                className="w-24 px-2 py-1 border rounded text-right"
              />
            ) : (
              <span className="font-medium">
                {Number(areaEfetiva?.areaPropria || 0).toFixed(2)} alq
              </span>
            )}
          </div>

          {/* Área Recebida */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">+ Arrendada Recebida:</span>
            {editMode ? (
              <input
                type="number"
                step="0.01"
                value={formData.areaArrendadaRecebida}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    areaArrendadaRecebida: Number(e.target.value),
                  })
                }
                className="w-24 px-2 py-1 border rounded text-right"
              />
            ) : (
              <span className="font-medium text-green-600">
                +{Number(areaEfetiva?.areaArrendadaRecebida || 0).toFixed(2)}{" "}
                alq
              </span>
            )}
          </div>

          {/* Área Cedida */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">- Arrendada Cedida:</span>
            {editMode ? (
              <input
                type="number"
                step="0.01"
                value={formData.areaArrendadaCedida}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    areaArrendadaCedida: Number(e.target.value),
                  })
                }
                className="w-24 px-2 py-1 border rounded text-right"
              />
            ) : (
              <span className="font-medium text-red-600">
                -{Number(areaEfetiva?.areaArrendadaCedida || 0).toFixed(2)} alq
              </span>
            )}
          </div>

          {/* Divider */}
          <hr className="border-gray-200" />

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="text-gray-800 font-semibold">= Área Efetiva:</span>
            <span className="text-xl font-bold text-green-700">
              {editMode
                ? areaCalculada.toFixed(2)
                : Number(areaEfetiva?.areaEfetiva || 0).toFixed(2)}{" "}
              alq
            </span>
          </div>

          {/* Botões de ação */}
          {!readOnly && (
            <div className="flex justify-end gap-2 pt-2">
              {editMode ? (
                <>
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Save className="h-4 w-4" />
                    Salvar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm"
                >
                  Editar manualmente
                </button>
              )}
            </div>
          )}

          {/* Última atualização */}
          {areaEfetiva?.updatedAt && (
            <p className="text-xs text-gray-400 text-right">
              Atualizado em:{" "}
              {new Date(areaEfetiva.updatedAt).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AreaEfetivaCard;
