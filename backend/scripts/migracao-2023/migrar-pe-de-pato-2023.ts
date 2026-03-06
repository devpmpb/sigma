/**
 * Script de Migracao - Pe de Pato (Descompactacao de Solos) 2023
 *
 * Planilha: Pe de Pato - 2023.xlsx
 * Aba: Planilha1
 * Total: ~113 produtores, 391 horas
 * Programa no SIGMA: ID 82 - "Descompactacao de Solos (Pe de Pato)"
 *
 * Estrutura: Nº | Produtor | Data | Hora Inicial | Hora Final | Total | Horas Disponíveis
 * - Linhas sem Nº = sessão adicional do mesmo produtor
 * - Linhas com "Prefeitura" = uso interno, ignorar
 * - Total = horas realizadas na sessão
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import prisma from '../../src/utils/prisma';

const ARQUIVO_PLANILHA = 'C:\\csvs\\Pé de Pato - 2023.xlsx';
const PROGRAMA_ID = 82; // Descompactacao de Solos (Pe de Pato)
const ANO_REFERENCIA = 2023;

interface SessaoPeDePato {
  numero: number | null;
  produtor: string;
  data: Date;
  horasTotal: number;
}

// Converte data serial do Excel para Date JS
function excelDateToJSDate(serial: number): Date {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  return new Date(utc_value * 1000);
}

function normalizarNome(nome: string): string {
  return nome
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Busca pessoa por nome
async function buscarPessoaPorNome(nome: string): Promise<number | null> {
  const nomeLimpo = nome.trim();

  // Busca exata
  const pessoaExata = await prisma.pessoa.findFirst({
    where: { nome: { equals: nomeLimpo, mode: 'insensitive' } }
  });
  if (pessoaExata) return pessoaExata.id;

  // Busca por primeiros + ultimo nome
  const palavras = nomeLimpo.split(' ').filter(p => p.length > 2);
  if (palavras.length >= 2) {
    const pessoas = await prisma.pessoa.findMany({
      where: {
        AND: [
          { nome: { contains: palavras[0], mode: 'insensitive' } },
          { nome: { contains: palavras[palavras.length - 1], mode: 'insensitive' } },
        ]
      }
    });

    if (pessoas.length === 1) return pessoas[0].id;

    // Normalizar e comparar
    const nomeNorm = normalizarNome(nomeLimpo);
    for (const pessoa of pessoas) {
      const pessoaNorm = normalizarNome(pessoa.nome);
      if (pessoaNorm.includes(nomeNorm) || nomeNorm.includes(pessoaNorm)) {
        return pessoa.id;
      }
    }
  }

  return null;
}

// Agrupa sessoes por produtor (somando horas)
function agruparSessoesPorProdutor(sessoes: SessaoPeDePato[]): Map<string, SessaoPeDePato[]> {
  const mapa = new Map<string, SessaoPeDePato[]>();

  for (const s of sessoes) {
    const key = normalizarNome(s.produtor);
    if (!mapa.has(key)) mapa.set(key, []);
    mapa.get(key)!.push(s);
  }

  return mapa;
}

async function migrarPeDePato() {
  console.log('='.repeat(80));
  console.log('MIGRACAO - PE DE PATO (DESCOMPACTACAO DE SOLOS) 2023');
  console.log('='.repeat(80));

  // Verificar programa
  const programa = await prisma.programa.findUnique({ where: { id: PROGRAMA_ID } });
  if (!programa) {
    console.error(`Programa ID ${PROGRAMA_ID} nao encontrado!`);
    return;
  }
  console.log(`Programa: ${programa.nome} (ID: ${programa.id})`);

  // Ler planilha
  const workbook = XLSX.readFile(ARQUIVO_PLANILHA);
  console.log(`Arquivo: ${path.basename(ARQUIVO_PLANILHA)}`);

  const sheet = workbook.Sheets['Planilha1'];
  const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];

  // Extrair sessoes
  const sessoes: SessaoPeDePato[] = [];

  for (let i = 3; i < dados.length; i++) {
    const row = dados[i];
    if (!row || row.length < 6) continue;

    const produtor = String(row[1] || '').trim();
    if (!produtor || produtor.length < 3) continue;

    // Ignorar linhas da Prefeitura
    if (produtor.toLowerCase().includes('prefeitura')) continue;

    const dataRaw = row[2];
    let data: Date;
    if (typeof dataRaw === 'number') {
      data = excelDateToJSDate(dataRaw);
    } else {
      data = new Date(ANO_REFERENCIA, 5, 15); // fallback
    }

    const horas = Number(row[5]) || 0;
    if (horas <= 0) continue;

    const numero = typeof row[0] === 'number' ? row[0] : null;

    sessoes.push({ numero, produtor, data, horasTotal: horas });
  }

  // Agrupar por produtor
  const porProdutor = agruparSessoesPorProdutor(sessoes);
  console.log(`\nProdutores encontrados: ${porProdutor.size}`);
  console.log(`Total de sessoes: ${sessoes.length}`);
  console.log(`Total de horas: ${sessoes.reduce((s, x) => s + x.horasTotal, 0)}`);

  const stats = {
    total: porProdutor.size,
    migrados: 0,
    duplicados: 0,
    pessoasNaoEncontradas: 0,
    erros: 0,
    horasTotal: 0,
    pessoasNaoEncontradasNomes: [] as string[],
  };

  console.log('\nProcessando...');

  for (const [nomeNorm, sessoesProd] of porProdutor) {
    const nomeOriginal = sessoesProd[0].produtor;
    const horasTotal = sessoesProd.reduce((s, x) => s + x.horasTotal, 0);
    const dataRef = sessoesProd[sessoesProd.length - 1].data; // ultima sessao

    try {
      const pessoaId = await buscarPessoaPorNome(nomeOriginal);

      if (!pessoaId) {
        stats.pessoasNaoEncontradas++;
        stats.pessoasNaoEncontradasNomes.push(nomeOriginal);
        console.log(`  NAO ENCONTRADO: ${nomeOriginal}`);
        continue;
      }

      // Verificar duplicata
      const existente = await prisma.solicitacaoBeneficio.findFirst({
        where: {
          pessoaId,
          programaId: PROGRAMA_ID,
          quantidadeSolicitada: horasTotal,
        }
      });

      if (existente) {
        stats.duplicados++;
        console.log(`  DUPLICADO: ${nomeOriginal} (${horasTotal}h)`);
        continue;
      }

      // Criar uma solicitacao por produtor com total de horas
      await prisma.solicitacaoBeneficio.create({
        data: {
          pessoaId,
          programaId: PROGRAMA_ID,
          datasolicitacao: dataRef,
          status: 'concluido',
          observacoes: `Migrado planilha Pe de Pato 2023 | ${sessoesProd.length} sessao(es) | Total ${horasTotal}h`,
          quantidadeSolicitada: horasTotal,
          valorCalculado: 0, // servico gratuito ao produtor
          modalidade: 'SERVICO',
          calculoDetalhes: {
            migradoDe: 'Planilha Pe de Pato 2023',
            totalHoras: horasTotal,
            totalSessoes: sessoesProd.length,
            sessoes: sessoesProd.map(s => ({
              data: s.data.toISOString().split('T')[0],
              horas: s.horasTotal,
            })),
          }
        }
      });

      stats.migrados++;
      stats.horasTotal += horasTotal;
      console.log(`  OK: ${nomeOriginal} | ${sessoesProd.length} sessao(es) | ${horasTotal}h`);

    } catch (error) {
      stats.erros++;
      console.error(`  ERRO: ${nomeOriginal}:`, error);
    }
  }

  // Relatorio
  console.log('\n' + '='.repeat(80));
  console.log('RELATORIO FINAL');
  console.log('='.repeat(80));
  console.log(`Produtores: ${stats.total}`);
  console.log(`Migrados: ${stats.migrados}`);
  console.log(`Duplicados: ${stats.duplicados}`);
  console.log(`Nao encontrados: ${stats.pessoasNaoEncontradas}`);
  console.log(`Erros: ${stats.erros}`);
  console.log(`Total horas migradas: ${stats.horasTotal}`);

  if (stats.pessoasNaoEncontradasNomes.length > 0) {
    console.log('\nNao encontrados:');
    stats.pessoasNaoEncontradasNomes.forEach(n => console.log(`  - ${n}`));
  }
}

migrarPeDePato()
  .then(() => { console.log('\nMigracao concluida!'); process.exit(0); })
  .catch(e => { console.error('Erro:', e); process.exit(1); });
