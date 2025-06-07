// frontend/src/components/simulador/SimuladorRegras.tsx
import React, { useState, useEffect } from "react";
import { 
  programaService, 
  regrasNegocioService,
  Programa,
  RegrasNegocio,
  ProdutorData,
  ValidacaoRegra 
} from "../../services";

/**
 * Simulador para testar regras de negócio configuradas
 * Permite simular diferentes cenários de produtores
 */
const SimuladorRegras: React.FC = () => {
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [selectedPrograma, setSelectedPrograma] = useState<number>(0);
  const [regras, setRegras] = useState<RegrasNegocio[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ValidacaoRegra[]>([]);

  // Dados do produtor para simulação
  const [produtorData, setProdutorData] = useState<ProdutorData>({
    areaEfetiva: 5,
    rendaFamiliar: 45000,
    tipoProdutor: "familiar",
    tempoAtividade: 10,
    possuiDAP: true,
    idade: 45,
    localizacao: "Pato Bragado-PR"
  });

  // Carregar programas
  useEffect(() => {
    const loadProgramas = async () => {
      try {
        const data = await programaService.getAll();
        setProgramas(data.filter(p => p.ativo));
      } catch (error) {
        console.error("Erro ao carregar programas:", error);
      }
    };

    loadProgramas();
  }, []);

  // Carregar regras quando programa mudar
  useEffect(() => {
    const loadRegras = async () => {
      if (selectedPrograma) {
        try {
          const data = await regrasNegocioService.getByPrograma(selectedPrograma);
          setRegras(data);
        } catch (error) {
          console.error("Erro ao carregar regras:", error);
        }
      } else {
        setRegras([]);
      }
    };

    loadRegras();
  }, [selectedPrograma]);

  // Simular todas as regras do programa
  const simularRegras = async () => {
    if (!regras.length) {
      alert("Selecione um programa com regras configuradas");
      return;
    }

    setLoading(true);
    const resultados: ValidacaoRegra[] = [];

    try {
      for (const regra of regras) {
        try {
          const resultado = await regrasNegocioService.validarRegra(regra.id, produtorData);
          resultados.push(resultado);
        } catch (error) {
          console.error(`Erro ao validar regra ${regra.id}:`, error);
          // Adicionar resultado de erro
          resultados.push({
            regraId: regra.id,
            programa: regra.programa?.nome || "",
            tipoRegra: regra.tipoRegra,
            atende: false,
            motivo: "Erro na validação",
            valorCalculado: 0,
            limiteCalculado: 0
          });
        }
      }

      setResults(resultados);
    } catch (error) {
      console.error("Erro geral na simulação:", error);
    } finally {
      setLoading(false);
    }
  };

  // Atualizar dados do produtor
  const updateProdutorData = (field: keyof ProdutorData, value: any) => {
    setProdutorData(prev => ({ ...prev, [field]: value }));
  };

  // Calcular totais
  const calcularTotais = () => {
    const regrasAtendidas = results.filter(r => r.atende);
    const valorTotal = regrasAtendidas.reduce((total, r) => total + r.valorCalculado, 0);
    const limiteTotal = regrasAtendidas.reduce((total, r) => total + r.limiteCalculado, 0);

    return {
      regrasAtendidas: regrasAtendidas.length,
      totalRegras: results.length,
      valorTotal,
      limiteTotal
    };
  };

  const totais = calcularTotais();

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">
        🧮 Simulador de Regras de Negócio
      </h2>
      
      <p className="text-gray-600 mb-6">
        Simule diferentes cenários de produtores para testar as regras configuradas
        e verificar elegibilidade para benefícios.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuração da Simulação */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Configuração da Simulação
          </h3>

          {/* Seleção de Programa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Programa para Simular
            </label>
            <select
              value={selectedPrograma}
              onChange={(e) => setSelectedPrograma(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Selecione um programa</option>
              {programas.map((programa) => (
                <option key={programa.id} value={programa.id}>
                  {programa.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Dados do Produtor */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">
              Dados do Produtor
            </h4>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Área Efetiva (alqueires)
                  </label>
                  <input
                    type="number"
                    value={produtorData.areaEfetiva || ""}
                    onChange={(e) => updateProdutorData('areaEfetiva', Number(e.target.value))}
                    step="0.1"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Renda Familiar (R$)
                  </label>
                  <input
                    type="number"
                    value={produtorData.rendaFamiliar || ""}
                    onChange={(e) => updateProdutorData('rendaFamiliar', Number(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Tipo de Produtor
                  </label>
                  <select
                    value={produtorData.tipoProdutor || ""}
                    onChange={(e) => updateProdutorData('tipoProdutor', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="familiar">Familiar</option>
                    <option value="comercial">Comercial</option>
                    <option value="cooperado">Cooperado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Idade
                  </label>
                  <input
                    type="number"
                    value={produtorData.idade || ""}
                    onChange={(e) => updateProdutorData('idade', Number(e.target.value))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={produtorData.possuiDAP || false}
                    onChange={(e) => updateProdutorData('possuiDAP', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
                  />
                  Possui DAP ativa
                </label>
              </div>
            </div>
          </div>

          {/* Botão de Simulação */}
          <button
            onClick={simularRegras}
            disabled={loading || !selectedPrograma}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Simulando...
              </>
            ) : (
              "🚀 Simular Regras"
            )}
          </button>
        </div>

        {/* Resultados */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Resultados da Simulação
          </h3>

          {results.length > 0 ? (
            <>
              {/* Resumo */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">📊 Resumo</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600">Regras Atendidas:</span>
                    <span className="ml-2 font-medium">{totais.regrasAtendidas}/{totais.totalRegras}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Valor Total:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {regrasNegocioService.formatarValorBeneficio(totais.valorTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detalhes por Regra */}
              <div className="space-y-3">
                {results.map((resultado, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-3 ${
                      resultado.atende
                        ? "border-green-200 bg-green-50"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {resultado.tipoRegra.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          resultado.atende
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {resultado.atende ? "✅ Atende" : "❌ Não Atende"}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {resultado.motivo}
                    </p>
                    
                    {resultado.atende && resultado.valorCalculado > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-600">Benefício: </span>
                        <span className="font-medium text-green-600">
                          {regrasNegocioService.formatarValorBeneficio(resultado.valorCalculado)}
                        </span>
                        {resultado.limiteCalculado > 0 && (
                          <>
                            <span className="text-gray-600 ml-3">Limite: </span>
                            <span className="font-medium text-blue-600">
                              {resultado.limiteCalculado}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <p>Selecione um programa e clique em "Simular Regras" para ver os resultados</p>
            </div>
          )}
        </div>
      </div>

      {/* Informações sobre Regras Disponíveis */}
      {selectedPrograma > 0 && regras.length > 0 && (
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">
            📋 Regras Configuradas para este Programa
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {regras.map((regra) => (
              <div key={regra.id} className="text-sm text-gray-600">
                <span className="font-medium">{regra.tipoRegra}:</span>
                <span className="ml-1">
                  {regrasNegocioService.formatarParametro(regra.parametro)}
                </span>
                <span className="ml-2 text-green-600">
                  ({regrasNegocioService.formatarValorBeneficio(regra.valorBeneficio)})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimuladorRegras;