// backend/scripts/check-enums.js - Script para validar ENUMs
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkEnums() {
  console.log("🔍 Verificando ENUMs do sistema...\n");

  try {
    // 1. Verificar ENUMs no banco
    console.log("📋 ENUMs disponíveis:");

    const tiposPerfil =
      await prisma.$queryRaw`SELECT unnest(enum_range(NULL::"TipoPerfil")) as perfil`;
    console.log("  TipoPerfil:", tiposPerfil.map((t) => t.perfil).join(", "));

    const modulosSistema =
      await prisma.$queryRaw`SELECT unnest(enum_range(NULL::"ModuloSistema")) as modulo`;
    console.log(
      "  ModuloSistema:",
      modulosSistema.map((m) => m.modulo).join(", ")
    );

    const acoesPermissao =
      await prisma.$queryRaw`SELECT unnest(enum_range(NULL::"AcaoPermissao")) as acao`;
    console.log(
      "  AcaoPermissao:",
      acoesPermissao.map((a) => a.acao).join(", ")
    );

    // 2. Verificar dados criados
    console.log("\n👥 Perfis criados:");
    const perfis = await prisma.perfil.findMany();
    perfis.forEach((p) => {
      console.log(`  • ${p.nome} - ${p.descricao}`);
    });

    console.log("\n🔐 Permissões criadas:");
    const permissoes = await prisma.permissao.findMany();
    const permissoesPorModulo = permissoes.reduce((acc, p) => {
      if (!acc[p.modulo]) acc[p.modulo] = [];
      acc[p.modulo].push(p.acao);
      return acc;
    }, {});

    Object.keys(permissoesPorModulo).forEach((modulo) => {
      console.log(`  • ${modulo}: ${permissoesPorModulo[modulo].join(", ")}`);
    });

    console.log("\n👤 Usuários criados:");
    const usuarios = await prisma.usuario.findMany({
      include: { perfil: true },
    });
    usuarios.forEach((u) => {
      console.log(`  • ${u.nome} (${u.email}) - Perfil: ${u.perfil.nome}`);
    });

    console.log("\n✅ Verificação concluída com sucesso!");
  } catch (error) {
    console.error("❌ Erro durante verificação:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEnums();
