/**
 * Script de Migracao - Acudes (Hora-Maquina Piscicultura) 2023
 *
 * Planilha: Acudes - 2023.xlsx
 * Total: 8 registros (aba "Acudes Prontos")
 * Programa no SIGMA: ID 9 - "Piscicultura Sustentavel"
 *
 * Dados: Horas-maquina para limpeza/ampliacao de acudes
 * VR (Valor de Referencia) = R$ 171,24
 * Faixas de subsidio:
 *   1-10h: produtor paga 35% VR (subsidio 65%)
 *   11-20h: produtor paga 50% VR (subsidio 50%)
 *   21-30h: produtor paga 70% VR (subsidio 30%)
 *   31+h: produtor paga 100% VR (sem subsidio)
 *
 * Abas mensais contem CPFs dos produtores
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import prisma from '../../src/utils/prisma';

const ARQUIVO_PLANILHA = 'C:\\csvs\\Açúdes -  2023.xlsx';
const PROGRAMA_ID = 9; // Piscicultura Sustentavel
const ANO_REFERENCIA = 2023;
const VR = 171.24;

interface RegistroAcude {
  numero: number;
  produtor: string;
  cpf: string | null;
  servico: string;
  horasTrabalhadas: number;
  maquina: string;
  dataInicio: Date | null;
  dataTermino: Date | null;
  valorProdutorPagou: number;
  endereco: string;
}

// Converte data serial do Excel para Date JS
function excelDateToJSDate(serial: number): Date {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  return new Date(utc_value * 1000);
}

// Normaliza nome para busca (remove datas entre parenteses, etc)
function limparNomeProdutor(nome: string): string {
  return nome
    .replace(/\s*\(.*?\)\s*/g, '') // remove (data) ou (observacao)
    .trim();
}

function normalizarNome(nome: string): string {
  return nome
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Busca pessoa por CPF
async function buscarPessoaPorCPF(cpf: string): Promise<number | null> {
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) return null;

  const pessoa = await prisma.pessoa.findFirst({
    where: { cpfCnpj: { contains: cpfLimpo } }
  });

  return pessoa?.id || null;
}

// Busca pessoa por nome
async function buscarPessoaPorNome(nome: string): Promise<number | null> {
  const nomeLimpo = limparNomeProdutor(nome);

  // Busca exata
  const pessoaExata = await prisma.pessoa.findFirst({
    where: { nome: { equals: nomeLimpo, mode: 'insensitive' } }
  });
  if (pessoaExata) return pessoaExata.id;

  // Busca parcial
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

    // Comparar normalizado
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

// Extrair CPFs das abas mensais
function extrairCPFsPorNome(workbook: XLSX.WorkBook): Map<string, string> {
  const cpfMap = new Map<string, string>();
  const abasMensais = workbook.SheetNames.filter(n =>
    /janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro/i.test(n)
  );

  for (const aba of abasMensais) {
    const sheet = workbook.Sheets[aba];
    const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];

    for (let i = 0; i < dados.length; i++) {
      const row = dados[i];
      if (!row) continue;

      // Procurar linhas com cabecalho DATA | PRODUTOR | CPF
      const headerRow = row.some(cell => String(cell).toUpperCase().includes('PRODUTOR'));
      if (headerRow) {
        // Proxima linha tem os dados
        const dataRow = dados[i + 1];
        if (dataRow && dataRow.length >= 3) {
          const nome = String(dataRow[1] || '').trim();
          const cpf = String(dataRow[2] || '').trim();
          if (nome && cpf && cpf.match(/\d{3}[\.\-]\d{3}/)) {
            cpfMap.set(normalizarNome(limparNomeProdutor(nome)), cpf);
          }
        }
      }
    }
  }

  return cpfMap;
}

// Extrair enderecos das abas mensais
function extrairEnderecosPorNome(workbook: XLSX.WorkBook): Map<string, string> {
  const enderecoMap = new Map<string, string>();
  const abasMensais = workbook.SheetNames.filter(n =>
    /janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro/i.test(n)
  );

  for (const aba of abasMensais) {
    const sheet = workbook.Sheets[aba];
    const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];

    for (let i = 0; i < dados.length; i++) {
      const row = dados[i];
      if (!row) continue;

      const headerRow = row.some(cell => String(cell).toUpperCase().includes('PRODUTOR'));
      if (headerRow) {
        const dataRow = dados[i + 1];
        if (dataRow && dataRow.length >= 4) {
          const nome = String(dataRow[1] || '').trim();
          const endereco = String(dataRow[3] || '').trim();
          if (nome && endereco) {
            enderecoMap.set(normalizarNome(limparNomeProdutor(nome)), endereco);
          }
        }
      }
    }
  }

  return enderecoMap;
}

