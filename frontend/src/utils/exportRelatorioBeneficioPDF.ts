// frontend/src/utils/exportRelatorioBeneficioPDF.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  RelatorioPorPrograma,
  RelatorioProdutores,
  RelatorioInvestimento,
  RelatorioPorSecretaria,
} from "../services/comum/relatorioBeneficioService";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("pt-BR");
};

interface FiltrosRelatorio {
  dataInicio?: string;
  dataFim?: string;
  programaId?: string;
  status?: string;
  agrupamento?: string;
}

export const exportRelatorioPorProgramaPDF = (
  data: RelatorioPorPrograma,
  filtros: FiltrosRelatorio
) => {
  const doc = new jsPDF();
  const hoje = new Date().toLocaleDateString("pt-BR");

  // Cabeçalho
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Benefícios", 14, 15);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Por Programa", 14, 22);

  doc.setFontSize(10);
  doc.text(`Data de Geração: ${hoje}`, 14, 28);

  let yPosition = 35;

  // Filtros aplicados
  if (filtros.dataInicio || filtros.dataFim || filtros.status) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Filtros aplicados:", 14, yPosition);
    doc.setFont("helvetica", "normal");
    yPosition += 5;
    if (filtros.dataInicio) {
      doc.text(`Período: ${formatDate(filtros.dataInicio)} até ${formatDate(filtros.dataFim) || "Atual"}`, 14, yPosition);
      yPosition += 5;
    }
    if (filtros.status) {
      doc.text(`Status: ${filtros.status}`, 14, yPosition);
      yPosition += 5;
    }
    yPosition += 3;
  }

  // Resumo
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo Geral:", 14, yPosition);
  yPosition += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Total de Solicitações: ${data.totais.totalSolicitacoes}`, 14, yPosition);
  yPosition += 5;
  doc.text(`Valor Total: ${formatCurrency(data.totais.valorTotal)}`, 14, yPosition);
  yPosition += 10;

  // Tabela
  autoTable(doc, {
    startY: yPosition,
    head: [["Programa", "Solicitações", "Valor Total", "Status"]],
    body: data.resumo.map((item) => [
      item.programa,
      item.totalSolicitacoes.toString(),
      formatCurrency(item.valorTotal),
      Object.entries(item.porStatus)
        .map(([status, qtd]) => `${status}: ${qtd}`)
        .join(", "),
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 25, halign: "center" },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: "auto" },
    },
  });

  // Rodapé
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  const nomeArquivo = `relatorio-beneficios-programa-${hoje.replace(/\//g, "-")}.pdf`;
  doc.save(nomeArquivo);
};

export const exportRelatorioProdutoresPDF = (
  data: RelatorioProdutores,
  filtros: FiltrosRelatorio
) => {
  const doc = new jsPDF();
  const hoje = new Date().toLocaleDateString("pt-BR");

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Benefícios", 14, 15);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Produtores Beneficiados", 14, 22);

  doc.setFontSize(10);
  doc.text(`Data de Geração: ${hoje}`, 14, 28);

  let yPosition = 35;

  if (filtros.dataInicio || filtros.dataFim) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Filtros aplicados:", 14, yPosition);
    doc.setFont("helvetica", "normal");
    yPosition += 5;
    if (filtros.dataInicio) {
      doc.text(`Período: ${formatDate(filtros.dataInicio)} até ${formatDate(filtros.dataFim) || "Atual"}`, 14, yPosition);
      yPosition += 5;
    }
    yPosition += 3;
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo Geral:", 14, yPosition);
  yPosition += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Total de Produtores: ${data.totais.totalProdutores}`, 14, yPosition);
  yPosition += 5;
  doc.text(`Total de Benefícios: ${data.totais.totalBeneficios}`, 14, yPosition);
  yPosition += 10;

  autoTable(doc, {
    startY: yPosition,
    head: [["Produtor", "CPF/CNPJ", "Benefícios", "Total Recebido"]],
    body: data.produtores.map((item) => [
      item.pessoa.nome,
      item.pessoa.cpfCnpj,
      item.quantidadeBeneficios.toString(),
      formatCurrency(item.totalRecebido),
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [147, 51, 234],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 40 },
      2: { cellWidth: 25, halign: "center" },
      3: { cellWidth: 35, halign: "right" },
    },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  const nomeArquivo = `relatorio-beneficios-produtores-${hoje.replace(/\//g, "-")}.pdf`;
  doc.save(nomeArquivo);
};

export const exportRelatorioInvestimentoPDF = (
  data: RelatorioInvestimento,
  filtros: FiltrosRelatorio
) => {
  const doc = new jsPDF();
  const hoje = new Date().toLocaleDateString("pt-BR");

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Benefícios", 14, 15);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Investimento por Período", 14, 22);

  doc.setFontSize(10);
  doc.text(`Data de Geração: ${hoje}`, 14, 28);

  let yPosition = 35;

  if (filtros.dataInicio || filtros.dataFim || filtros.agrupamento) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Filtros aplicados:", 14, yPosition);
    doc.setFont("helvetica", "normal");
    yPosition += 5;
    if (filtros.dataInicio) {
      doc.text(`Período: ${formatDate(filtros.dataInicio)} até ${formatDate(filtros.dataFim) || "Atual"}`, 14, yPosition);
      yPosition += 5;
    }
    if (filtros.agrupamento) {
      doc.text(`Agrupamento: ${filtros.agrupamento}`, 14, yPosition);
      yPosition += 5;
    }
    yPosition += 3;
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo Geral:", 14, yPosition);
  yPosition += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Quantidade Total: ${data.totais.quantidadeTotal}`, 14, yPosition);
  yPosition += 5;
  doc.text(`Valor Total: ${formatCurrency(data.totais.valorTotal)}`, 14, yPosition);
  yPosition += 10;

  autoTable(doc, {
    startY: yPosition,
    head: [["Período", "Solicitações", "Valor Investido"]],
    body: data.periodos.map((item) => [
      item.periodo,
      item.quantidadeSolicitacoes.toString(),
      formatCurrency(item.totalInvestido),
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 40, halign: "center" },
      2: { cellWidth: 50, halign: "right" },
    },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  const nomeArquivo = `relatorio-beneficios-investimento-${hoje.replace(/\//g, "-")}.pdf`;
  doc.save(nomeArquivo);
};

export const exportRelatorioSecretariaPDF = (
  data: RelatorioPorSecretaria,
  filtros: FiltrosRelatorio
) => {
  const doc = new jsPDF();
  const hoje = new Date().toLocaleDateString("pt-BR");

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Benefícios", 14, 15);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Por Secretaria", 14, 22);

  doc.setFontSize(10);
  doc.text(`Data de Geração: ${hoje}`, 14, 28);

  let yPosition = 35;

  if (filtros.dataInicio || filtros.dataFim) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Filtros aplicados:", 14, yPosition);
    doc.setFont("helvetica", "normal");
    yPosition += 5;
    if (filtros.dataInicio) {
      doc.text(`Período: ${formatDate(filtros.dataInicio)} até ${formatDate(filtros.dataFim) || "Atual"}`, 14, yPosition);
      yPosition += 5;
    }
    yPosition += 3;
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo Geral:", 14, yPosition);
  yPosition += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Quantidade Total: ${data.totais.quantidadeTotal}`, 14, yPosition);
  yPosition += 5;
  doc.text(`Valor Total: ${formatCurrency(data.totais.valorTotal)}`, 14, yPosition);
  yPosition += 10;

  autoTable(doc, {
    startY: yPosition,
    head: [["Secretaria", "Solicitações", "Total Investido"]],
    body: data.secretarias.map((item) => [
      item.secretaria,
      item.quantidadeSolicitacoes.toString(),
      formatCurrency(item.totalInvestido),
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [249, 115, 22],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 40, halign: "center" },
      2: { cellWidth: 50, halign: "right" },
    },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  const nomeArquivo = `relatorio-beneficios-secretaria-${hoje.replace(/\//g, "-")}.pdf`;
  doc.save(nomeArquivo);
};
