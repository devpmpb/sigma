import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  User,
  FileText,
  Calendar,
  DollarSign,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Info,
  Layers,
} from "lucide-react";
import solicitacaoBeneficioService, {
  SolicitacaoBeneficio,
  StatusSolicitacao,
} from "../../../../services/comum/solicitacaoBeneficioService";
import { formatarData, formatarMoeda } from "../../../../utils/formatters";

const StatusIcon: React.FC<{ status: string; className?: string }> = ({ status, className = "w-5 h-5" }) => {
  switch (status) {
    case "aprovada":
    case "aprovado":
    case "concluido":
    case "concluida":
      return <CheckCircle className={className} />;
    case "rejeitada":
    case "rejeitado":
    case "cancelada":
    case "cancelado":
      return <XCircle className={className} />;
    case "em_analise":
      return <Clock className={className} />;
    default:
      return <AlertCircle className={className} />;
  }
};

const statusStyles: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  aprovada:  { bg: "bg-green-50",  text: "text-green-800",  border: "border-green-200", icon: "text-green-600" },
  aprovado:  { bg: "bg-green-50",  text: "text-green-800",  border: "border-green-200", icon: "text-green-600" },
  concluido: { bg: "bg-green-50",  text: "text-green-800",  border: "border-green-200", icon: "text-green-600" },
  concluida: { bg: "bg-green-50",  text: "text-green-800",  border: "border-green-200", icon: "text-green-600" },
  rejeitada: { bg: "bg-red-50",    text: "text-red-800",    border: "border-red-200",   icon: "text-red-600"   },
  rejeitado: { bg: "bg-red-50",    text: "text-red-800",    border: "border-red-200",   icon: "text-red-600"   },
  cancelada: { bg: "bg-gray-50",   text: "text-gray-700",   border: "border-gray-200",  icon: "text-gray-500"  },
  cancelado: { bg: "bg-gray-50",   text: "text-gray-700",   border: "border-gray-200",  icon: "text-gray-500"  },
  em_analise:{ bg: "bg-blue-50",   text: "text-blue-800",   border: "border-blue-200",  icon: "text-blue-600"  },
  pendente:  { bg: "bg-yellow-50", text: "text-yellow-800", border: "border-yellow-200",icon: "text-yellow-600"},
};

function getStyle(status: string) {
  return statusStyles[status] ?? statusStyles.pendente;
}

const InfoRow: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
      {value ?? <span className="text-gray-400 italic">—</span>}
    </dd>
  </div>
);

