/**
 * Script de Migração - Piscicultura 2023
 *
 * Planilha: Piscicultura - 2023.xlsx
 * Total estimado: 52 registros
 * Programa no SIGMA: ID 9 - "Alevinos (Legado)"
 *
 * Estrutura da planilha:
 * - Colunas: Nº | PRODUTOR | LINHA | Quant. | DATA | R$
 * - Abas: meses de 2023
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import prisma from '../../src/utils/prisma';

const ARQUIVO_PLANILHA = 'C:\\Users\\marce\\Downloads\\2023\\Piscicultura - 2023.xlsx';
const PROGRAMA_ID = 9; // Alevinos (Legado)
const ANO_REFERENCIA = 2023;

interface RegistroPiscicultura {
  numero: number;
  produtor: string;
  linha: string;
  quantidade: number;
  data: Date;
  valor: number;
  mes: string;
}

// Converte data serial do Excel para Date JS
function excelDateToJSDate(serial: number): Date {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  return new Date(utc_value * 1000);
}

// Normaliza nome para busca
function normalizarNome(nome: string): string {
  return nome
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Busca pessoa por nome
async function buscarPessoaPorNome(nome: string): Promise<number | null> {
  const pessoaExata = await prisma.pessoa.findFirst({
    where: {
      nome: {
        equals: nome,
        mode: 'insensitive'
      }
    }
  });

  if (pessoaExata) return pessoaExata.id;

  const pessoas = await prisma.pessoa.findMany({
    where: {
      nome: {
        contains: nome.split(' ')[0],
        mode: 'insensitive'
      }
    }
  });

  const nomeNormalizado = normalizarNome(nome);
  for (const pessoa of pessoas) {
    const nomePessoaNorm = normalizarNome(pessoa.nome);
    if (nomePessoaNorm.includes(nomeNormalizado) || nomeNormalizado.includes(nomePessoaNorm)) {
      return pessoa.id;
    }
  }

  return null;
}

// Extrai dados de uma aba
function extrairDadosAba(workbook: XLSX.WorkBook, sheetName: string): RegistroPiscicultura[] {
  const sheet = workbook.Sheets[sheetName];
  const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];

  const registros: RegistroPiscicultura[] = [];

  // Encontrar linha do cabeçalho
  let headerIndex = -1;
  for (let i = 0; i < Math.min(10, dados.length); i++) {
    const row = dados[i];
    if (row && row.some(cell => String(cell).includes('PRODUTOR'))) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    console.log(`  ⚠️ Cabeçalho não encontrado na aba "${sheetName}"`);
    return [];
  }

  // Mapear índices das colunas
  const header = dados[headerIndex].map((c: any) => String(c).toUpperCase().trim());
  const idxProdutor = header.findIndex(h => h.includes('PRODUTOR'));
  const idxLinha = header.findIndex(h => h.includes('LINHA'));
  const idxQuant = header.findIndex(h => h.includes('QUANT'));
  const idxData = header.findIndex(h => h.includes('DATA'));
  const idxValor = header.findIndex(h => h.includes('R$') || h.includes('VALOR'));

  // Processar linhas de dados
  for (let i = headerIndex + 1; i < dados.length; i++) {
    const row = dados[i];

    if (!row || !row[0]) continue;
    if (typeof row[0] !== 'number') continue;

    const produtor = String(row[idxProdutor] || '').trim();
    if (!produtor || produtor.length < 3) continue;

    // Converter data
    let data: Date;
    const dataRaw = row[idxData];
    if (typeof dataRaw === 'number') {
      data = excelDateToJSDate(dataRaw);
    } else {
      data = new Date(dataRaw);
      if (isNaN(data.getTime())) {
        const mesMatch = sheetName.match(/(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i);
        const meses: Record<string, number> = {
          janeiro: 0, fevereiro: 1, março: 2, abril: 3, maio: 4, junho: 5,
          julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11
        };
        const mesNum = mesMatch ? meses[mesMatch[1].toLowerCase()] : 0;
        data = new Date(ANO_REFERENCIA, mesNum, 15);
      }
    }

    registros.push({
      numero: row[0],
      produtor,
      linha: String(row[idxLinha] || ''),
      quantidade: Number(row[idxQuant]) || 0,
      data,
      valor: Number(row[idxValor]) || 0,
      mes: sheetName
    });
  }

  return registros;
}

async function migrarPiscicultura() {
  console.log('='.repeat(80));
  console.log('MIGRAÇÃO - PISCICULTURA 2023');
  console.log('='.repeat(80));

  // Verificar se programa existe
  const programa = await prisma.programa.findUnique({
    where: { id: PROGRAMA_ID }
  });

  if (!programa) {
    console.error(`❌ Programa ID ${PROGRAMA_ID} não encontrado!`);
    return;
  }
  console.log(`✅ Programa: ${programa.nome}`);

  // Ler planilha
  const workbook = XLSX.readFile(ARQUIVO_PLANILHA);
  console.log(`📁 Arquivo: ${path.basename(ARQUIVO_PLANILHA)}`);
  console.log(`📋 Abas: ${workbook.SheetNames.join(', ')}`);

  // Extrair todos os registros
  const todosRegistros: RegistroPiscicultura[] = [];

  for (const sheetName of workbook.SheetNames) {
    const registros = extrairDadosAba(workbook, sheetName);
    console.log(`  ${sheetName}: ${registros.length} registros`);
    todosRegistros.push(...registros);
  }

  console.log(`\nTotal de registros extraídos: ${todosRegistros.length}`);

  // Estatísticas
  const stats = {
    total: todosRegistros.length,
    migrados: 0,
    pessoasNaoEncontradas: 0,
    erros: 0,
    valorTotal: 0,
    quantidadeTotal: 0,
    pessoasNaoEncontradasNomes: new Set<string>()
  };

  console.log('\nProcessando registros...');

  for (const registro of todosRegistros) {
    try {
      const pessoaId = await buscarPessoaPorNome(registro.produtor);

      if (!pessoaId) {
        stats.pessoasNaoEncontradas++;
        stats.pessoasNaoEncontradasNomes.add(registro.produtor);
        continue;
      }

      // Verificar duplicata
      const existente = await prisma.solicitacaoBeneficio.findFirst({
        where: {
          pessoaId,
          programaId: PROGRAMA_ID,
          datasolicitacao: registro.data,
          quantidadeSolicitada: registro.quantidade
        }
      });

      if (existente) continue;

      // Criar solicitação
      await prisma.solicitacaoBeneficio.create({
        data: {
          pessoaId,
          programaId: PROGRAMA_ID,
          datasolicitacao: registro.data,
          status: 'concluido',
          observacoes: `Migrado da planilha 2023 | Linha: ${registro.linha}`,
          quantidadeSolicitada: registro.quantidade,
          valorCalculado: registro.valor,
          modalidade: 'MATERIAL',
          calculoDetalhes: {
            migradoDe: 'Planilha Excel 2023',
            mes: registro.mes,
            numeroOriginal: registro.numero,
            linha: registro.linha,
            quantidade: registro.quantidade,
            valor: registro.valor
          }
        }
      });

      stats.migrados++;
      stats.valorTotal += registro.valor;
      stats.quantidadeTotal += registro.quantidade;

      if (stats.migrados % 50 === 0) {
        console.log(`  Migrados: ${stats.migrados}/${todosRegistros.length}`);
      }

    } catch (error) {
      stats.erros++;
      console.error(`  Erro no registro ${registro.numero} (${registro.produtor}):`, error);
    }
  }

  // Relatório final
  console.log('\n' + '='.repeat(80));
  console.log('RELATÓRIO FINAL');
  console.log('='.repeat(80));
  console.log(`Total de registros: ${stats.total}`);
  console.log(`Migrados com sucesso: ${stats.migrados}`);
  console.log(`Quantidade total: ${stats.quantidadeTotal} alevinos`);
  console.log(`Valor total migrado: R$ ${stats.valorTotal.toFixed(2)}`);
  console.log(`Pessoas não encontradas: ${stats.pessoasNaoEncontradas}`);
  console.log(`Erros: ${stats.erros}`);

  if (stats.pessoasNaoEncontradasNomes.size > 0) {
    console.log('\nPessoas não encontradas:');
    const nomes = Array.from(stats.pessoasNaoEncontradasNomes).sort();
    nomes.forEach(nome => console.log(`  - ${nome}`));
  }
}

migrarPiscicultura()
  .then(() => {
    console.log('\n✅ Migração concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  });
