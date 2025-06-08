// frontend/src/components/exemplos/ExemploConfiguracaoLeis.tsx
import React, { useState } from "react";
import { programaService, regrasNegocioService } from "../../services";

/**
 * Componente demonstrativo de como configurar as leis de exemplo
 * Baseado nas leis 1321/2013 e 797/2006 de Pato Bragado
 */
const ExemploConfiguracaoLeis: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const configurarLeiGraoAveia = async () => {
    setLoading(true);
    setMessage("");

    try {
      // 1. Criar o programa baseado na LEI Nº 1321/2013
      const programa = await programaService.create({
        nome: "Programa de Recuperação da Fertilidade do Solo",
        descricao: "Programa com objetivo de melhorar a qualidade do solo e o aumento da produtividade de cereais e leite, através do subsídio na aquisição de grão de aveia",
        leiNumero: "LEI Nº 1321/2013",
        tipoPrograma: "subsidio",
        ativo: true
      });

      // 2. Criar regra para produtores com até 6 alqueires (R$ 0,80/kg, limitado a 450kg)
      await regrasNegocioService.create({
        programaId: programa.id,
        tipoRegra: "area_efetiva",
        parametro: {
          condicao: "menor_que",
          valor: 6,
          unidade: "alqueires",
          descricao: "Área efetiva até 6 alqueires"
        },
        valorBeneficio: 0.80,
        limiteBeneficio: {
          tipo: "quantidade",
          limite: 450,
          unidade: "kg",
          multiplicador: {
            base: "area",
            fator: 150 // 150kg por alqueire
          },
          limitePorPeriodo: {
            periodo: "anual",
            quantidade: 1
          }
        }
      });

      // 3. Criar regra para produtores acima de 6 alqueires (R$ 0,70/kg, limitado a 450kg)
      await regrasNegocioService.create({
        programaId: programa.id,
        tipoRegra: "area_efetiva",
        parametro: {
          condicao: "maior_que",
          valor: 6,
          unidade: "alqueires",
          descricao: "Área efetiva acima de 6 alqueires"
        },
        valorBeneficio: 0.70,
        limiteBeneficio: {
          tipo: "quantidade",
          limite: 450,
          unidade: "kg",
          multiplicador: {
            base: "area",
            fator: 150 // 150kg por alqueire
          },
          limitePorPeriodo: {
            periodo: "anual",
            quantidade: 1
          }
        }
      });

      setMessage("✅ LEI Nº 1321/2013 configurada com sucesso!");
    } catch (error: any) {
      console.error("Erro:", error);
      setMessage(`❌ Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const configurarLeiAduboOrganico = async () => {
    setLoading(true);
    setMessage("");

    try {
      // 1. Criar o programa baseado na LEI Nº 797/2006
      const programa = await programaService.create({
        nome: "Programa de Incentivo ao uso de Adubo Orgânico - Pró-orgânico",
        descricao: "Programa com o objetivo de melhorar a fertilidade do solo, melhorando a produção e consequentemente a distribuição de renda no setor produtivo rural",
        leiNumero: "LEI Nº 797/2006",
        tipoPrograma: "subsidio",
        ativo: true
      });

      // 2. Regra para produtores com até 6 alqueires (R$ 70,00/ton, limitado a 10 ton)
      await regrasNegocioService.create({
        programaId: programa.id,
        tipoRegra: "area_efetiva",
        parametro: {
          condicao: "menor_que",
          valor: 6,
          unidade: "alqueires",
          descricao: "Área igual ou inferior a 6,0 alqueires"
        },
        valorBeneficio: 70.00,
        limiteBeneficio: {
          tipo: "quantidade",
          limite: 10,
          unidade: "toneladas",
          limitePorPeriodo: {
            periodo: "bienal", // Benefício com interstício de dois anos
            quantidade: 1
          }
        }
      });

      // 3. Regra para produtores acima de 6 alqueires (R$ 50,00/ton, limitado a 10 ton)
      await regrasNegocioService.create({
        programaId: programa.id,
        tipoRegra: "area_efetiva",
        parametro: {
          condicao: "maior_que",
          valor: 6,
          unidade: "alqueires",
          descricao: "Área superior a 6,0 alqueires"
        },
        valorBeneficio: 50.00,
        limiteBeneficio: {
          tipo: "quantidade",
          limite: 10,
          unidade: "toneladas",
          limitePorPeriodo: {
            periodo: "bienal",
            quantidade: 1
          }
        }
      });

      // 4. Regra adicional: Renda familiar deve ser majoritariamente da agricultura (80%)
      await regrasNegocioService.create({
        programaId: programa.id,
        tipoRegra: "renda_familiar",
        parametro: {
          condicao: "maior_que",
          valor: 80,
          unidade: "percentual",
          descricao: "Renda familiar bruta oriunda da produção agropecuária"
        },
        valorBeneficio: 0, // Regra de elegibilidade, sem valor
        limiteBeneficio: null
      });

      setMessage("✅ LEI Nº 797/2006 configurada com sucesso!");
    } catch (error: any) {
      console.error("Erro:", error);
      setMessage(`❌ Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">
        🎯 Exemplos de Configuração de Leis
      </h2>
      
      <p className="text-gray-600 mb-6">
        Demonstração de como configurar os programas de incentivo baseados nas leis 
        reais de Pato Bragado-PR. Estes exemplos mostram a flexibilidade do sistema 
        para diferentes tipos de regras de negócio.
      </p>

      <div className="space-y-6">
        {/* LEI Nº 1321/2013 - Grão de Aveia */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-700 mb-2">
            LEI Nº 1321/2013 - Programa de Recuperação da Fertilidade do Solo
          </h3>
          
          <div className="text-sm text-gray-600 mb-4">
            <strong>Objetivo:</strong> Subsídio na aquisição de grão de aveia
            <br />
            <strong>Benefícios:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Até 6 alqueires: R$ 0,80/kg (limitado a 450kg = máx. 150kg/alqueire)</li>
              <li>Acima de 6 alqueires: R$ 0,70/kg (limitado a 450kg = máx. 150kg/alqueire)</li>
              <li>Subsídio anual com apresentação de nota fiscal</li>
            </ul>
          </div>

          <button
            onClick={configurarLeiGraoAveia}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? "Configurando..." : "🌾 Configurar Lei do Grão de Aveia"}
          </button>
        </div>

        {/* LEI Nº 797/2006 - Adubo Orgânico */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-700 mb-2">
            LEI Nº 797/2006 - Programa Pró-orgânico
          </h3>
          
          <div className="text-sm text-gray-600 mb-4">
            <strong>Objetivo:</strong> Incentivo ao uso de adubo orgânico
            <br />
            <strong>Benefícios:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Até 6 alqueires: R$ 70,00/tonelada (limitado a 10 toneladas)</li>
              <li>Acima de 6 alqueires: R$ 50,00/tonelada (limitado a 10 toneladas)</li>
              <li>Benefício bienal (a cada 2 anos)</li>
              <li>Renda familiar deve ser 80% da agropecuária</li>
            </ul>
          </div>

          <button
            onClick={configurarLeiAduboOrganico}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? "Configurando..." : "🌱 Configurar Lei do Adubo Orgânico"}
          </button>
        </div>

        {/* Mensagem de resultado */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.includes("✅") 
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {message}
          </div>
        )}

        {/* Explicação técnica */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">
            💡 Como funciona a configuração
          </h4>
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              <strong>1. Programa:</strong> Criamos o programa principal com nome, descrição e tipo
            </p>
            <p>
              <strong>2. Regras de Área:</strong> Configuramos diferentes valores baseados na área efetiva
            </p>
            <p>
              <strong>3. Limites:</strong> Definimos limites por quantidade, multiplicadores por área e períodos
            </p>
            <p>
              <strong>4. Regras Adicionais:</strong> Critérios de elegibilidade como porcentagem de renda
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExemploConfiguracaoLeis;