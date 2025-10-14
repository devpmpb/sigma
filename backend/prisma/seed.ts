// backend/prisma/seed.ts - ARQUIVO COMPLETO
import { PrismaClient } from "@prisma/client";
import seedAuth from "./seeds/authSeed";

import seedProgramasLegais from "./seeds/programasLegaisCompleto";

import seedCondominos from "./seeds/condominosSeed";
import seedLogradouros from "./seeds/logradourosSeed";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Seed de autenticação (usuários, perfis, permissões) com ENUMs
  await seedAuth();

  await seedProgramasLegais();

  await seedCondominos();
  //wait seedSolicitacoesBeneficio();

  // Seed de logradouros
  await seedLogradouros();

  // Cadastrar bairros iniciais de Pato Bragado
  console.log("🏘️ Criando bairros iniciais...");
  const bairros = [
    { nome: "Centro" },
    { nome: "Loteamento Fischer" },
    { nome: "Loteamento Bragadense" },
    { nome: "Vila Nova" },
    { nome: "Jardim América" },
    { nome: "Zona Rural" },
  ];

  for (const bairro of bairros) {
    await prisma.bairro.upsert({
      where: { nome: bairro.nome },
      update: {},
      create: { nome: bairro.nome },
    });
  }

  console.log("✅ Bairros iniciais cadastrados!");

  // Cadastrar algumas áreas rurais
  console.log("🌾 Criando áreas rurais iniciais...");
  const areasRurais = [
    { nome: "Linha São Francisco" },
    { nome: "Linha Santa Rita" },
    { nome: "Estrada do Açude" },
    { nome: "Linha dos Alemães" },
  ];

  for (const area of areasRurais) {
    await prisma.areaRural.upsert({
      where: { nome: area.nome },
      update: {},
      create: { nome: area.nome },
    });
  }

  console.log("✅ Áreas rurais cadastradas!");

  // Cadastrar alguns grupos de produtos iniciais
  console.log("🌱 Criando grupos de produtos iniciais...");
  const gruposProdutos = [
    { descricao: "Grãos" },
    { descricao: "Hortaliças" },
    { descricao: "Frutas" },
    { descricao: "Cereais" },
    { descricao: "Leguminosas" },
  ];

  for (const grupo of gruposProdutos) {
    await prisma.grupoProduto.upsert({
      where: { descricao: grupo.descricao },
      update: {},
      create: { descricao: grupo.descricao },
    });
  }

  console.log("✅ Grupos de produtos cadastrados!");

  // Cadastrar alguns tipos de veículos iniciais
  console.log("🚜 Criando tipos de veículos iniciais...");
  const tiposVeiculos = [
    { descricao: "Trator" },
    { descricao: "Caminhão" },
    { descricao: "Retroescavadeira" },
    { descricao: "Motoniveladora" },
    { descricao: "Pá Carregadeira" },
  ];

  for (const tipo of tiposVeiculos) {
    await prisma.tipoVeiculo.upsert({
      where: { descricao: tipo.descricao },
      update: {},
      create: { descricao: tipo.descricao },
    });
  }

  console.log("✅ Tipos de veículos cadastrados!");

  console.log("🎉 Seed concluído com sucesso!");
  console.log("");
  console.log("📋 Resumo do que foi criado:");
  console.log("   • ENUMs: TipoPerfil, ModuloSistema, AcaoPermissao");
  console.log("   • Permissões do sistema (16 permissões)");
  console.log("   • Perfis de usuário (ADMIN, OBRAS, AGRICULTURA)");
  console.log("   • Usuários iniciais com senhas");
  console.log("   • Logradouros de Pato Bragado (45 logradouros)");
  console.log("   • Bairros de exemplo");
  console.log("   • Áreas rurais de exemplo");
  console.log("   • Grupos de produtos iniciais");
  console.log("   • Tipos de veículos iniciais");
  console.log("");
  console.log("🔐 Credenciais de acesso:");
  console.log("   Admin: admin@sigma.com / 123456");
  console.log("   Obras: obras@sigma.com / 123456");
  console.log("   Agricultura: agricultura@sigma.com / 123456");
  console.log("");
  console.log("💡 Dica: Use os ENUMs no código para garantir type safety!");
  console.log("   - TipoPerfil.ADMIN");
  console.log("   - ModuloSistema.OBRAS");
  console.log("   - AcaoPermissao.VIEW");
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
