/**
 * Script de Migração - Inseminação 2023
 *
 * Planilha: Inseminação - 2023.xlsx
 * Total estimado: 1.276 registros
 * Programa no SIGMA: ID 69 - "Inseminação Artificial - Bovinos Leite"
 *
 * Estrutura da planilha:
 * - Colunas: Nº | Produtor | Nome/nº vaca | Touro | Data insem. | N° autor.
 * - Abas: Janeiro 2023, Fevereiro 2023, ..., Dezembro 2023
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import prisma from '../../src/utils/prisma';

const ARQUIVO_PLANILHA = 'C:\\Users\\marce\\Downloads\\2023\\Inseminação - 2023.xlsx';
const PROGRAMA_ID = 69; // Inseminação Artificial - Bovinos Leite
const ANO_REFERENCIA = 2023;

interface RegistroInseminacao {
  numero: number;
  produtor: string;
  nomeVaca: string;
  touro: string;
  dataInseminacao: Date;
  numeroAutorizacao: string;
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
    .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
}

// Busca pessoa por nome (aproximado)
async function buscarPessoaPorNome(nome: string): Promise<number | null> {
  const nomeNormalizado = normalizarNome(nome);

  // Busca exata primeiro
  const pessoaExata = await prisma.pessoa.findFirst({
    where: {
      nome: {
        equals: nome,
        mode: 'insensitive'
      }
    }
  });

  if (pessoaExata) return pessoaExata.id;

  // Busca aproximada
  const pessoas = await prisma.pessoa.findMany({
    where: {
      nome: {
        contains: nome.split(' ')[0], // Primeiro nome
        mode: 'insensitive'
      }
    }
  });

  // Tenta encontrar o melhor match
  for (const pessoa of pessoas) {
    const nomePessoaNorm = normalizarNome(pessoa.nome);
    if (nomePessoaNorm.includes(nomeNormalizado) || nomeNormalizado.includes(nomePessoaNorm)) {
      return pessoa.id;
    }
  }

  return null;
}

// Extrai dados de uma aba
function extrairDadosAba(workbook: XLSX.WorkBook, sheetName: string): RegistroInseminacao[] {
  const sheet = workbook.Sheets[sheetName];
  const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];

  const registros: RegistroInseminacao[] = [];

  // Encontrar linha do cabeçalho (procura por "Nº" ou "Produtor")
  let headerIndex = -1;
  for (let i = 0; i < Math.min(10, dados.length); i++) {
    const row = dados[i];
    if (row && row.some(cell => String(cell).includes('Produtor') || String(cell).includes('Nº'))) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    console.log(`  ⚠️ Cabeçalho não encontrado na aba "${sheetName}"`);
    return [];
  }

  // Processar linhas de dados
  for (let i = headerIndex + 1; i < dados.length; i++) {
    const row = dados[i];

    // Pular linhas vazias ou de totais
    if (!row || !row[0] || !row[1]) continue;
    if (typeof row[0] !== 'number') continue; // Nº deve ser número

    const produtor = String(row[1] || '').trim();
    if (!produtor || produtor.length < 3) continue;

    // Converter data
    let dataInseminacao: Date;
    if (typeof row[4] === 'number') {
      dataInseminacao = excelDateToJSDate(row[4]);
    } else {
      // Tentar parse de string
      dataInseminacao = new Date(row[4]);
      if (isNaN(dataInseminacao.getTime())) {
        dataInseminacao = new Date(ANO_REFERENCIA, 0, 1); // Default para 01/01/2023
      }
    }

    registros.push({
      numero: row[0],
      produtor,
      nomeVaca: String(row[2] || ''),
      touro: String(row[3] || ''),
      dataInseminacao,
      numeroAutorizacao: String(row[5] || ''),
      mes: sheetName
    });
  }

  return registros;
}

async function migrarInseminacao() {
  console.log('='.repeat(80));
  console.log('MIGRAÇÃO - INSEMINAÇÃO 2023');
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
  const todosRegistros: RegistroInseminacao[] = [];

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
    pessoasNaoEncontradasNomes: new Set<string>()
  };

  // Processar cada registro
  console.log('\nProcessando registros...');

  for (const registro of todosRegistros) {
    try {
      // Buscar pessoa
      const pessoaId = await buscarPessoaPorNome(registro.produtor);

      if (!pessoaId) {
        stats.pessoasNaoEncontradas++;
        stats.pessoasNaoEncontradasNomes.add(registro.produtor);
        continue;
      }

      // Verificar se já existe solicitação similar (evitar duplicatas)
      const existente = await prisma.solicitacaoBeneficio.findFirst({
        where: {
          pessoaId,
          programaId: PROGRAMA_ID,
          datasolicitacao: registro.dataInseminacao,
          observacoes: {
            contains: registro.numeroAutorizacao
          }
        }
      });

      if (existente) {
        continue; // Já migrado anteriormente
      }

      // Criar solicitação
      await prisma.solicitacaoBeneficio.create({
        data: {
          pessoaId,
          programaId: PROGRAMA_ID,
          datasolicitacao: registro.dataInseminacao,
          status: 'concluido', // Registros históricos já foram concluídos
          observacoes: `Migrado da planilha 2023 | Aut: ${registro.numeroAutorizacao} | Vaca: ${registro.nomeVaca} | Touro: ${registro.touro}`,
          quantidadeSolicitada: 1, // 1 inseminação
          modalidade: 'SERVICO',
          calculoDetalhes: {
            migradoDe: 'Planilha Excel 2023',
            mes: registro.mes,
            numeroOriginal: registro.numero,
            autorizacao: registro.numeroAutorizacao,
            vaca: registro.nomeVaca,
            touro: registro.touro
          }
        }
      });

      stats.migrados++;

      // Log de progresso a cada 100
      if (stats.migrados % 100 === 0) {
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
  console.log(`Pessoas não encontradas: ${stats.pessoasNaoEncontradas}`);
  console.log(`Erros: ${stats.erros}`);

  if (stats.pessoasNaoEncontradasNomes.size > 0) {
    console.log('\nPessoas não encontradas (precisam ser cadastradas):');
    const nomes = Array.from(stats.pessoasNaoEncontradasNomes).sort();
    nomes.forEach(nome => console.log(`  - ${nome}`));
  }
}

// Executar
migrarInseminacao()
  .then(() => {
    console.log('\n✅ Migração concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  });
