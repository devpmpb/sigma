import prisma from '../../src/utils/prisma';

async function buscar() {
  // [searchTerms, label] - searchTerms are ANDed (all must match)
  const termos: Array<[string[], string]> = [
    [['Kolzler'], '1. Adelar Kolzler'],
    [['Vorpaguel'], '2. Beno Vorpaguel'],
    [['Niederle'], '3. Daiane Niederle'],
    [['Passini'], '4. Deolir Passini'],
    [['Rejala'], '5. Elaine Rejala'],
    [['Rosinski'], '6. Gilmar Rosinski'],
    [['Cosseau'], '7. Gilson Cosseau'],
    [['Giovana', 'Pauli'], '8. Giovana Pauli'],
    [['Allbring'], '9. Harri Allbring (+ 15. Maico + 16. Marcelo)'],
    [['Favaretto'], '10. Hilário Favaretto (+ 50. Thomas)'],
    [['Sauer'], '11. Ivo Sauer'],
    [['João', 'Pauli'], '12. João Pauli'],
    [['Passos'], '13. José F. dos Passos (+ 18. Mario dos Passos)'],
    [['Rosinski'], '14+6. Luis/Gilmar Rosinski'],
    [['Cottica'], '17. Marcio Cottica (+ 45. Katia)'],
    [['Milton', 'Machado'], '19. Milton Machado'],
    [['Schiber'], '20. Nildo Schiber'],
    [['Eninger'], '21. Semário Eninger'],
    [['Shaeffer'], '22. Valdenirio Shaeffer'],
    [['Schaeffer'], '22b. Valdenirio Schaeffer (alt spelling)'],
    [['Schaef'], '22c. Valdenirio *Schaef* (partial)'],
    [['Ventz'], '23. Vali Ventz'],
    [['Bierkheuer'], '24. Claudio Bierkheuer'],
    [['Bierkheu'], '24b. Claudio Bierkheu* (partial)'],
    [['Bierk'], '24c. Claudio Bierk* (partial)'],
    [['Marcelo', 'Maldaner'], '25. Marcelo Maldaner'],
    [['Wojtiok'], '26. Gregório Wojtiok'],
    [['Wojtio'], '26b. Gregório Wojtio* (partial)'],
    [['Hunemeier'], '27. Cleiton Almir Hunemeier (+ 44. Germano)'],
    [['Hunemei'], '27b. Hunemeier partial'],
    [['Finken'], '28. Carlito Finken'],
    [['Vanderlei', 'Reinke'], '29. Vanderlei Astor Reinke'],
    [['Kammer'], '30. José Elias Kammer'],
    [['Wastowski'], '31. Silvio Wastowski (+ 53. Eduardo + 94. Sergio)'],
    [['Emerson', 'Henz'], '32. Emerson R. Henz'],
    [['Engelmann'], '33. Edson Luis Engelmann'],
    [['Lehmkuhl'], '34. Darlan Lehmkuhl (+ 66. Ilvanei)'],
    [['Steffler'], '35. Eleandro Steffler'],
    [['Hoefer'], '36. Luan Hoefer'],
    [['Marchall'], '37. Vilmar Marchall'],
    [['Magnabosco'], '38. Valdair Magnabosco'],
    [['Eloim', 'Schneider'], '39. Eloim Schneider'],
    [['Hafer'], '40. Geraldo Hafer'],
    [['Selzer'], '41. Roque Selzer'],
    [['Kieling'], '42. Bertilo Kieling'],
    [['Kaiser'], '43. Flávio Kaiser'],
    [['Bender'], '46. Irio Bender (+ 90. Neide)'],
    [['Kopsel'], '47. Marceli Kopsel'],
    [['Simara', 'Oliveira'], '48. Simara de Oliveira'],
    [['Weschenfelder'], '49. Cristiano Weschenfelder'],
    [['Simsen'], '51. Adelmo Simsen'],
    [['Urhy'], '52. Claudio V. Urhy'],
    [['Kunzler'], '54. Everson Kunzler'],
    [['Bocorni'], '55. Gorete Bocorni'],
    [['Walmir', 'Rieger'], '56. Walmir Volnei Rieger'],
    [['Roos'], '57. Nelson Roos'],
    [['Cassel'], '58. Armo Guinter Cassel'],
    [['Cezar', 'Auth'], '59. Cezar Auth'],
    [['Kiling'], '60. Clovis Kiling'],
    [['Kilin'], '60b. Clovis Kilin* (partial)'],
    [['Wosniack'], '61. Carlos M Wosniack'],
    [['Wosniac'], '61b. Carlos Wosniac* (partial)'],
    [['Sinsen'], '62. Leomar Sinsen'],
    [['Sulzbacher'], '63. Mateus Sulzbacher Heinz'],
    [['Zeiwbricker'], '64. Normelio Zeiwbricker'],
    [['Zeiwbr'], '64b. Normelio Zeiwbr* (partial)'],
    [['Szczuk'], '65. Rosani Szczuk'],
    [['Schuck'], '65b. Rosani Schuck'],
    [['Drewes'], '67. Rodrigo Drewes'],
    [['Selvino', 'Schmitt'], '68. Selvino Schmitt'],
    [['Stefans'], '69. Manfredo Stefans'],
    [['Bombardeli'], '70. Romeu Bombardeli'],
    [['Bombardel'], '70b. Romeu Bombardel* (partial)'],
    [['Mittelstaedt'], '71. Jefeson Mittelstaedt'],
    [['Mittelsta'], '71b. Jefeson Mittelsta* (partial)'],
    [['Vilamar', 'Pauli'], '72. Vilamar Pauli'],
    [['Pauli'], '72b+8+12. Todos os Pauli'],
    [['Zanon', 'Bianchetti'], '73. Angela Zanon Bianchetti'],
    [['Bianchetti'], '73b. Angela Bianchetti'],
    [['Niedere'], '74. Claudia A. P. Niedere'],
    [['Niederl'], '74b. Claudia Niederl* (partial, could be Niederle)'],
    [['Warken'], '75. Nadir Warken'],
    [['Siebeneichler'], '76. Deonisio A. Siebeneichler'],
    [['Siebeneichl'], '76b. Siebeneichl* (partial)'],
    [['Hunemeyer'], '77. Cristiane Hunemeyer'],
    [['Hoppe'], '78. Egoen Hoppe'],
    [['Adriane', 'Vilela'], '79. Adriane Vilela'],
    [['Sczuzk'], '80. José Sczuzk'],
    [['Szcz'], '80b. José Szcz* (partial)'],
    [['Sphor'], '81+82. Clorido/Rogério Sphor'],
    [['Spohr'], '81b+82b. Clorido/Rogério Spohr (alt spelling)'],
    [['Lurdes', 'Fuhr'], '83. Maria de Lurdes B. Fuhr'],
    [['Bourscheid'], '84. Maico Bourscheid'],
    [['Saueressig'], '85. Edson Saueressig de Souza'],
    [['Genteline'], '86. Marcelo Genteline'],
    [['Gentelin'], '86b. Marcelo Gentelin* (partial)'],
    [['Wurfel'], '87. Arnaldo Wurfel'],
    [['Würfel'], '87b. Arnaldo Würfel (com acento)'],
    [['Cristiane', 'Fritzen'], '88. Cristiane Fritzen'],
    [['Fritzen'], '88b. Todos Fritzen'],
    [['Gasparin'], '89. Isair Antonio Gasparin'],
    [['Kroll'], '91. Osvaldo Kroll'],
    [['Marodin'], '92. Paulo C. Marodin'],
    [['Sandra', 'Frizen'], '93. Sandra Frizen'],
    [['Sergio', 'Wastowski'], '94. Sergio Lauri Wastowski'],
    [['Sergio', 'Scherer'], '95. Sergio Luis Scherer'],
    [['Mundt'], '96. Rogério Claudio Mundt'],
    [['Khun'], '97. Valdir Khun'],
    [['Kuhn'], '97b. Valdir Kuhn (alt spelling)'],
  ];

  console.log('=== BUSCA DE PENDENTES MIGRAÇÃO 2024 ===\n');

  for (const [searchTerms, label] of termos) {
    const where: any = {
      AND: searchTerms.map(term => ({
        nome: { contains: term, mode: 'insensitive' }
      }))
    };

    const res = await prisma.pessoa.findMany({
      where,
      select: { id: true, nome: true, ativo: true },
      orderBy: { nome: 'asc' }
    });

    if (res.length > 0) {
      const matches = res.map(r => `${r.id} - ${r.nome}${r.ativo ? '' : ' (INATIVO)'}`).join(' | ');
      console.log(`✓ ${label}: ${matches}`);
    } else {
      console.log(`✗ ${label}: NAO ENCONTRADO`);
    }
  }

  await prisma.$disconnect();
}

buscar().catch(e => {
  console.error(e);
  prisma.$disconnect();
});
