// frontend/src/utils/exportRelatorioArrendamentoPDF.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  RelatorioArrendamentoGeral,
  RelatorioPorPropriedade,
  RelatorioPorArrendatario,
  RelatorioPorAtividade,
  RelatorioVencendo,
} from "../services/agricultura/relatorioArrendamentoService";

const formatArea = (area: number) => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(area) + " ha";
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "Indeterminado";
  return new Date(dateString).toLocaleDateString("pt-BR");
};

interface FiltrosRelatorio {
  dataInicio?: string;
  dataFim?: string;
  status?: string;
  propriedadeId?: string;
  dias?: string;
}

export const exportRelatorioGeralPDF = (
  data: RelatorioArrendamentoGeral,
  filtros: FiltrosRelatorio
) => {
  const doc = new jsPDF();
  const hoje = new Date().toLocaleDateString("pt-BR");

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Arrendamentos", 14, 15);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Relatório Geral", 14, 22);

  doc.setFontSize(10);
  doc.text(`Data de Geração: ${hoje}`, 14, 28);

  let yPosition = 35;

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

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Estatísticas:", 14, yPosition);
  yPosition += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Total de Arrendamentos: ${data.estatisticas.total}`, 14, yPosition);
  yPosition += 5;
  doc.text(`Área Total: ${formatArea(data.estatisticas.areaTotal)}`, 14, yPosition);
  yPosition += 5;
  doc.text(`Propriedades Únicas: ${data.estatisticas.propriedadesUnicas}`, 14, yPosition);
  yPosition += 5;
  doc.text(`Arrendatários Únicos: ${data.estatisticas.arrendatariosUnicos}`, 14, yPosition);
  yPosition += 10;

  autoTable(doc, {
    startY: yPosition,
    head: [["Propriedade", "Arrendatário", "Área", "Status"]],
    body: data.arrendamentos.slice(0, 50).map((item: any) => [
      item.propriedade?.inscricaoCadastral || "N/A",
      item.arrendatario?.nome || "N/A",
      formatArea(item.areaArrendada),
      item.status,
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [34, 197, 94],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
  });

  if (data.arrendamentos.length > 50) {
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    doc.setTextColor(128);
    doc.text(`Nota: Mostrando 50 de ${data.arrendamentos.length} registros`, 14, finalY);
  }

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

  const nomeArquivo = `relatorio-arrendamentos-geral-${hoje.replace(/\//g, "-")}.pdf`;
  doc.save(nomeArquivo);
};

export const exportRelatorioPorPropriedadePDF = (
  data: RelatorioPorPropriedade,
  filtros: FiltrosRelatorio
) => {
  const doc = new jsPDF();
  const hoje = new Date().toLocaleDateString("pt-BR");

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Arrendamentos", 14, 15);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Por Propriedade", 14, 22);

  doc.setFontSize(10);
  doc.text(`Data de Geração: ${hoje}`, 14, 28);

  let yPosition = 35;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo:", 14, yPosition);
  yPosition += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Total de Propriedades: ${data.totais.totalPropriedades}`, 14, yPosition);
  yPosition += 5;
  doc.text(`Total de Arrendamentos: ${data.totais.totalArrendamentos}`, 14, yPosition);
  yPosition += 10;

  data.propriedades.slice(0, 10).forEach((prop, index) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${prop.propriedade.inscricaoCadastral} - ${prop.propriedade.proprietario}`, 14, yPosition);
    yPosition += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Área Total: ${formatArea(prop.propriedade.area)} | Arrendada: ${formatArea(prop.areaArrendadaTotal)}`, 14, yPosition);
    yPosition += 8;

    autoTable(doc, {
      startY: yPosition,
      head: [["Arrendatário", "Área", "Período"]],
      body: prop.arrendamentos.map((arr) => [
        arr.arrendatario,
        formatArea(arr.areaArrendada),
        `${formatDate(arr.dataInicio)} - ${formatDate(arr.dataFim)}`,
      ]),
      theme: "striped",
      headStyles: {
        fillColor: [34, 197, 94],
        fontSize: 8,
      },
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
      },
      margin: { left: 14, right: 14 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 8;
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

  const nomeArquivo = `relatorio-arrendamentos-propriedades-${hoje.replace(/\//g, "-")}.pdf`;
  doc.save(nomeArquivo);
};

export const exportRelatorioPorArrendatarioPDF = (
  data: RelatorioPorArrendatario,
  filtros: FiltrosRelatorio
) => {
  const doc = new jsPDF();
  const hoje = new Date().toLocaleDateString("pt-BR");

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Arrendamentos", 14, 15);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Por Arrendatário", 14, 22);

  doc.setFontSize(10);
  doc.text(`Data de Geração: ${hoje}`, 14, 28);

  let yPosition = 35;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo:", 14, yPosition);
  yPosition += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Total de Arrendatários: ${data.totais.totalArrendatarios}`, 14, yPosition);
  yPosition += 5;
  doc.text(`Total de Arrendamentos: ${data.totais.totalArrendamentos}`, 14, yPosition);
  yPosition += 5;
  doc.text(`Área Total: ${formatArea(data.totais.areaTotal)}`, 14, yPosition);
  yPosition += 10;

  autoTable(doc, {
    startY: yPosition,
    head: [["Arrendatário", "CPF/CNPJ", "Arrendamentos", "Área Total"]],
    body: data.arrendatarios.map((item) => [
      item.arrendatario.nome,
      item.arrendatario.cpfCnpj,
      item.quantidadeArrendamentos.toString(),
      formatArea(item.areaTotal),
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [34, 197, 94],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
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

  const nomeArquivo = `relatorio-arrendamentos-arrendatarios-${hoje.replace(/\//g, "-")}.pdf`;
  doc.save(nomeArquivo);
};

export const exportRelatorioPorAtividadePDF = (
  data: RelatorioPorAtividade,
  filtros: FiltrosRelatorio
) => {
  const doc = new jsPDF();
  const hoje = new Date().toLocaleDateString("pt-BR");

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Arrendamentos", 14, 15);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Por Atividade Produtiva", 14, 22);

  doc.setFontSize(10);
  doc.text(`Data de Geração: ${hoje}`, 14, 28);

  let yPosition = 35;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo:", 14, yPosition);
  yPosition += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Total de Arrendamentos: ${data.totais.totalArrendamentos}`, 14, yPosition);
  yPosition += 5;
  doc.text(`Área Total: ${formatArea(data.totais.areaTotal)}`, 14, yPosition);
  yPosition += 10;

  autoTable(doc, {
    startY: yPosition,
    head: [["Atividade", "Quantidade", "Área Total", "Arrendatários", "Propriedades"]],
    body: data.atividades.map((item) => [
      item.atividade || "Não especificada",
      item.quantidadeArrendamentos.toString(),
      formatArea(item.areaTotal),
      item.arrendatariosUnicos.toString(),
      item.propriedadesUnicas.toString(),
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [34, 197, 94],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 25, halign: "center" },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: 30, halign: "center" },
      4: { cellWidth: 30, halign: "center" },
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

  const nomeArquivo = `relatorio-arrendamentos-atividades-${hoje.replace(/\//g, "-")}.pdf`;
  doc.save(nomeArquivo);
};

export const exportRelatorioVencendoPDF = (
  data: RelatorioVencendo,
  filtros: FiltrosRelatorio
) => {
  const doc = new jsPDF();
  const hoje = new Date().toLocaleDateString("pt-BR");

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(220, 38, 38);
  doc.text("Relatório de Arrendamentos", 14, 15);

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text("Contratos Vencendo", 14, 22);

  doc.setFontSize(10);
  doc.text(`Data de Geração: ${hoje}`, 14, 28);

  let yPosition = 35;

  if (filtros.dias) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Vencendo em: ${filtros.dias} dias`, 14, yPosition);
    yPosition += 7;
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(220, 38, 38);
  doc.text("⚠️ ATENÇÃO:", 14, yPosition);
  doc.setTextColor(0, 0, 0);
  yPosition += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Vencendo: ${data.estatisticas.total}`, 14, yPosition);
  yPosition += 5;
  doc.text(`Urgentes (≤7 dias): ${data.estatisticas.urgentes}`, 14, yPosition);
  yPosition += 5;
  doc.text(`Área Total: ${formatArea(data.estatisticas.areaTotal)}`, 14, yPosition);
  yPosition += 10;

  autoTable(doc, {
    startY: yPosition,
    head: [["Propriedade", "Arrendatário", "Área", "Data Fim", "Dias"]],
    body: data.arrendamentos.map((item: any) => {
      const dataFim = new Date(item.dataFim);
      const agora = new Date();
      const diasRestantes = Math.ceil((dataFim.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));
      return [
        item.propriedade?.inscricaoCadastral || "N/A",
        item.arrendatario?.nome || "N/A",
        formatArea(item.areaArrendada),
        formatDate(item.dataFim),
        diasRestantes.toString(),
      ];
    }),
    theme: "grid",
    headStyles: {
      fillColor: [220, 38, 38],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      4: { halign: "center", textColor: [220, 38, 38], fontStyle: "bold" },
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

  const nomeArquivo = `relatorio-arrendamentos-vencendo-${hoje.replace(/\//g, "-")}.pdf`;
  doc.save(nomeArquivo);
};
