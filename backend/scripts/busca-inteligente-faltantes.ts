import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function norm(s: string) {
  return s.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Nomes que não existem exatamente no banco - buscar com estratégias mais amplas
const NOMES = [
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
  "Ida Adam",
  "Irica Bastian Heinz",
  "Jonas Hagdon",
  "Katia J. F. Cottica",
  "Marcelo Maldaner",
  "Maria I. G. Fuhr",
  "Marlosn J. Kohl",
  "Nelsy Nogueira Hugue",
  "Rafael Rodrigo Hemsing",
  "Rogério C. Mundt",
  "Silmara de Oliveira",
  "Valério A. Dassoler",
  "Vanderlei Astor Reinke",
];

async function main() {
  console.log("BUSCA INTELIGENTE - NOMES FALTANTES");
  console.log("=".repeat(90));

  for (const nome of NOMES) {
    const limpo = nome.replace(/\s*\(.*\)\s*/g, "").trim();
    const partes = limpo.split(/\s+/).filter(p => p.length > 1 && !/^(J\.|C\.S\.|M\.|W\.|A\.|I\.|J\.F\.|I\.G\.|R\.|de|da|do)$/i.test(p));

    console.log(`\n"${nome}" → Partes: [${partes.join(", ")}]`);

    // Estratégia 1: Buscar pelo último sobrenome
    const ultimo = partes[partes.length - 1];
    const porSobrenome = await prisma.pessoa.findMany({
      where: { nome: { contains: ultimo, mode: "insensitive" } },
      select: { id: true, nome: true },
    });

    // Estratégia 2: Buscar pelo primeiro nome
    const primeiro = partes[0];
    const porPrimeiro = await prisma.pessoa.findMany({
      where: { nome: { startsWith: primeiro, mode: "insensitive" } },
      select: { id: true, nome: true },
    });

    // Combinar e ordenar por relevância
    const todosIds = new Set<number>();
    const todos: { id: number; nome: string; score: number }[] = [];

    for (const p of [...porSobrenome, ...porPrimeiro]) {
      if (todosIds.has(p.id)) continue;
      todosIds.add(p.id);

      const pNorm = norm(p.nome);
      const nNorm = norm(limpo);
      let score = 0;

      // Pontos por cada parte do nome que aparece
      for (const parte of partes) {
        if (pNorm.includes(norm(parte))) score += 2;
      }

      // Pontos extras por primeiro nome
      if (pNorm.startsWith(norm(primeiro))) score += 3;

      // Pontos extras por match exato sem acento
      if (pNorm === nNorm) score += 10;

      todos.push({ ...p, score });
    }

    todos.sort((a, b) => b.score - a.score);
    const melhores = todos.filter(t => t.score >= 4).slice(0, 3);

    if (melhores.length > 0) {
      for (const m of melhores) {
        console.log(`  → [score ${m.score}] "${m.nome}" (ID ${m.id})`);
      }
    } else if (todos.length > 0) {
      console.log(`  → Melhores candidatos (score baixo):`);
      for (const m of todos.slice(0, 3)) {
        console.log(`    [score ${m.score}] "${m.nome}" (ID ${m.id})`);
      }
    } else {
      console.log(`  → NENHUM candidato encontrado`);
    }
  }

  // Contagem final
  const total = await prisma.solicitacaoBeneficio.count();
  const valor = await prisma.solicitacaoBeneficio.aggregate({
    _sum: { valorCalculado: true },
    where: { status: { in: ["aprovado", "concluido"] } },
  });
  console.log(`\n${"=".repeat(90)}`);
  console.log(`Total registros atual: ${total}`);
  console.log(`Valor aprovados+concluídos: R$ ${Number(valor._sum.valorCalculado || 0).toFixed(2)}`);
}

main().finally(() => prisma.$disconnect());
