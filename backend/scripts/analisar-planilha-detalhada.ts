import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Nomes que falharam na migração (removendo os que são linhas de resumo)
const nomesFalhados = [
  "Adilson Finken",
  "Alexandre Luis Kapser",
  "Amaro Arnold",
  "Ana Carolina Pauli",
  "Antônio Arlindo Sieben",
  "Antônio Coelho",
  "Antônio José Pauli",
  "Antônio de Oliveira",
  "Ari Stresnke",
  "Arni Henz",
  "Braz Guesser",
  "Carlito Finken",
  "Carlos Vanderlei Paulwels",
  "Cesar M. Auth",
  "Claudir J. Benkenkamp",
  "Clóvis R. Kieling",
  "Clóvis Renato Kieling",
  "Célio Luiz Engellmann",
  "César M. Auth",
  "Debora Hunemeier (Cleiton)",
  "Deivid Carlos Kowald",
  "Deivid Kowald",
  "Dorvalino Boreli",
  "Elizeu marcio Engellmann",
  "Erci Kaul Gartiner",
  "Everson W. Kunzler",
  "Flávio Kaiser",
  "Flávio kaiser",
  "Genecilda Ribeiro da Silva",
  "Geraldo Hefer",
  "Germano A. Hunemeier",
  "Germano Hunemeier",
  "Giuvane C.S. Marholdt",
  "Giuvane C.S. Marholt",
  "Ida Adam",
  "Ida M. Adam",
  "Irena Bergamnn",
  "Irena Bergmnn",
  "Irica Bastian Heinz",
  "Jandir Mitteltaedt",
  "Jonas Finken",
  "Jonas Hagdon",
  "João José Pauli",
  "Katia J. F. Cottica",
  "Katia J.F.Cottica",
  "Marcelo Maldaner",
  "Maria I. G. Fuhr",
  "Maria I.G. Fuhr",
  "Marlosn J. Kohl",
  "Nelsy Nogueira Hugue",
  "Normélio Luis Zeiweibricker",
  "Rafael Rodrigo Hemsing",
  "Realdo Follamnn",
  "Rodenerio Decker",
  "Rodénerio Decker",
  "Rogério C. Mundt",
  "Rogério Gilberto Scherer",
  "Rosani C. Sczuzk",
  "Salésio Pauli",
  "Silmara de Oliveira",
  "Valdemar Eugenio Jarabizza",
  "Valério A. Dassoler",
  "Vanderlei Astor Reinke",
  "ivan Jonas Sczuk",
];

function normSemAcento(nome: string): string {
  return nome
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

async function main() {
  console.log("ANÁLISE DE NOMES NÃO ENCONTRADOS");
  console.log("=".repeat(90));
  console.log(`Total de nomes a analisar: ${nomesFalhados.length}\n`);

  let acento = 0;
  let abreviacao = 0;
  let erroGrafia = 0;
  let naoExiste = 0;

  for (const nome of nomesFalhados) {
    const nomeNorm = normSemAcento(nome);
    const partes = nome.trim().replace(/\(.*\)/, "").trim().split(/\s+/);
    const primeiro = normSemAcento(partes[0]);
    const ultimo = normSemAcento(partes[partes.length - 1]);

    // Busca por primeiro nome
    const todas = await prisma.pessoa.findMany({
      where: { nome: { mode: "insensitive", contains: partes[0] } },
      select: { id: true, nome: true },
    });

    // 1. Match exato sem acento
    const matchSemAcento = todas.find(
      (p) => normSemAcento(p.nome) === nomeNorm
    );

    // 2. Match primeiro+último nome sem acento
    const matchPrimUlt = todas.find((p) => {
      const pNorm = normSemAcento(p.nome);
      return pNorm.startsWith(primeiro) && pNorm.endsWith(ultimo);
    });

    // 3. Candidatos similares
    const candidatos = todas
      .filter((p) => {
        const pNorm = normSemAcento(p.nome);
        return pNorm.startsWith(primeiro);
      })
      .slice(0, 3);

    if (matchSemAcento) {
      console.log(`ACENTO  | "${nome}" → "${matchSemAcento.nome}"`);
      acento++;
    } else if (matchPrimUlt) {
      console.log(`ABREVI  | "${nome}" → "${matchPrimUlt.nome}"`);
      abreviacao++;
    } else if (candidatos.length > 0) {
      const candStr = candidatos.map((c) => `"${c.nome}"`).join(", ");
      console.log(`GRAFIA  | "${nome}" → Candidatos: ${candStr}`);
      erroGrafia++;
    } else {
      // Tentar busca pelo último nome
      const porUltimo = await prisma.pessoa.findMany({
        where: { nome: { mode: "insensitive", contains: partes[partes.length - 1] } },
        select: { id: true, nome: true },
        take: 3,
      });
      if (porUltimo.length > 0) {
        const candStr = porUltimo.map((c) => `"${c.nome}"`).join(", ");
        console.log(`SOBREN  | "${nome}" → Por sobrenome: ${candStr}`);
        erroGrafia++;
      } else {
        console.log(`NENHUM  | "${nome}"`);
        naoExiste++;
      }
    }
  }

  console.log(`\n${"=".repeat(90)}`);
  console.log("RESUMO:");
  console.log(`  Resolvem tirando acento:           ${acento}`);
  console.log(`  Resolvem primeiro+último nome:      ${abreviacao}`);
  console.log(`  Erro grafia (tem candidatos):       ${erroGrafia}`);
  console.log(`  Sem nenhum candidato no banco:      ${naoExiste}`);
  console.log(`  Total: ${nomesFalhados.length}`);
}

main().finally(() => prisma.$disconnect());
