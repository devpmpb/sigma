// Script para analisar a estrutura das planilhas de 2023
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const PASTA_PLANILHAS = 'C:\\Users\\marce\\Downloads\\2023';

interface AnalisePrograma {
  arquivo: string;
  programa: string;
  abas: {
    nome: string;
    colunas: string[];
    linhasExemplo: any[];
    totalLinhas: number;
  }[];
}

function analisarPlanilha(caminhoArquivo: string): AnalisePrograma {
  const nomeArquivo = path.basename(caminhoArquivo);
  const programa = nomeArquivo.replace(' - 2023.xlsx', '').replace(' 2023.xlsx', '');

  const workbook = XLSX.readFile(caminhoArquivo);

  const analise: AnalisePrograma = {
    arquivo: nomeArquivo,
    programa,
    abas: []
  };

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const dados = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];

    if (dados.length === 0) continue;

    // Encontrar a linha de cabeçalho (geralmente a primeira com dados)
    let headerIndex = 0;
    for (let i = 0; i < Math.min(5, dados.length); i++) {
      const row = dados[i];
      if (row && row.some(cell => cell && String(cell).trim() !== '')) {
        headerIndex = i;
        break;
      }
    }

    const colunas = (dados[headerIndex] || []).map((c: any) => String(c || '').trim());

    // Pegar 3 linhas de exemplo (após o cabeçalho)
    const linhasExemplo: any[] = [];
    for (let i = headerIndex + 1; i < Math.min(headerIndex + 4, dados.length); i++) {
      if (dados[i] && dados[i].some(cell => cell && String(cell).trim() !== '')) {
        const obj: any = {};
        colunas.forEach((col, idx) => {
          if (col) {
            obj[col] = dados[i][idx];
          }
        });
        linhasExemplo.push(obj);
      }
    }

    // Contar linhas com dados (excluindo cabeçalho)
    let totalLinhas = 0;
    for (let i = headerIndex + 1; i < dados.length; i++) {
      if (dados[i] && dados[i].some(cell => cell && String(cell).trim() !== '')) {
        totalLinhas++;
      }
    }

    analise.abas.push({
      nome: sheetName,
      colunas: colunas.filter(c => c),
      linhasExemplo,
      totalLinhas
    });
  }

  return analise;
}

async function main() {
  const arquivos = fs.readdirSync(PASTA_PLANILHAS)
    .filter(f => f.endsWith('.xlsx'))
    .sort();

  console.log(`\n${'='.repeat(80)}`);
  console.log('ANÁLISE DAS PLANILHAS DE 2023');
  console.log(`Total de arquivos: ${arquivos.length}`);
  console.log('='.repeat(80));

  const todasAnalises: AnalisePrograma[] = [];

  for (const arquivo of arquivos) {
    const caminho = path.join(PASTA_PLANILHAS, arquivo);
    try {
      const analise = analisarPlanilha(caminho);
      todasAnalises.push(analise);

      console.log(`\n${'─'.repeat(80)}`);
      console.log(`📁 ${analise.programa.toUpperCase()}`);
      console.log(`   Arquivo: ${analise.arquivo}`);

      for (const aba of analise.abas) {
        console.log(`\n   📋 Aba: "${aba.nome}" (${aba.totalLinhas} registros)`);
        console.log(`   Colunas: ${aba.colunas.join(' | ')}`);

        if (aba.linhasExemplo.length > 0) {
          console.log(`   Exemplo:`);
          const exemplo = aba.linhasExemplo[0];
          for (const [key, value] of Object.entries(exemplo)) {
            if (value && String(value).trim() !== '') {
              console.log(`      - ${key}: ${value}`);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Erro ao analisar ${arquivo}:`, error);
    }
  }

  // Resumo final
  console.log(`\n${'='.repeat(80)}`);
  console.log('RESUMO GERAL');
  console.log('='.repeat(80));

  let totalRegistros = 0;
  const programasComRegistros: {nome: string, total: number}[] = [];

  for (const analise of todasAnalises) {
    const totalPrograma = analise.abas.reduce((sum, aba) => sum + aba.totalLinhas, 0);
    totalRegistros += totalPrograma;
    programasComRegistros.push({ nome: analise.programa, total: totalPrograma });
  }

  programasComRegistros.sort((a, b) => b.total - a.total);

  console.log('\nProgramas ordenados por quantidade de registros:');
  for (const p of programasComRegistros) {
    console.log(`  ${p.nome.padEnd(30)} ${p.total} registros`);
  }

  console.log(`\nTOTAL GERAL: ${totalRegistros} registros em ${arquivos.length} programas`);

  // Salvar análise em JSON para referência
  const jsonPath = path.join(PASTA_PLANILHAS, '_analise_planilhas.json');
  fs.writeFileSync(jsonPath, JSON.stringify(todasAnalises, null, 2), 'utf-8');
  console.log(`\nAnálise salva em: ${jsonPath}`);
}

main().catch(console.error);
