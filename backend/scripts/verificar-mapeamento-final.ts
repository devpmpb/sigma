import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Mapeamentos que apontam para nomes que podem não existir no banco
const MAPEAMENTO_NOMES: Record<string, string> = {
  "Alexandre Luis Kapser": "ALEXANDRE LUIS KASPER",
  "Claudir J. Benkenkamp": "CLAUDIR JOAO BECKENKAMP",
  "Célio Luiz Engellmann": "CELIO LUIS ENGELMANN",
  "Debora Hunemeier (Cleiton)": "DEBORA HUNEMEIER",
  "Deivid Carlos Kowald": "DEIVID KOWALD",
  "Deivid Kowald": "DEIVID KOWALD",
  "Erci Kaul Gartiner": "ERCI KAUL GARTINER",
  "Arni Henz": "ARNI HENZ",
  "Geraldo Hefer": "GERALDO HOFER",
  "Jonas Hagdon": "JONAS HAGDON",
  "Irica Bastian Heinz": "IRICA BASTIAN HEINZ",
  "Nelsy Nogueira Hugue": "NELSY NOGUEIRA HUGUE",
  "Rafael Rodrigo Hemsing": "RAFAEL RODRIGO HEMSING",
  "Genecilda Ribeiro da Silva": "GENECILDA RIBEIRO DA SILVA",
  "Silmara de Oliveira": "SILMARA DE OLIVEIRA",
  "Vanderlei Astor Reinke": "VANDERLEI ASTOR REINKE",
  "Antônio Coelho": "ANTONIO COELHO",
  "Marcelo Maldaner": "MARCELO JOSE MALDANER",
  "Giuvane C.S. Marholdt": "GIUVANE CINARA SZCZUK MARHOLDT",
  "Giuvane C.S. Marholt": "GIUVANE CINARA SZCZUK MARHOLDT",
  "Katia J. F. Cottica": "KATIA JUSSARA FRITZ COTTICA",
  "Katia J.F.Cottica": "KATIA JUSSARA FRITZ COTTICA",
  "Maria I. G. Fuhr": "MARIA INES GARTINER FUHR",
  "Maria I.G. Fuhr": "MARIA INES GARTINER FUHR",
  "Ida Adam": "IDA MEINHARDT ADAM",
  "Ida M. Adam": "IDA MEINHARDT ADAM",
  "Everson W. Kunzler": "EVERSON WENDELINO KUNZLER",
  "Rogério C. Mundt": "ROGERIO CARLOS MUNDT",
  "Marlosn J. Kohl": "MARLON JOSE KOHL",
  "Valério A. Dassoler": "VALERIO ANTONIO DASSOLER",
  "Braz Guesser": "BRAZ GUESSER",
};

async function main() {
  console.log("VERIFICAÇÃO: Quais nomes do MAPEAMENTO existem no banco?");
  console.log("=".repeat(90));

  let encontrados = 0;
  let naoEncontrados = 0;
  const problemáticos: string[] = [];

  for (const [planilha, banco] of Object.entries(MAPEAMENTO_NOMES)) {
    const pessoa = await prisma.pessoa.findFirst({
      where: { nome: { equals: banco, mode: "insensitive" } },
    });
    if (pessoa) {
      console.log(`OK    | "${planilha}" → "${pessoa.nome}" (ID ${pessoa.id})`);
      encontrados++;
    } else {
      console.log(`FALHA | "${planilha}" → "${banco}" NÃO EXISTE`);
      naoEncontrados++;
      problemáticos.push(`${planilha} → ${banco}`);
    }
  }

  console.log(`\n${"=".repeat(90)}`);
  console.log(`Encontrados: ${encontrados}`);
  console.log(`Não encontrados: ${naoEncontrados}`);

  if (problemáticos.length > 0) {
    console.log(`\nMAPEAMENTOS INVÁLIDOS (nome alvo não existe no banco):`);
    for (const p of problemáticos) {
      console.log(`  - ${p}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
