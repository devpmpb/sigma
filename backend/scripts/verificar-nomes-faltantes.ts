import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const nomesFaltantes = [
  "Alexandre Luis Kapser",
  "Antônio Coelho",
  "Arni Henz",
  "Braz Guesser",
  "Claudir J. Benkenkamp",
  "Célio Luiz Engellmann",
  "Debora Hunemeier (Cleiton)",
  "Deivid Carlos Kowald",
  "Deivid Kowald",
  "Erci Kaul Gartiner",
  "Everson W. Kunzler",
  "Genecilda Ribeiro da Silva",
  "Giuvane C.S. Marholdt",
  "Giuvane C.S. Marholt",
  "Ida Adam",
  "Ida M. Adam",
  "Irica Bastian Heinz",
  "Jonas Hagdon",
  "Katia J. F. Cottica",
  "Katia J.F.Cottica",
  "Marcelo Maldaner",
  "Maria I. G. Fuhr",
  "Maria I.G. Fuhr",
  "Marlosn J. Kohl",
  "Nelsy Nogueira Hugue",
  "Rafael Rodrigo Hemsing",
  "Rogério C. Mundt",
  "Silmara de Oliveira",
  "Valério A. Dassoler",
  "Vanderlei Astor Reinke",
];

function norm(s: string) {
  return s.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function main() {
  console.log("VERIFICAÇÃO FINAL - NOMES FALTANTES");
  console.log("=".repeat(90));

  for (const nome of nomesFaltantes) {
    const partes = nome.replace(/\(.*\)/, "").trim().split(/\s+/);
    const ultimo = partes[partes.length - 1];

    // Busca por sobrenome
    const porSobrenome = await prisma.pessoa.findMany({
      where: { nome: { contains: ultimo, mode: "insensitive" } },
      select: { id: true, nome: true },
      take: 5,
    });

    const melhores = porSobrenome.filter((p) => {
      const pNorm = norm(p.nome);
      const nNorm = norm(partes[0]);
      return pNorm.startsWith(nNorm) || pNorm.includes(nNorm);
    });

    if (melhores.length > 0) {
      console.log(`"${nome}" → POSSÍVEL: ${melhores.map((p) => `"${p.nome}" (ID ${p.id})`).join(", ")}`);
    } else if (porSobrenome.length > 0) {
      console.log(`"${nome}" → SOBRENOME: ${porSobrenome.slice(0, 2).map((p) => `"${p.nome}"`).join(", ")}`);
    } else {
      console.log(`"${nome}" → NÃO EXISTE no banco`);
    }
  }
}

main().finally(() => prisma.$disconnect());
