// backend/prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import seedAuth from "./seeds/authSeed";
import seedLogradouros from "./seeds/logradourosSeed";
import seedTiposServico from "./seeds/tiposServicoSeed";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Seed de autenticação (usuários, perfis, permissões)
  await seedAuth();

  // Seed de logradouros (ruas de Pato Branco)
  await seedLogradouros();

  // Seed de tipos de serviço e faixas de preço (módulo Obras)
  await seedTiposServico();

  console.log("");
  console.log("🎉 Seed concluído com sucesso!");
  console.log("");
  console.log("📋 Resumo do que foi criado:");
  console.log("   • Permissões do sistema");
  console.log("   • Perfis de usuário (ADMIN, OBRAS, AGRICULTURA)");
  console.log("   • Usuários iniciais com senhas");
  console.log("   • Logradouros de Pato Branco");
  console.log("   • Tipos de serviço com faixas de preço");
  console.log("");
  console.log("🔐 Credenciais de acesso:");
  console.log("   Admin: admin@sigma.com / 123456");
  console.log("   Obras: obras@sigma.com / 123456");
  console.log("   Agricultura: agricultura@sigma.com / 123456");
  console.log("");
  console.log("ℹ️  Dados migrados do GIM:");
  console.log("   • 1.000 pessoas");
  console.log("   • 800 propriedades");
  console.log("   • 62 programas + 120 regras de negócio");
  console.log("   • 2.500 telefones");
  console.log("   • 33.016 solicitações de benefício");
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
