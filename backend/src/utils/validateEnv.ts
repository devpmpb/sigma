// backend/src/utils/validateEnv.ts
// Validação de variáveis de ambiente obrigatórias

/**
 * Valida se todas as variáveis de ambiente obrigatórias estão definidas
 * Lança erro se alguma variável estiver faltando
 */
export const validateEnv = (): void => {
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'JWT_EXPIRES_IN',
    'JWT_REFRESH_EXPIRES_IN',
    'NODE_ENV',
    'PORT'
  ];

  const missingVars: string[] = [];

  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    throw new Error(
      `❌ ERRO DE CONFIGURAÇÃO: As seguintes variáveis de ambiente são obrigatórias mas não foram definidas:\n` +
      missingVars.map(v => `  - ${v}`).join('\n') +
      `\n\n💡 Verifique se o arquivo .env existe e contém todas as variáveis necessárias.`
    );
  }

  // Validações adicionais de segurança
  if (process.env.NODE_ENV === 'production') {
    // Em produção, JWT_SECRET deve ser forte (pelo menos 64 caracteres)
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 64) {
      throw new Error(
        '❌ ERRO DE SEGURANÇA: JWT_SECRET deve ter pelo menos 64 caracteres em produção.\n' +
        '💡 Gere um secret seguro com: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
      );
    }

    if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 64) {
      throw new Error(
        '❌ ERRO DE SEGURANÇA: JWT_REFRESH_SECRET deve ter pelo menos 64 caracteres em produção.\n' +
        '💡 Gere um secret seguro com: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
      );
    }

    // Verificar se secrets fracos conhecidos estão sendo usados
    const weakSecrets = [
      'sigma_secret_key',
      'sigma_super_secret_jwt_key_2024_dev_only',
      'sigma_super_secret_refresh_key_2024_dev_only',
      'dev_secret',
      'test_secret',
      'secret',
      '123456'
    ];

    if (process.env.JWT_SECRET && weakSecrets.includes(process.env.JWT_SECRET)) {
      throw new Error(
        '❌ ERRO DE SEGURANÇA: JWT_SECRET está usando um valor fraco/padrão conhecido em produção.\n' +
        '💡 NUNCA use secrets padrão em produção!'
      );
    }
  }

  console.log('✅ Todas as variáveis de ambiente obrigatórias estão definidas');
};
