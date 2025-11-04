// backend/prisma/seeds/tiposServicoSeed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function seedTiposServico() {
  console.log("🚜 Criando tipos de serviço e faixas de preço...");

  // 1. Carga de terra
  const cargaTerra = await prisma.tipoServico.upsert({
    where: { nome: "Carga de terra" },
    update: {},
    create: {
      nome: "Carga de terra",
      unidade: "carga",
      ativo: true,
    },
  });

  // Faixas de preço para Carga de terra
  await prisma.faixaPrecoServico.deleteMany({
    where: { tipoServicoId: cargaTerra.id },
  });

  await prisma.faixaPrecoServico.createMany({
    data: [
      {
        tipoServicoId: cargaTerra.id,
        quantidadeMin: 1,
        quantidadeMax: 3,
        multiplicadorVR: 0.1,
        ativo: true,
      },
      {
        tipoServicoId: cargaTerra.id,
        quantidadeMin: 4,
        quantidadeMax: 10,
        multiplicadorVR: 0.3,
        ativo: true,
      },
      {
        tipoServicoId: cargaTerra.id,
        quantidadeMin: 11,
        quantidadeMax: null, // Sem limite superior
        multiplicadorVR: 0.5,
        ativo: true,
      },
    ],
  });

  // 2. Caminhão truck
  const caminhaoTruck = await prisma.tipoServico.upsert({
    where: { nome: "Caminhão truck" },
    update: {},
    create: {
      nome: "Caminhão truck",
      unidade: "hora",
      ativo: true,
    },
  });

  await prisma.faixaPrecoServico.deleteMany({
    where: { tipoServicoId: caminhaoTruck.id },
  });

  await prisma.faixaPrecoServico.createMany({
    data: [
      {
        tipoServicoId: caminhaoTruck.id,
        quantidadeMin: 1,
        quantidadeMax: 3,
        multiplicadorVR: 0.1,
        ativo: true,
      },
      {
        tipoServicoId: caminhaoTruck.id,
        quantidadeMin: 4,
        quantidadeMax: 10,
        multiplicadorVR: 0.3,
        ativo: true,
      },
      {
        tipoServicoId: caminhaoTruck.id,
        quantidadeMin: 11,
        quantidadeMax: null,
        multiplicadorVR: 0.5,
        ativo: true,
      },
    ],
  });

  // 3. Pá carregadeira
  const paCarregadeira = await prisma.tipoServico.upsert({
    where: { nome: "Pá carregadeira" },
    update: {},
    create: {
      nome: "Pá carregadeira",
      unidade: "hora",
      ativo: true,
    },
  });

  await prisma.faixaPrecoServico.deleteMany({
    where: { tipoServicoId: paCarregadeira.id },
  });

  await prisma.faixaPrecoServico.createMany({
    data: [
      {
        tipoServicoId: paCarregadeira.id,
        quantidadeMin: 1,
        quantidadeMax: 3,
        multiplicadorVR: 0.35,
        ativo: true,
      },
      {
        tipoServicoId: paCarregadeira.id,
        quantidadeMin: 4,
        quantidadeMax: 10,
        multiplicadorVR: 0.4,
        ativo: true,
      },
      {
        tipoServicoId: paCarregadeira.id,
        quantidadeMin: 11,
        quantidadeMax: null,
        multiplicadorVR: 0.5,
        ativo: true,
      },
    ],
  });

  // 4. PATROLA
  const patrola = await prisma.tipoServico.upsert({
    where: { nome: "PATROLA" },
    update: {},
    create: {
      nome: "PATROLA",
      unidade: "hora",
      ativo: true,
    },
  });

  await prisma.faixaPrecoServico.deleteMany({
    where: { tipoServicoId: patrola.id },
  });

  await prisma.faixaPrecoServico.createMany({
    data: [
      {
        tipoServicoId: patrola.id,
        quantidadeMin: 1,
        quantidadeMax: 3,
        multiplicadorVR: 0.35,
        ativo: true,
      },
      {
        tipoServicoId: patrola.id,
        quantidadeMin: 4,
        quantidadeMax: 10,
        multiplicadorVR: 0.4,
        ativo: true,
      },
      {
        tipoServicoId: patrola.id,
        quantidadeMin: 11,
        quantidadeMax: null,
        multiplicadorVR: 0.5,
        ativo: true,
      },
    ],
  });

  console.log("✅ Tipos de serviço e faixas de preço criados com sucesso!");
}
