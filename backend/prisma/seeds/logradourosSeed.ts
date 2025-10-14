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
      descricao: "Avenida Continental",
      cep: "85948-200",
    },
    {
      tipo: TipoLogradouro.AVENIDA,
      descricao: "Avenida Willy Barth",
      cep: "85948-001",
    },
    // Rodovia
    {
      tipo: TipoLogradouro.RODOVIA,
      descricao: "Rodovia PR-495",
      cep: "85948-500",
    },
    // Ruas
    { tipo: TipoLogradouro.RUA, descricao: "Rua Albino Paulus", cep: "85948-212" },
    { tipo: TipoLogradouro.RUA, descricao: "Rua Apucarana", cep: "85948-185" },
    { tipo: TipoLogradouro.RUA, descricao: "Rua Arapongas", cep: "85948-149" },
    {
      tipo: TipoLogradouro.RUA,
      descricao: "Rua Arthur João Thober",
      cep: "85948-203",
    },
    {
      tipo: TipoLogradouro.RUA,
      descricao: "Rua Arthur Scherer",
      cep: "85948-140",
    },
    { tipo: TipoLogradouro.RUA, descricao: "Rua Califórnia", cep: "85948-152" },
    {
      tipo: TipoLogradouro.RUA,
      descricao: "Rua Campo Mourão",
      cep: "85948-170",
    },
    { tipo: TipoLogradouro.RUA, descricao: "Rua Cascavel", cep: "85948-179" },
    { tipo: TipoLogradouro.RUA, descricao: "Rua Curitiba", cep: "85948-173" },
    { tipo: TipoLogradouro.RUA, descricao: "Rua das Flores", cep: "85948-025" },
    {
      tipo: TipoLogradouro.RUA,
      descricao: "Rua Décio Graeff",
      cep: "85948-010",
    },
    { tipo: TipoLogradouro.RUA, descricao: "Rua do Poente", cep: "85948-194" },
    {
      tipo: TipoLogradouro.RUA,
      descricao: "Rua Florianópolis",
      cep: "85948-176",
    },
    {
      tipo: TipoLogradouro.RUA,
      descricao: "Rua Getúlio Vargas",
      cep: "85948-028",
    },
    { tipo: TipoLogradouro.RUA, descricao: "Rua Goiás", cep: "85948-007" },
    { tipo: TipoLogradouro.RUA, descricao: "Rua Guaíra", cep: "85948-016" },
    { tipo: TipoLogradouro.RUA, descricao: "Rua Guarapuava", cep: "85948-143" },
    { tipo: TipoLogradouro.RUA, descricao: "Rua Guaratuba", cep: "85948-206" },
    { tipo: TipoLogradouro.RUA, descricao: "Rua Hugo Frank", cep: "85948-215" },
    { tipo: TipoLogradouro.RUA, descricao: "Rua Itararé", cep: "85948-209" },
    { tipo: TipoLogradouro.RUA, descricao: "Rua Londrina", cep: "85948-188" },
    { tipo: TipoLogradouro.RUA, descricao: "Rua Maringá", cep: "85948-013" },
    {
      tipo: TipoLogradouro.RUA,
      descricao: "Rua Padre Alouis Mark",
      cep: "85948-167",
    },
    { tipo: TipoLogradouro.RUA, descricao: "Rua Paranaguá", cep: "85948-182" },
    { tipo: TipoLogradouro.RUA, descricao: "Rua Planalto", cep: "85948-158" },
    {
      tipo: TipoLogradouro.RUA,
      descricao: "Rua Ponta Grossa",
      cep: "85948-155",
    },
    { tipo: TipoLogradouro.RUA, descricao: "Rua Projetada C", cep: "85948-034" },
    {
      tipo: TipoLogradouro.RUA,
      descricao: "Rua Raphael Garcia",
      cep: "85948-019",
    },
    { tipo: TipoLogradouro.RUA, descricao: "Rua Realeza", cep: "85948-164" },
    { tipo: TipoLogradouro.RUA, descricao: "Rua Rolândia", cep: "85948-191" },
    {
      tipo: TipoLogradouro.RUA,
      descricao: "Rua Sempre Unidos",
      cep: "85948-022",
    },
    {
      tipo: TipoLogradouro.RUA,
      descricao: "Rua Tancredo Neves",
      cep: "85948-004",
    },
    { tipo: TipoLogradouro.RUA, descricao: "Rua Tibagi", cep: "85948-161" },
    { tipo: TipoLogradouro.RUA, descricao: "Rua Toledo", cep: "85948-031" },
    {
      tipo: TipoLogradouro.RUA,
      descricao: "Rua Verno Scherer",
      cep: "85948-146",
    },
    {
      tipo: TipoLogradouro.RUA,
      descricao: "Rua Willibaldo Rieger",
      cep: "85948-197",
    },
    { tipo: TipoLogradouro.RUA, descricao: "Rua 27 de Maio", cep: "85948-027" },
  ];

  let count = 0;
  for (const logradouro of logradouros) {
    await prisma.logradouro.upsert({
      where: { cep: logradouro.cep },
      update: {},
      create: {
        tipo: logradouro.tipo,
        descricao: logradouro.descricao,
        cep: logradouro.cep,
      },
    });
    count++;
  }

  console.log(`✅ ${count} logradouros cadastrados com sucesso!`);
}