const SolicitacaoBeneficioView: React.FC = () => {
  const params = useParams({ strict: false }) as any;
  const navigate = useNavigate();
  const id = params.id;

  const [solicitacao, setSolicitacao] = useState<SolicitacaoBeneficio | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const carregar = async () => {
      try {
        const dados = await solicitacaoBeneficioService.getById(id);
        setSolicitacao(dados);
      } catch {
        setErro("Não foi possível carregar a solicitação.");
      } finally {
        setCarregando(false);
      }
    };
    if (id) carregar();
  }, [id]);

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (erro || !solicitacao) {
    return (
      <div className="max-w-3xl mx-auto mt-10 p-6 bg-red-50 rounded-lg border border-red-200 text-red-700">
        <p>{erro ?? "Solicitação não encontrada."}</p>
        <button
          onClick={() => navigate({ to: "/movimentos/comum/solicitacoesBeneficios" as any })}
          className="mt-4 text-sm underline"
        >
          Voltar para a lista
        </button>
      </div>
    );
  }

  const style = getStyle(solicitacao.status);
  const statusLabel = solicitacaoBeneficioService.formatarStatus(solicitacao.status);
  const detalhes = solicitacao.calculoDetalhes as Record<string, any> | null;

  // Labels legíveis para campos dinâmicos do calculoDetalhes
  const LABELS_DETALHES: Record<string, string> = {
    regraAtendida: "Regra",
    areaEfetiva: "Área Efetiva",
    condicao: "Condição",
    valorBase: "Valor Base",
    percentualAplicado: "Percentual",
    migradoDe: "Origem",
    arquivo: "Arquivo",
    veterinario: "Veterinário",
    procedimento: "Procedimento",
    valorTotal: "Valor Total",
    valorSubsidio: "Valor Subsídio",
    percentual: "Percentual Subsídio",
    numeroAutorizacao: "N° Autorização",
    autorizacao: "N° Autorização",
    numeroOriginal: "N° Original",
    aba: "Período",
    mes: "Mês",
    linha: "Localidade",
    quant_kg: "Quantidade (kg)",
    servico: "Serviço",
    totalHoras: "Total Horas",
    produtorPagou: "Valor Pago Produtor",
    valorVR: "Valor VR",
    m3Pedras: "Pedras (m³)",
    vaca: "Vaca",
    touro: "Touro",
    linhaOriginal: "Linha Planilha",
  };

  // Campos que não devem ser mostrados (metadados internos)
  const CAMPOS_OCULTOS = ["observacoes", "limiteAplicado"];

  // Formata valor de detalhe para exibição
  const formatarDetalhe = (chave: string, valor: any): string => {
    if (valor == null || valor === "") return "";
    if (["valorBase", "valorTotal", "valorSubsidio", "produtorPagou", "valorVR"].includes(chave)) {
      return formatarMoeda(Number(valor));
    }
    if (chave === "percentual" || chave === "percentualAplicado") {
      return `${valor}%`;
    }
    if (chave === "areaEfetiva") {
      return `${valor} ha`;
    }
    return String(valor);
  };

  // Gera label legível a partir da chave
  const labelDetalhe = (chave: string): string => {
    if (LABELS_DETALHES[chave]) return LABELS_DETALHES[chave];
    // Transforma snake_case/camelCase em texto legível
    return chave
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^./, (c) => c.toUpperCase());
  };

  // Mapeia modalidade para texto legível
  const formatarModalidade = (mod?: string) => {
    if (!mod) return null;
    const map: Record<string, string> = {
      SUBSIDIO: "Subsídio",
      SERVICO: "Serviço",
      APLICACAO_SUBSIDIADA: "Aplicação Subsidiada",
      RETIRADA_SEMEN: "Retirada de Sêmen",
      REEMBOLSO: "Reembolso",
    };
    return map[mod] || mod;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate({ to: "/movimentos/comum/solicitacoesBeneficios" as any })}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          title="Voltar"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Solicitação #{solicitacao.id}
          </h1>
          <p className="text-sm text-gray-500">Visualização somente leitura</p>
        </div>
      </div>

      {/* Banner de status */}
      <div className={`rounded-xl border p-4 flex items-center gap-4 ${style.bg} ${style.border}`}>
        <div className={`p-3 rounded-full bg-white shadow-sm ${style.icon}`}>
          <StatusIcon status={solicitacao.status} className="w-6 h-6" />
        </div>
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide ${style.text} opacity-70`}>Status</p>
          <p className={`text-xl font-bold ${style.text}`}>{statusLabel}</p>
        </div>
        {solicitacao.valorCalculado != null && solicitacao.valorCalculado > 0 && (
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Valor do Benefício</p>
            <p className="text-2xl font-bold text-gray-800">
              {formatarMoeda(solicitacao.valorCalculado)}
            </p>
          </div>
        )}
      </div>

      {/* Grid de cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Beneficiário */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
            <User className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">Beneficiário</h2>
          </div>
          <dl className="px-4 divide-y divide-gray-100">
            <InfoRow label="Nome" value={<span className="font-medium">{solicitacao.pessoa.nome}</span>} />
            <InfoRow label="CPF/CNPJ" value={solicitacao.pessoa.cpfCnpj} />
            {solicitacao.pessoa.telefone && (
              <InfoRow label="Telefone" value={solicitacao.pessoa.telefone} />
            )}
            {solicitacao.pessoa.email && (
              <InfoRow label="E-mail" value={solicitacao.pessoa.email} />
            )}
            {solicitacao.pessoa.inscricaoEstadual && (
              <InfoRow label="Insc. Estadual" value={solicitacao.pessoa.inscricaoEstadual} />
            )}
          </dl>
        </div>

        {/* Programa */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
            <Layers className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">Programa</h2>
          </div>
          <dl className="px-4 divide-y divide-gray-100">
            <InfoRow label="Nome" value={<span className="font-medium">{solicitacao.programa.nome}</span>} />
            <InfoRow label="Secretaria" value={solicitacao.programa.secretaria} />
            <InfoRow label="Tipo" value={solicitacao.programa.tipoPrograma} />
          </dl>
        </div>

        {/* Dados da solicitação */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
            <FileText className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">Dados da Solicitação</h2>
          </div>
          <dl className="px-4 divide-y divide-gray-100">
            <InfoRow
              label="Data"
              value={
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatarData(solicitacao.datasolicitacao)}
                </span>
              }
            />
            {solicitacao.modalidade && (
              <InfoRow label="Modalidade" value={formatarModalidade(solicitacao.modalidade)} />
            )}
            {solicitacao.enquadramento && (
              <InfoRow label="Enquadramento" value={solicitacao.enquadramento} />
            )}
            {solicitacao.quantidadeSolicitada != null && (
              <InfoRow
                label="Quantidade"
                value={
                  <span className="flex items-center gap-1">
                    <Package className="w-4 h-4 text-gray-400" />
                    {solicitacao.quantidadeSolicitada}
                  </span>
                }
              />
            )}
            {solicitacao.valorCalculado != null && solicitacao.valorCalculado > 0 && (
              <InfoRow
                label="Valor"
                value={
                  <span className="flex items-center gap-1 font-semibold text-green-700">
                    <DollarSign className="w-4 h-4" />
                    {formatarMoeda(solicitacao.valorCalculado)}
                  </span>
                }
              />
            )}
            {solicitacao.observacoes && (
              <InfoRow label="Observações" value={solicitacao.observacoes} />
            )}
          </dl>
        </div>

        {/* Detalhes do cálculo (se existirem) */}
        {detalhes && Object.keys(detalhes).length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
              <Info className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-700">Detalhes</h2>
            </div>
            <dl className="px-4 divide-y divide-gray-100">
              {Object.entries(detalhes)
                .filter(([chave, valor]) => {
                  if (CAMPOS_OCULTOS.includes(chave)) return false;
                  if (valor == null || valor === "") return false;
                  // observacoes array é tratado separadamente
                  if (chave === "observacoes" && Array.isArray(valor)) return false;
                  return true;
                })
                .map(([chave, valor]) => (
                  <InfoRow
                    key={chave}
                    label={labelDetalhe(chave)}
                    value={formatarDetalhe(chave, valor)}
                  />
                ))}
              {detalhes.observacoes && Array.isArray(detalhes.observacoes) && detalhes.observacoes.length > 0 && (
                <InfoRow
                  label="Notas"
                  value={
                    <ul className="list-disc list-inside space-y-1">
                      {detalhes.observacoes.map((obs: string, i: number) => (
                        <li key={i} className="text-sm">{obs}</li>
                      ))}
                    </ul>
                  }
                />
              )}
            </dl>
          </div>
        )}
      </div>

      {/* Rodapé com datas de sistema */}
      <div className="text-xs text-gray-400 flex gap-6 pt-2 border-t border-gray-100">
        <span>Criado em: {formatarData(solicitacao.createdAt)}</span>
        <span>Atualizado em: {formatarData(solicitacao.updatedAt)}</span>
      </div>
    </div>
  );
};

export default SolicitacaoBeneficioView;
