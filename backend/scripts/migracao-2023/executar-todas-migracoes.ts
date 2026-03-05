/**
 * Script para executar TODAS as migrações de 2023
 *
 * Este script importa e executa todos os scripts de migração
 * na ordem correta.
 *
 * ATENÇÃO: Execute apenas uma vez! Os scripts verificam duplicatas,
 * mas é melhor evitar re-execuções desnecessárias.
 */

import { execSync } from 'child_process';
import * as path from 'path';

const scripts = [
  'migrar-inseminacao-2023.ts',
  'migrar-esterco-liquido-2023.ts',
  'migrar-aveia-2023.ts',
  'migrar-calcario-2023.ts',
  'migrar-cama-aviario-2023.ts',
  'migrar-semen-bovino-2023.ts',
  'migrar-semen-suino-2023.ts',
  'migrar-ultrasson-2023.ts',
  'migrar-adubacao-pastagem-2023.ts',
  'migrar-apicultura-2023.ts',
  'migrar-pesca-profissional-2023.ts',
  'migrar-piscicultura-2023.ts'
];

async function executarTodas() {
  console.log('='.repeat(80));
  console.log('EXECUTANDO TODAS AS MIGRAÇÕES DE 2023');
  console.log('='.repeat(80));
  console.log(`\nTotal de scripts: ${scripts.length}`);
  console.log('Scripts a executar:');
  scripts.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
  console.log('\n');

  const resultados: { script: string; sucesso: boolean; erro?: string }[] = [];

  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`[${i + 1}/${scripts.length}] Executando: ${script}`);
    console.log('─'.repeat(80));

    try {
      const scriptPath = path.join(__dirname, script);
      execSync(`npx ts-node "${scriptPath}"`, {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..', '..')
      });
      resultados.push({ script, sucesso: true });
    } catch (error: any) {
      console.error(`\n❌ Erro ao executar ${script}:`, error.message);
      resultados.push({ script, sucesso: false, erro: error.message });
    }
  }

  // Resumo final
  console.log('\n' + '='.repeat(80));
  console.log('RESUMO DA EXECUÇÃO');
  console.log('='.repeat(80));

  const sucessos = resultados.filter(r => r.sucesso);
  const falhas = resultados.filter(r => !r.sucesso);

  console.log(`\nTotal executados: ${resultados.length}`);
  console.log(`Sucessos: ${sucessos.length}`);
  console.log(`Falhas: ${falhas.length}`);

  if (falhas.length > 0) {
    console.log('\nScripts que falharam:');
    falhas.forEach(f => console.log(`  - ${f.script}: ${f.erro}`));
  }

  console.log('\n✅ Processo de migração finalizado!');
}

executarTodas().catch(console.error);