async function migrarAcudes() {
  console.log('='.repeat(80));
  console.log('MIGRACAO - ACUDES (HORA-MAQUINA PISCICULTURA) 2023');
  console.log('='.repeat(80));

  // Verificar programa
  const programa = await prisma.programa.findUnique({
    where: { id: PROGRAMA_ID }
  });

  if (!programa) {
    console.error(`Programa ID ${PROGRAMA_ID} nao encontrado!`);
    return;
  }
  console.log(`Programa: ${programa.nome} (ID: ${programa.id})`);

  // Ler planilha
  const workbook = XLSX.readFile(ARQUIVO_PLANILHA);
  console.log(`Arquivo: ${path.basename(ARQUIVO_PLANILHA)}`);
  console.log(`Abas: ${workbook.SheetNames.join(', ')}`);

  // Extrair CPFs e enderecos das abas mensais
  const cpfMap = extrairCPFsPorNome(workbook);
  const enderecoMap = extrairEnderecosPorNome(workbook);
  console.log(`\nCPFs encontrados nas abas mensais: ${cpfMap.size}`);
  cpfMap.forEach((cpf, nome) => console.log(`  ${nome} -> ${cpf}`));

  // Ler aba "Acudes Prontos"
  const sheet = workbook.Sheets['Açudes Prontos'];
  if (!sheet) {
    console.error('Aba "Acudes Prontos" nao encontrada!');
    return;
  }

  const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true }) as any[][];

  // Encontrar cabecalho
  let headerIndex = -1;
  for (let i = 0; i < 10; i++) {
    if (dados[i] && dados[i].some((c: any) => String(c).includes('PRODUTOR'))) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    console.error('Cabecalho nao encontrado na aba Acudes Prontos!');
    return;
  }

  // Extrair registros
  const registros: RegistroAcude[] = [];

  for (let i = headerIndex + 1; i < dados.length; i++) {
    const row = dados[i];
    if (!row || typeof row[0] !== 'number') continue;

    const nomeOriginal = String(row[1] || '').trim();
    if (!nomeOriginal || nomeOriginal.length < 3) continue;

    const nomeLimpo = limparNomeProdutor(nomeOriginal);
    const nomeNorm = normalizarNome(nomeLimpo);

    // Buscar CPF e endereco
    const cpf = cpfMap.get(nomeNorm) || null;
    const endereco = enderecoMap.get(nomeNorm) || '';

    // Datas
    let dataInicio: Date | null = null;
    let dataTermino: Date | null = null;

    if (typeof row[6] === 'number') dataInicio = excelDateToJSDate(row[6]);
    if (typeof row[7] === 'number') dataTermino = excelDateToJSDate(row[7]);

    registros.push({
      numero: row[0],
      produtor: nomeLimpo,
      cpf,
      servico: String(row[2] || '').trim(),
      horasTrabalhadas: Number(row[3]) || 0,
      maquina: String(row[4] || '').trim(),
      dataInicio,
      dataTermino,
      valorProdutorPagou: Number(row[8]) || 0,
      endereco,
    });
  }

  console.log(`\nRegistros extraidos: ${registros.length}`);
  console.log('\n--- Dados extraidos ---');
  for (const r of registros) {
    console.log(`  ${r.numero}. ${r.produtor} | CPF: ${r.cpf || 'N/A'} | ${r.servico} | ${r.horasTrabalhadas}h | R$ ${r.valorProdutorPagou.toFixed(2)} | ${r.endereco}`);
  }

  // Migrar
  const stats = {
    total: registros.length,
    migrados: 0,
    duplicados: 0,
    pessoasNaoEncontradas: 0,
    erros: 0,
    valorTotal: 0,
    horasTotal: 0,
    pessoasNaoEncontradasNomes: [] as string[],
  };

  console.log('\nProcessando registros...');

  for (const registro of registros) {
    try {
      // Buscar pessoa - primeiro por CPF, depois por nome
      let pessoaId: number | null = null;

      if (registro.cpf) {
        pessoaId = await buscarPessoaPorCPF(registro.cpf);
      }

      if (!pessoaId) {
        pessoaId = await buscarPessoaPorNome(registro.produtor);
      }

      if (!pessoaId) {
        stats.pessoasNaoEncontradas++;
        stats.pessoasNaoEncontradasNomes.push(`${registro.produtor} (CPF: ${registro.cpf || 'N/A'})`);
        console.log(`  NAO ENCONTRADO: ${registro.produtor} (CPF: ${registro.cpf || 'N/A'})`);
        continue;
      }

      // Data da solicitacao (usar data de termino, ou inicio, ou meio do ano)
      const dataSolicitacao = registro.dataTermino || registro.dataInicio || new Date(ANO_REFERENCIA, 5, 15);

      // Verificar duplicata
      const existente = await prisma.solicitacaoBeneficio.findFirst({
        where: {
          pessoaId,
          programaId: PROGRAMA_ID,
          quantidadeSolicitada: registro.horasTrabalhadas,
          valorCalculado: registro.valorProdutorPagou,
        }
      });

      if (existente) {
        stats.duplicados++;
        console.log(`  DUPLICADO: ${registro.produtor} (${registro.horasTrabalhadas}h, R$ ${registro.valorProdutorPagou.toFixed(2)})`);
        continue;
      }

      // Calcular valor do subsidio (o que o municipio pagou)
      // O valor na planilha eh o que o PRODUTOR pagou
      // Subsidio = total horas * VR - valor que produtor pagou
      const valorTotalHoras = registro.horasTrabalhadas * VR;
      const valorSubsidio = valorTotalHoras - registro.valorProdutorPagou;

      // Criar solicitacao
      await prisma.solicitacaoBeneficio.create({
        data: {
          pessoaId,
          programaId: PROGRAMA_ID,
          datasolicitacao: dataSolicitacao,
          status: 'concluido',
          observacoes: `Migrado planilha Acudes 2023 | ${registro.servico} | ${registro.horasTrabalhadas}h | ${registro.maquina} | ${registro.endereco}`,
          quantidadeSolicitada: registro.horasTrabalhadas,
          valorCalculado: registro.valorProdutorPagou,
          modalidade: 'SERVICO',
          calculoDetalhes: {
            migradoDe: 'Planilha Acudes 2023',
            servico: registro.servico,
            horasTrabalhadas: registro.horasTrabalhadas,
            maquina: registro.maquina,
            valorReferenciaVR: VR,
            valorProdutorPagou: registro.valorProdutorPagou,
            valorSubsidioMunicipio: valorSubsidio,
            valorTotalHoras: valorTotalHoras,
            dataInicio: registro.dataInicio?.toISOString(),
            dataTermino: registro.dataTermino?.toISOString(),
            endereco: registro.endereco,
            cpfOriginal: registro.cpf,
          }
        }
      });

      stats.migrados++;
      stats.valorTotal += registro.valorProdutorPagou;
      stats.horasTotal += registro.horasTrabalhadas;
      console.log(`  OK: ${registro.produtor} | ${registro.horasTrabalhadas}h | Produtor pagou R$ ${registro.valorProdutorPagou.toFixed(2)} | Subsidio R$ ${valorSubsidio.toFixed(2)}`);

    } catch (error) {
      stats.erros++;
      console.error(`  ERRO: ${registro.produtor}:`, error);
    }
  }

  // Relatorio final
  console.log('\n' + '='.repeat(80));
  console.log('RELATORIO FINAL');
  console.log('='.repeat(80));
  console.log(`Total de registros: ${stats.total}`);
  console.log(`Migrados com sucesso: ${stats.migrados}`);
  console.log(`Duplicados (ja existiam): ${stats.duplicados}`);
  console.log(`Pessoas nao encontradas: ${stats.pessoasNaoEncontradas}`);
  console.log(`Erros: ${stats.erros}`);
  console.log(`Total horas: ${stats.horasTotal}`);
  console.log(`Valor total (produtor pagou): R$ ${stats.valorTotal.toFixed(2)}`);

  if (stats.pessoasNaoEncontradasNomes.length > 0) {
    console.log('\nPessoas nao encontradas:');
    stats.pessoasNaoEncontradasNomes.forEach(nome => console.log(`  - ${nome}`));
  }
}

migrarAcudes()
  .then(() => {
    console.log('\nMigracao concluida!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro na migracao:', error);
    process.exit(1);
  });
