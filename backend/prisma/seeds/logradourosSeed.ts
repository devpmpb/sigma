// backend/prisma/seeds/logradourosSeed.ts
import { PrismaClient, TipoLogradouro } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed de logradouros de Pato Bragado extraídos do DNE (Diretório Nacional de Endereços)
 * Data de extração: 14/03/2025
 */
export default async function seedLogradouros() {
  console.log("🏘️  Criando logradouros de Pato Bragado...");

  const logradouros = [
    // Área Rural
    {
      tipo: TipoLogradouro.RUA,
      descricao: "Área Rural de Pato Bragado",
      cep: "85948-899",
    },
    // Avenidas
    {
      tipo: TipoLogradouro.AVENIDA,
      descricao: "Continental",
      cep: "85948-200",
    },
    {
      tipo: TipoLogradouro.AVENIDA,
      descricao: "Willy Barth",
      cep: "85948-001",
    },
    // Rodovia
    {
      tipo: TipoLogradouro.RODOVIA,
      descricao: "PR-495",
      cep: "85948-500",
    },
    // Ruas
    { tipo: TipoLogradouro.RUA, descricao: "Albino Paulus", cep: "85948-212" },
    { tipo: TipoLogradouro.RUA, descricao: "Apucarana", cep: "85948-185" },
    { tipo: TipoLogradouro.RUA, descricao: "Arapongas", cep: "85948-149" },
    {
      tipo: TipoLogradouro.RUA,
      descricao: "Arthur João Thober",
      cep: "85948-203",
    },
    {
      tipo: TipoLogradouro.RUA,
      descricao: "Arthur Scherer",
      cep: "85948-140",
    },
    { tipo: TipoLogradouro.RUA, descricao: "Califórnia", cep: "85948-152" },
    {
      tipo: TipoLogradouro.RUA,
      descricao: "Campo Mourão",
      cep: "85948-170",
    },
    { tipo: TipoLogradouro.RUA, descricao: "Cascavel", cep: "85948-179" },
    { tipo: TipoLogradouro.RUA, descricao: "Curitiba", cep: "85948-173" },
    { tipo: TipoLogradouro.RUA, descricao: "das Flores", cep: "85948-025" },
    {
      tipo: TipoLogradouro.RUA,
      descricao: "Décio Graeff",
      cep: "85948-010",
    },
    { tipo: TipoLogradouro.RUA, descricao: "do Poente", cep: "85948-194" },
    {
      tipo: TipoLogradouro.RUA,
      descricao: "Florianópolis",
      cep: "85948-176",
    },
    {
      tipo: TipoLogradouro.RUA,
      descricao: "Getúlio Vargas",
      cep: "85948-028",
    },
    { tipo: TipoLogradouro.RUA, descricao: "Goiás", cep: "85948-007" },
    { tipo: TipoLogradouro.RUA, descricao: "Guaíra", cep: "85948-016" },
    { tipo: TipoLogradouro.RUA, descricao: "Guarapuava", cep: "85948-143" },
    { tipo: TipoLogradouro.RUA, descricao: "Guaratuba", cep: "85948-206" },
    { tipo: TipoLogradouro.RUA, descricao: "Hugo Frank", cep: "85948-215" },
    { tipo: TipoLogradouro.RUA, descricao: "Itararé", cep: "85948-209" },
    { tipo: TipoLogradouro.RUA, descricao: "Londrina", cep: "85948-188" },
    { tipo: TipoLogradouro.RUA, descricao: "Maringá", cep: "85948-013" },
    {
      tipo: TipoLogradouro.RUA,
      descricao: "Padre Alouis Mark",
      cep: "85948-167",
    },
    { tipo: TipoLogradouro.RUA, descricao: "Paranaguá", cep: "85948-182" },
    { tipo: TipoLogradouro.RUA, descricao: "Planalto", cep: "85948-158" },
    {
      tipo: TipoLogradouro.RUA,
      descricao: "Ponta Grossa",
      cep: "85948-155",
    },
    { tipo: TipoLogradouro.RUA, descricao: "Projetada C", cep: "85948-034" },
    {
      tipo: TipoLogradouro.RUA,
      descricao: "Raphael Garcia",
      cep: "85948-019",
    },
    { tipo: TipoLogradouro.RUA, descricao: "Realeza", cep: "85948-164" },
    { tipo: TipoLogradouro.RUA, descricao: "Rolândia", cep: "85948-191" },
    {
      tipo: TipoLogradouro.RUA,
      descricao: "Sempre Unidos",
      cep: "85948-022",
    },
    {
      tipo: TipoLogradouro.RUA,
      descricao: "Tancredo Neves",
      cep: "85948-004",
    },
    { tipo: TipoLogradouro.RUA, descricao: "Tibagi", cep: "85948-161" },
    { tipo: TipoLogradouro.RUA, descricao: "Toledo", cep: "85948-031" },
    {
      tipo: TipoLogradouro.RUA,
      descricao: "Verno Scherer",
      cep: "85948-146",
    },
    {
      tipo: TipoLogradouro.RUA,
      descricao: "Willibaldo Rieger",
      cep: "85948-197",
    },
    { tipo: TipoLogradouro.RUA, descricao: "27 de Maio", cep: "85948-027" },

    // Logradouros especiais para migração GIM (endereços fora do município)
    { tipo: TipoLogradouro.OUTROS, descricao: "Paraguai" },
    { tipo: TipoLogradouro.OUTROS, descricao: "Rio de Janeiro" },
  ];

  let count = 0;
  for (const logradouro of logradouros) {
    if (logradouro.cep) {
      // Logradouros com CEP: usar upsert
      await prisma.logradouro.upsert({
        where: { cep: logradouro.cep },
        update: {},
        create: {
          tipo: logradouro.tipo,
          descricao: logradouro.descricao,
          cep: logradouro.cep,
        },
      });
    } else {
      // Logradouros sem CEP (OUTROS): criar se não existir
      const existe = await prisma.logradouro.findFirst({
        where: { descricao: logradouro.descricao },
      });
      if (!existe) {
        await prisma.logradouro.create({
          data: {
            tipo: logradouro.tipo,
            descricao: logradouro.descricao,
          },
        });
      }
    }
    count++;
  }

  console.log(`✅ ${count} logradouros cadastrados com sucesso!`);
}
