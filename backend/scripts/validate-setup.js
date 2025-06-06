const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function validateSetup() {
  console.log("🔧 Validando configuração do sistema...\n");

  const checks = [];

  // 1. Verificar arquivo .env
  const envPath = path.join(__dirname, "../.env");
  checks.push({
    name: "Arquivo .env",
    status: fs.existsSync(envPath),
    message: fs.existsSync(envPath)
      ? "Encontrado"
      : "Não encontrado - copie .env.example para .env",
  });

  // 2. Verificar variáveis essenciais
  const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"];
  requiredEnvVars.forEach((varName) => {
    checks.push({
      name: `Variável ${varName}`,
      status: !!process.env[varName],
      message: process.env[varName] ? "Configurada" : "Não configurada",
    });
  });

  // 3. Verificar conexão com banco
  try {
    await prisma.$connect();
    checks.push({
      name: "Conexão com banco",
      status: true,
      message: "Conectado com sucesso",
    });
  } catch (error) {
    checks.push({
      name: "Conexão com banco",
      status: false,
      message: `Erro: ${error.message}`,
    });
  }

  // 4. Verificar se ENUMs existem
  try {
    const perfis = await prisma.perfil.findMany();
    checks.push({
      name: "ENUMs e dados",
      status: perfis.length > 0,
      message:
        perfis.length > 0
          ? `${perfis.length} perfis encontrados`
          : "Dados não encontrados - execute seed",
    });
  } catch (error) {
    checks.push({
      name: "ENUMs e dados",
      status: false,
      message: `Erro: ${error.message}`,
    });
  }

  // 5. Verificar usuários
  try {
    const usuarios = await prisma.usuario.count();
    checks.push({
      name: "Usuários",
      status: usuarios > 0,
      message:
        usuarios > 0
          ? `${usuarios} usuários criados`
          : "Nenhum usuário - execute seed",
    });
  } catch (error) {
    checks.push({
      name: "Usuários",
      status: false,
      message: `Erro: ${error.message}`,
    });
  }

  // Exibir resultados
  console.log("📋 Resultado da validação:\n");
  checks.forEach((check) => {
    const icon = check.status ? "✅" : "❌";
    console.log(`${icon} ${check.name}: ${check.message}`);
  });

  const allPassed = checks.every((check) => check.status);
  console.log(
    `\n${allPassed ? "🎉" : "⚠️"} ${allPassed ? "Todas as verificações passaram!" : "Algumas verificações falharam."}`
  );

  if (!allPassed) {
    console.log("\n🔧 Para corrigir problemas:");
    console.log("1. Copie .env.example para .env e configure");
    console.log("2. Execute: npm run migrate");
    console.log("3. Execute: npm run db:seed");
  }

  await prisma.$disconnect();
}

validateSetup();
