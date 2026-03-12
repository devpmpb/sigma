import prisma from '../../src/utils/prisma';

/**
 * Busca pendentes da migração 2025 - fuzzy name matching
 * Cada entrada: [searchTerms[], nomeOriginal, comentario?]
 * searchTerms são ANDed via ILIKE/contains insensitive
 */
async function buscar() {
  // Mapeamento: nome da planilha -> termos de busca no banco
  // Agrupados por pessoa provável (variações do mesmo nome)
  const termos: Array<[string[], string]> = [
    // === SIMSEN / SINSEN ===
    [['Adelmo', 'Simsen'], 'Adelmo Simsen'],
    [['Leomar', 'Simsen'], 'Leomar Sinsen → Leomar Simsen?'],

    // === BORRELI ===
    [['Dorvalino', 'Borrel'], 'Dorvalino Borreli'],
    [['Dorvalino'], 'Dorvalino (só primeiro nome)'],

    // === NIEDERLE ===
    [['Gabriel', 'Niederle'], 'Gabriel Niederle / Gabriel H. Niederle'],
    [['Daiane', 'Niederle'], 'Daiane Niederle'],

    // === HUNEMEIER / HUNEMEYER / HUNEMEIR ===
    [['Germano', 'Huneme'], 'Germano Hunemeier / Germano A. Hunemeier'],
    [['Adir', 'Huneme'], 'Adir Hunemeier / Adir Vanderlei Hunemeier'],
    [['Alcides', 'Huneme'], 'Alcides Hunemeyer → Alcides Hunemeier?'],
    [['Cristiane', 'Huneme'], 'Cristiane Hunemeyer → Cristiane Hunemeier?'],

    // === FRITZEN ===
    [['Jeferson', 'Fritzen'], 'Jeferson F. Fritzen'],
    [['Viviane', 'Fritzen'], 'Viviane Fritzen Fincke'],

    // === MALDANER ===
    [['Marcelo', 'Maldaner'], 'Marcelo Maldaner'],
    [['Maldaner'], 'Maldaner (sobrenome)'],

    // === SZCZUK / ZCZUCK ===
    [['Rosani', 'Szczuk'], 'Rosani C. Zczuck → Rosani Szczuk?'],

    // === LEWANDOWSKI ===
    [['Sergio', 'Lewandowski'], 'Sergio Lewandowski'],
    [['Lewandowski'], 'Lewandowski (sobrenome)'],

    // === KLEEMANN ===
    [['Walter', 'Kleemann'], 'Walter Kleemann'],
    [['Kleemann'], 'Kleemann (sobrenome)'],

    // === SCHEUERMANN / SCHEURMANN ===
    [['Edson', 'Scheuermann'], 'Edson Scheurmann → Edson Scheuermann?'],
    [['Wilson', 'Scheuermann'], 'Wilson Scheurmann → Wilson Scheuermann?'],
    [['Gunter', 'Scheuermann'], 'Guinter B. Scheuermann → Gunter Scheuermann?'],

    // === ZEIWBRICKER / ZEIWEIBRICHER / SIEBENEI* ===
    [['Normelio'], 'Normelio Zeiwbricker (só primeiro nome)'],
    [['Jacinto'], 'Jacinto Zeiwbricker/Zeiweibricher/Zeibricker (só primeiro nome)'],
    [['Deonisio', 'Siebeneichler'], 'Deonizio/Dionisio Siebeneschler/Siebeneischler → Siebeneichler'],

    // === KILING / KIELING ===
    [['Bertilo', 'Kieling'], 'Bertilo Kiling → Bertilo Kieling?'],
    [['Clovis', 'Kieling'], 'Clóvis Renato Kieling'],

    // === SCHMELPFENNIG ===
    [['Carlos', 'Schm'], 'Carlos Schmmelpfnnig (busca ampla Schm)'],
    [['Schmelpf'], 'Schmelpfennig (partial)'],
    [['Schmoller'], 'Schmoller? (similar)'],

    // === PAULWELS / PAUWELS / PUWLS ===
    [['Carlos', 'Pauwels'], 'Carlos V. Paulwes/Paulwels/Puwls → Pauwels?'],
    [['Pauwels'], 'Pauwels (sobrenome banco)'],

    // === AUTH ===
    [['Cesar', 'Auth'], 'Cezar Auth / Cesar Alth → Cesar Auth?'],

    // === MARHOLT ===
    [['Giuvane', 'Marholt'], 'Giuvane Marholt / Giuvane C.S. Marholt'],
    [['Giuvane'], 'Giuvane (só primeiro nome)'],

    // === ECKARDT ===
    [['Marcos', 'Eckardt'], 'Marcos Eckart/Eckaert → Marcos Eckardt?'],

    // === HEINZ ===
    [['Matheus', 'Heinz'], 'Matheus Heinz'],
    [['Sulzbacher', 'Heinz'], 'Mateus Sulzbacher Heinz (2024 ref)'],
    [['Irica', 'Heinz'], 'Irica B. Heinz'],
    [['Heinz'], 'Todos Heinz'],

    // === HENZ ===
    [['Emerson', 'Henz'], 'Emerson R. Henz'],
    [['Henz'], 'Todos Henz'],

    // === TRACZINSKI ===
    [['Pedro', 'Traczinski'], 'Pedro Traczinski / Pedro J. Tracznski'],
    [['Geraldo', 'Traczinski'], 'Geraldo Traczinski (encontrado no banco)'],

    // === SELZER ===
    [['Roque', 'Selzer'], 'Roque Selzer/Selszer'],
    [['Roque', 'Selser'], 'Roque Selser* (partial)'],
    [['Roque', 'Selz'], 'Roque Selz* (partial)'],

    // === RIEGER ===
    [['Valdecir', 'Rieger'], 'Valdecir Rieger'],

    // === VILELA ===
    [['Adriana', 'Vilela'], 'Adriana Vilella → Adriana Vilela?'],

    // === HOFFER / HOEFER ===
    [['Luan', 'Hoe'], 'Luan Hoffer → Luan Hoefer?'],
    [['Geraldo', 'Hoefer'], 'Geraldo Hoefer'],
    [['Hoefer'], 'Hoefer (sobrenome)'],
    [['Hoffer'], 'Hoffer (sobrenome)'],

    // === HAMESKI ===
    [['Valdir', 'Hamesk'], 'Valdir Hameski'],
    [['Hamesk'], 'Hameski (sobrenome)'],
    [['Hamese'], 'Hamese* (partial)'],

    // === LEHMKUHL / LEMPKUL ===
    [['Ilvanei', 'Lehmkuhl'], 'Ilvonei/Ilvanei Lehmkhul/Lempkul → Lehmkuhl'],
    [['Darlon', 'Lehmkuhl'], 'Darlon Lempkul → Darlon Lehmkuhl?'],

    // === STEFAN / STEFFANS ===
    [['Manfredo', 'Stefan'], 'Mnafredo Stefans / Manfredo Steffans → Manfredo Stefan'],

    // === FRANCZISKOWSKI ===
    [['Deonisio', 'Francziskowski'], 'Deonisio Fransciskowski/Franczskowski → Francziskowski'],

    // === KUHN / KHUN ===
    [['Valdir', 'Kuhn'], 'Valdir Roberto Khun → Valdir Roberto Kuhn?'],
    [['Clair', 'Kuhn'], 'Clair Khun → Clair Kuhn?'],

    // === KOWALD ===
    [['Deivid', 'Kowald'], 'Deivid Carlos Kowald → Devid Carlos Kowald?'],
    [['Devid', 'Kowald'], 'Devid Carlos Kowald (grafia banco)'],

    // === BECKENKAMP ===
    [['Claudir', 'Beckenkamp'], 'Claudir Bekerkamp → Claudir Beckenkamp?'],

    // === BIANCHESSI / BIANCHESI ===
    [['Fernando', 'Bianch'], 'Fernando Biachesi/Bianchesi'],
    [['Alceu', 'Bianch'], 'Alceu Bianchesi'],
    [['Bianchess'], 'Bianchessi (grafia banco)'],
    [['Bianchett'], 'Bianchetti (outra grafia)'],

    // === SCHNEIDER ===
    [['Pedro', 'Schneider'], 'Pedro Schneider'],
    [['Dirceu', 'Schneider'], 'Dirceu M. Schneider'],

    // === DREWES ===
    [['Hildegard', 'Drewes'], 'Hildegard Drewes'],
    [['Drewes'], 'Drewes (sobrenome)'],
    [['Rodrigo', 'Drewes'], 'Rodrigo Drewes (2024 ref)'],

    // === FUHR ===
    [['Jose', 'Balduino', 'Fuhr'], 'José B. Fuhr / José Balduino Fuhr'],
    [['Maria', 'Lurdes', 'Fuhr'], 'Maria L. B. Fuhr → Maria de Lurdes Fuhr?'],
    [['Maria', 'Ines', 'Fuhr'], 'Maria Ines Fuhr / Maria I.G. Fuhr'],

    // === BURKAUER ===
    [['Claudio', 'Burkau'], 'Claudio Burkauer'],
    [['Burkau'], 'Burkauer (sobrenome)'],

    // === KROLL ===
    [['Osvaldo', 'Kroll'], 'Osvaldo Krholl → Osvaldo Kroll'],

    // === STHALHOFER / STADTLOBER ===
    [['Ivonir', 'Sthal'], 'Ivonir Sthalhofer/Sthalofer/Stahlfofer'],
    [['Ivonir', 'Stadl'], 'Ivonir Stadtlober? (possível grafia real)'],
    [['Ivonir', 'Staa'], 'Ivonir Staadtlober? (grafia banco)'],
    [['Ivonir', 'Stadt'], 'Ivonir Stadt* (partial)'],
    [['Helio', 'Sthal'], 'Helio Sthatlhober → Sthalhofer?'],
    [['Stadlob'], 'Stadtlober (sobrenome banco)'],
    [['Staadtlob'], 'Staadtlober (sobrenome banco)'],

    // === WOLF ===
    [['Livo', 'Wolf'], 'Livo Wollf → Livo Wolf'],

    // === PAULI ===
    [['Claudenei', 'Pauli'], 'Claudinei Pauli → Claudenei Pauli?'],
    [['Antonio', 'Jose', 'Pauli'], 'Antônio José Pauli'],

    // === SEIBENICLER / SIEBENEICHLER ===
    [['Deonisio', 'Siebeneichler'], 'Deonisio Seibenicler → Siebeneichler'],

    // === BENDER ===
    [['Irio', 'Bender'], 'Erio Bender → Irio Bender?'],

    // === MASCHNER ===
    [['Sergio', 'Maschner'], 'Sergio Maschner'],
    [['Maschner'], 'Maschner (sobrenome)'],

    // === FISCHER ===
    [['Leonir', 'Fischer'], 'Leonir Fischer'],
    [['Leoni', 'Fischer'], 'Leoni Fischer (grafia banco)'],
    [['Neldo', 'Fischer'], 'Neldo Pedro Fiscxher → Fischer'],

    // === HOPPE ===
    [['Egon', 'Hoppe'], 'Egon Hope → Egon Hoppe'],

    // === KAPES ===
    [['Genuario'], 'Genuario Kapes (só primeiro nome)'],
    [['Kapes'], 'Kapes (sobrenome)'],
    [['Kappes'], 'Kappes (alt spelling)'],

    // === SIMON ===
    [['Margarida', 'Simon'], 'Margarida Simom → Maria Margarida Simon'],
    [['Maria', 'Simon'], 'Maria Simon / Maria M. Simon'],

    // === ENGELMANN ===
    [['Eliseu', 'Engelmann'], 'Eliseu Engelmann → Elizeu Engelmann?'],
    [['Elizeu', 'Engelmann'], 'Elizeu M. Engelmann'],
    [['Celio', 'Engelmann'], 'Célio Luis Engellmann → Celio Luis Engelmann'],
    [['Adelio', 'Engelmann'], 'Adelio L. Engellmann → Adelio Luiz Engelmann'],
    [['Flavia', 'Engelmann'], 'Flávia Engelmann'],

    // === KLERING ===
    [['Elsa', 'Klering'], 'Elsa Klering / Elsa S. Klering'],
    [['Klering'], 'Klering (sobrenome)'],

    // === BUHL ===
    [['Darci', 'Buhl'], 'Darci Bhul → Darci Buhl'],

    // === SCHMITT ===
    [['Ido', 'Schmitt'], 'Ido Schimit → Ido Schmitt'],

    // === FOGAÇA ===
    [['Leila', 'Foga'], 'Leila Maria Fogasa → Fogaça?'],
    [['Fogaca'], 'Fogaça'],
    [['Fogassa'], 'Fogassa'],

    // === MAGNABOSCO ===
    [['Valdoir', 'Magnabosco'], 'Vandoir Magnabosco → Valdoir Magnabosco?'],

    // === MITTELSTAEDT ===
    [['Jeferson', 'Mittelstaedt'], 'Jeferson Mittelstaedt'],
    [['Ana', 'Caroline', 'Mittelstaedt'], 'Ana Caroline P. Mittelstaedt'],
    [['Ana', 'Pauli', 'Mittelstaedt'], 'Ana C. P. Mittelstaedt'],

    // === GUESSER ===
    [['Braz', 'Guesser'], 'Braz Guesser'],

    // === SOUZA ===
    [['Edson', 'Saueressig', 'Souza'], 'Edson S. de Souza → Edson Saueressig de Souza?'],
    [['Saueressig'], 'Saueressig'],

    // === ADAM ===
    [['Ida', 'Adam'], 'Ida Adam / Ida M. Adam'],
    [['Adam'], 'Adam (sobrenome)'],

    // === WESCHENFELDER ===
    [['Cristiano', 'Weschenfelder'], 'Crisitiano Weschelfelder → Cristiano Weschenfelder'],

    // === LANGER ===
    [['Carla', 'Langer'], 'Carla Danila Lnager → Carla Danila Langer'],

    // === STEFFLER ===
    [['Eleandro', 'Steffler'], 'Eleandro Steffler'],
    [['Eleandro'], 'Eleandro (só primeiro nome - busca Wojtiok)'],

    // === PREUSS ===
    [['Gustavo', 'Preuss'], 'Gustavo R. Preuess → Gustavo Preuss'],

    // === SCHOLLER / SCHMOLLER ===
    [['Elsa', 'Schmoller'], 'Elsa Scholler → Elsa Schmoller?'],

    // === DIEHL ===
    [['Ivanete', 'Diehl'], 'Ivanete M. Diehl'],
    [['Diehl'], 'Diehl (sobrenome)'],

    // === BOURSCHEID ===
    [['Alceu', 'Bourscheid'], 'Alceu A. Bourcheid → Alceu Bourscheid'],

    // === GENTILINI / GENTELINI / GENTELINE ===
    [['Marcelo', 'Gentelin'], 'Marcelo José Gentilini/Gentelini → Marcelo Genteline?'],

    // === MUNDT ===
    [['Rogerio', 'Mundt'], 'Rogério Claudio Mundt'],

    // === STENSKE / STRENSKE ===
    [['Cleonice', 'Stenske'], 'Cleonice S. Stenske'],
    [['Strenske'], 'Strenske (alt spelling)'],

    // === SCHAEFFER / SCAFFER ===
    [['Valdenirio', 'Schaef'], 'Valdenirio Scaffer → Schaeffer?'],
    [['Valdenirio'], 'Valdenirio (só primeiro nome)'],

    // === BIASIBETTI ===
    [['Valdir', 'Biasibetti'], 'Valdir João Biasebetti → Biasibetti'],

    // === KOTZ ===
    [['Evaldo', 'Kotz'], 'Evando Kotz → Evaldo Kotz?'],

    // === KOCH ===
    [['Geovana', 'Koch'], 'Geovana L. P. Koch'],
    [['Koch'], 'Koch (sobrenome) - muitos'],

    // === SIMONETTI / SIMONETTE ===
    [['Luis', 'Simonett'], 'Luis Simonette / Luis V. Simonette → Luiz Valmor Simonetti?'],

    // === WASTOWSKI / WANZOWSKI ===
    [['Eduardo', 'Wastowski'], 'Eduardo Wastowski / Eduardo G. Wastowski'],
    [['Sergio', 'Wastowski'], 'Sergio Wastoski/Wastwoski/Lauri Wastowski'],
    [['Djonathan', 'Wastowski'], 'Djonathan Wastwoski → Djonathan Wastowski'],
    [['Silvio', 'Wanzowski'], 'Silvio Wanzowski'],
    [['Wanzowski'], 'Wanzowski (sobrenome)'],
    [['Wansov'], 'Wansov* (partial - banco pode ter Wansovski)'],

    // === OLINIKI ===
    [['Edoir'], 'Edoir Oliniki (só primeiro nome)'],
    [['Oliniki'], 'Oliniki'],
    [['Olini'], 'Olini* (partial)'],

    // === PILGER ===
    [['Alessandro', 'Pilger'], 'Alessandro C. Pilger'],
    [['Pilger'], 'Pilger (sobrenome)'],

    // === URHY ===
    [['Claudio', 'Urhy'], 'Claudio V. Urhy'],
    [['Urhy'], 'Urhy (sobrenome)'],

    // === PASSOS ===
    [['Mario', 'Passos'], 'Mario F. dos Passos'],

    // === DASSOLER ===
    [['Valerio', 'Dassoler'], 'Valério Dassoler'],

    // === SMYSLONY ===
    [['Anilda'], 'Anilda S. Smyslony (só primeiro nome)'],
    [['Smyslony'], 'Smyslony'],
    [['Smyslo'], 'Smyslo* (partial)'],
    [['Smislon'], 'Smislon* (alt)'],

    // === TOILLER ===
    [['Paulo', 'Alfredo', 'Toil'], 'Paulo Alfredo Toiller'],
    [['Toiller'], 'Toiller'],
    [['Toiler'], 'Toiler'],
    [['Toller'], 'Toller (alt)'],

    // === GRUTKA ===
    [['Guilherme', 'Grutka'], 'Guilherme M. H. Grutka'],
    [['Grutka'], 'Grutka (sobrenome)'],

    // === SIEBEN ===
    [['Antonio', 'Sieben'], 'Antônio A. Sieben'],

    // === MILLER ===
    [['Mario', 'Miller'], 'Mario Miller'],
    [['Miller'], 'Miller (sobrenome)'],
    [['Müller'], 'Müller (alt)'],

    // === HUGUE ===
    [['Nelcy', 'Hugue'], 'Nelsy Nogueira Hugue → Nelcy Hugue?'],
    [['Nelsy', 'Hugue'], 'Nelsy Nogueira Hugue'],

    // === OLIVEIRA (Antônio) ===
    [['Antonio', 'Oliveira'], 'Antônio de Oliveira'],

    // === HEINZ (Irica) ===
    [['Irica'], 'Irica B. Heinz (só primeiro nome)'],

    // === ROSÁRIO ===
    [['Salatiel'], 'Salatiel do rosário'],

    // === GARTINER / GARTNER ===
    [['Erci', 'Gartin'], 'Erci K. Gartiner'],
    [['Gartner'], 'Gartner'],
    [['Gartin'], 'Gartin* (partial)'],

    // === OPPERMANN ===
    [['Rosane', 'Oppermann'], 'Rosane W. Oppermann'],

    // === BIERSDORF ===
    [['Helio', 'Biersdorf'], 'Hélio Biersdorf'],
    [['Biersdorf'], 'Biersdorf (sobrenome)'],

    // === REINKE ===
    [['Valter', 'Reinke'], 'Valyer Eldor Reinke → Valter Eldor Reinke?'],

    // === MARCHALL ===
    [['Vilmar', 'Marchall'], 'Vilmar Marchall'],
    [['Marchall'], 'Marchall'],
    [['Marechal'], 'Marechal (alt)'],

    // === WOITIOK / WOJTIOK ===
    [['Eleandro', 'Wojtiok'], 'Eleandro Woitiok → Eleandro Wojtiok?'],
    [['Eleandro', 'Stefler', 'Wojtiok'], 'Eleandro Stefler Wojtiok (nome completo banco)'],

    // === RIEGER (VALDECIR uppercase) ===
    [['Valdecir', 'Rieger'], 'VALDECIR RIEGER'],

    // === KOWALD (DEIVID uppercase) ===
    [['Devid', 'Kowald'], 'DEIVID KOWALD → Devid Kowald (banco)'],
  ];

  console.log('=== BUSCA DE PENDENTES MIGRACAO 2025 ===');
  console.log('=== Resultados com ID especifico para mapeamento ===\n');

  let found = 0;
  let notFound = 0;
  const foundMap: Map<string, string> = new Map();

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
      console.log(`OK ${label}: ${matches}`);
      found++;
    } else {
      console.log(`XX ${label}: NAO ENCONTRADO`);
      notFound++;
    }
  }

  console.log(`\n=== RESUMO: ${found} encontrados, ${notFound} nao encontrados ===`);

  // ============================================================
  // MAPEAMENTO FINAL PROPOSTO
  // Baseado nos resultados acima, mapear nome planilha -> ID banco
  // ============================================================
  console.log('\n\n========================================');
  console.log('MAPEAMENTO PROPOSTO: NOME PLANILHA -> ID BANCO');
  console.log('========================================\n');

  const mapeamento: Record<string, number | null> = {
    // ===== ENCONTRADOS COM CERTEZA =====
    'Adelmo Simsen': null,                     // Nenhum Adelmo entre os Simsen
    'Leomar Sinsen': 97,                       // LEOMAR SIMSEN
    'Dorvalino Borreli': 439,                  // DORVALINO BORELLI
    'Gabriel Niederle': null,                  // Nenhum Gabriel entre os Niederle
    'Gabriel H. Niederle': null,               // Nenhum Gabriel entre os Niederle
    'Daiane Niederle': null,                   // Nenhuma Daiane entre os Niederle
    'Germano Hunemeier': null,                 // Nenhum Germano entre os Hunemeier
    'Germano A. Hunemeier': null,              // Nenhum Germano entre os Hunemeier
    'Adir Hunemeier': 1092,                    // ADIR VANDERLEI HUNEMEIR
    'Adir Vanderlei Hunemeier': 1092,          // ADIR VANDERLEI HUNEMEIR
    'Alcides Hunemeyer': 507,                  // ALCIDES SIDNEI HUNEMEIER
    'Cristiane Hunemeyer': 718,                // CRISTIANE GRYGUTSCH HUNEMEIER
    'Jeferson F. Fritzen': null,               // Nenhum Jeferson entre os Fritzen
    'Viviane Fritzen Fincke': 3587,            // VIVIANE FRITZEN
    'Marcelo Maldaner': null,                  // Nenhum Marcelo entre os Maldaner
    'Rosani C. Zczuck': 300,                   // ROSANI CLEUSA SZCZUK
    'Sergio Lewandowski': null,                // Sobrenome não existe no banco
    'Walter Kleemann': null,                   // Só Ana Marcia Kleemann no banco
    'Edson Scheurmann': 916,                   // EDSON LUIS SCHEUERMANN
    'Wilson Scheurmann': 911,                  // WILSON IVO SCHEUERMANN
    'Guinter B. Scheuermann': 914,             // GUNTER BRUNO SCHEUERMANN
    'Normelio zeiwbricker': 925,               // NORMELIO LUIS ZEIWEIBRICKER
    'Normelio Zeiwbricker': 925,               // NORMELIO LUIS ZEIWEIBRICKER
    'Jacinto Zeiwbricker': 940,                // JACINTO ZEIWEIBRICKER
    'Jacinto Zeiweibricher': 940,              // JACINTO ZEIWEIBRICKER
    'Jacinto Zeibricker': 940,                 // JACINTO ZEIWEIBRICKER
    'Deonisio Seibenicler': 4474,              // DEONISIO ANTONIO SIEBENEICHLER
    'DEONIZIO SIEBENESCHLER': 4474,            // DEONISIO ANTONIO SIEBENEICHLER
    'DIONISIO SIEBENEISCHLER': 4474,           // DEONISIO ANTONIO SIEBENEICHLER
    'Bertilo Kiling': 433,                     // BERTILO LUIS KIELING
    'Clóvis Renato Kieling': 244,              // CLOVIS RENATO KIELING
    'Clovis Renato Kieling': 244,              // CLOVIS RENATO KIELING
    'Carlos Schmmelpfnnig': null,              // Sobrenome não existe no banco
    'Carlos Vanderlei puwls': 763,             // CARLOS VANDERLEI PAUWELS
    'Carlos V. Paulwes': 763,                  // CARLOS VANDERLEI PAUWELS
    'Carlos V. Paulwels': 763,                 // CARLOS VANDERLEI PAUWELS
    'Cezar Auth': 84,                          // CESAR MAURESIR AUTH
    'Cesar Alth': 84,                          // CESAR MAURESIR AUTH
    'Giuvane Marholt': null,                   // Nenhum Giuvane entre os Marholt
    'Giuvane C.S. Marholt': null,              // Nenhum Giuvane entre os Marholt
    'Marcos Eckart': 4085,                     // MARCOS CRISTIANO ECKARDT
    'Marcos Eckaert': 4085,                    // MARCOS CRISTIANO ECKARDT
    'Matheus Heinz': null,                     // Nenhum Matheus entre os Heinz
    'Pedro Traczinski': null,                  // Só Geraldo Traczinski (4070), Pedro não encontrado
    'Pedro J. Tracznski': null,                // Só Geraldo Traczinski (4070), Pedro não encontrado
    'Roque Selzer': 219,                       // ROQUE SELZLER
    'Roque Selszer': 219,                      // ROQUE SELZLER
    'Valdecir Rieger': 3156,                   // VALDECIR VOLNEI RIEGER
    'VALDECIR RIEGER': 3156,                   // VALDECIR VOLNEI RIEGER
    'Adriana Vilella': 4508,                   // ADRIANA IRACEMA VILELA CAPRIOTTI
    'Luan Hoffer': null,                       // Sobrenome não existe no banco
    'Valdir Hameski': null,                    // Sobrenome não existe no banco
    'Ilvonei Lehmkhul': 673,                   // ILVANEI ANTONIO LEHMKUHL
    'Ilvanei Lempkul': 673,                    // ILVANEI ANTONIO LEHMKUHL
    'Darlon Lempkul': 2539,                    // DARLON DOUGLAS LEHMKUHL
    'Mnafredo Stefans': 295,                   // MANFREDO STEFAN
    'Manfredo Steffans': 295,                  // MANFREDO STEFAN
    'Deonisio Fransciskowski': 789,            // DEONISIO FRANCZISKOWSKI
    'Deonisio Franczskowski': 789,             // DEONISIO FRANCZISKOWSKI
    'Valdir Roberto Khun': 864,                // VALDIR ROBERTO KUHN
    'Clair Khun': 821,                         // CLAIR BACKES KUHN
    'Deivid Carlos Kowald': 2851,              // DEVID CARLOS KOWALD
    'DEIVID KOWALD': 2851,                     // DEVID CARLOS KOWALD
    'Claudir Bekerkamp': 385,                  // CLAUDIR JOÃO BECKENKAMP
    'Fernando Biachesi': 884,                  // FERNANDO LUIS BIANCHESSI
    'Fernando Bianchesi': 884,                 // FERNANDO LUIS BIANCHESSI
    'Alceu Bianchesi': 652,                    // ALCEU BIANCHESSI
    'Pedro Schneider': 867,                    // PEDRO LUIZ SCHNEIDER
    'Dirceu M.Schneider': 239,                 // DIRCEU MARCELO SCHNEIDER
    'Hildegard Drewes': null,                  // Sobrenome não existe no banco
    'José B. Fuhr': 941,                       // JOSE BALDUINO FUHR
    'José Balduino Fuhr': 941,                 // JOSE BALDUINO FUHR
    'Maria L. B. Fuhr': null,                  // Não encontrada
    'Maria Ines Fuhr': null,                   // Não encontrada
    'Maria I.G. Fuhr': null,                   // Não encontrada
    'Claudio Burkauer': null,                  // Sobrenome não existe no banco
    'Osvaldo Krholl': 488,                     // OSVALDO KROLL
    'Ivonir Sthalhofer': null,                 // Provavelmente Staadtlober mas nenhum Ivonir
    'Ivonir Sthalofer': null,                  // Provavelmente Staadtlober mas nenhum Ivonir
    'Ivonir Luis Sthalhofer': null,            // Provavelmente Staadtlober mas nenhum Ivonir
    'Ivonir L. Stahlfofer': null,              // Provavelmente Staadtlober mas nenhum Ivonir
    'Helio Sthatlhober': 391,                  // HELIO STAADTLOBER
    'Livo Wollf': 109,                         // LIVO JOSÉ WOLF
    'Claudinei Pauli': 973,                    // CLAUDENEI PAULI
    'Antônio José Pauli': 607,                 // ANTONIO JOSE PAULI
    'Deonisio Seibenicler': 4474,              // DEONISIO ANTONIO SIEBENEICHLER (dup)
    'Erio Bender': 76,                         // IRIO AFFONSO BENDER
    'Sergio Maschner': null,                   // Sobrenome não existe no banco
    'Leonir Fischer': 91,                      // LEONI FISCHER (verificar se é a mesma pessoa)
    'Neldo Pedro Fiscxher': 2527,              // NELDO PEDRO FISCHER
    'Egon Hope': 1909,                         // EGON HOPPE
    'Genuario Kapes': 429,                     // GENUARIO KAPPES
    'Ivonir Sthalhofer': null,                 // Não encontrado (ver Staadtlober)
    'Margarida Simom': 204,                    // MARIA MARGARIDA SIMON
    'Maria Simon': 204,                        // MARIA MARGARIDA SIMON
    'Maria M. Simon': 204,                     // MARIA MARGARIDA SIMON
    'Eliseu Engelmann': 2182,                  // ELIZEU MARCIO ENGELMANN
    'Elizeu M.Engelmann': 2182,                // ELIZEU MARCIO ENGELMANN
    'Célio Luis Engellmann': 636,              // CELIO LUIZ ENGELMANN
    'Adelio L. Engellmann': 638,               // ADELIO LUIZ ENGELMANN
    'Flávia Engelmann': 1390,                  // FLAVIA CRISTIANE LICZKOWSKI ENGELMANN
    'Elsa Klering': null,                      // Nenhuma Elsa entre os Klering
    'Elsa S. Klering': null,                   // Nenhuma Elsa entre os Klering
    'Darci Bhul': 345,                         // DARCI BUHL
    'Ido Schimit': 266,                        // IDO SCHMITT
    'Leila Maria Fogasa': 3802,                // LEILA MARIA FOGASSA
    'Vandoir Magnabosco': 3705,                // VALDOIR MAGNABOSCO
    'Jeferson Mittelstaedt': null,             // Nenhum Jeferson entre os Mittelstaedt
    'Ana C. P. Mittelstaedt': null,            // Não encontrada (verificar Ana Caroline Pauli 1483)
    'Ana Caroline P. Mittelstaedt': null,       // Não encontrada
    'Braz Guesser': null,                      // Nenhum Braz entre os Guesser
    'Edson S. de Souza': null,                 // Não encontrado (Saueressig de Sousa existe)
    'Ida Adam': null,                          // Nenhuma Ida entre os Adam
    'Ida M. Adam': null,                       // Nenhuma Ida entre os Adam
    'Crisitiano Weschelfelder': 938,           // CRISTIANO RUDOLFO WESCHENFELDER
    'Carla Danila Lnager': 3397,               // CARLA DANILA LANGER
    'Eleandro Steffler': 1885,                 // ELEANDRO STEFLER WOJTIOK (Steffler=Stefler)
    'Gustavo R. Preuess': 354,                 // GUSTAVO RAFAEL PREUSS
    'Elsa Scholler': 58,                       // ELSA SCHMOLLER
    'Ivanete M. Diehl': null,                  // Sobrenome não existe no banco
    'Alceu A. Bourcheid': 566,                 // ALCEU ALOISIO BOURSCHEID
    'Marcelo José Gentilini': 4178,            // MARCELO JOSÉ GENTELINE
    'Marcelo José Gentelini': 4178,            // MARCELO JOSÉ GENTELINE
    'Rogério Claudio Mundt': 3195,             // ROGERIO CLAUDIO MUNDT
    'Rogério C. Mundt': 3195,                  // ROGERIO CLAUDIO MUNDT
    'Cleonice S. Stenske': 2071,               // CLEONICE SCHIRMER STRENSKE
    'Valdenirio Scaffer': 2931,                // VALDENIRIO SCHAFFER
    'Valdir João Biasebetti': 3086,            // VALDIR JOÃO BIASIBETTI
    'Evando Kotz': 102,                        // EVALDO KOTZ
    'Geovana L. P. Koch': null,                // Não encontrada
    'Luis Simonette': 200,                     // LUIZ VALMOR SIMONETTI
    'Luis V. Simonette': 200,                  // LUIZ VALMOR SIMONETTI
    'Eduardo Wastowski': null,                 // Nenhum Eduardo Wastowski no banco
    'Eduardo G. Wastowski': null,              // Nenhum Eduardo Wastowski no banco
    'Eduardo G. Wastowski ': null,             // Nenhum Eduardo Wastowski no banco
    'Sergio Wastoski': 501,                    // SERGIO LAURI WASTOWSKI
    'Sergio Lauri Wastwoski': 501,             // SERGIO LAURI WASTOWSKI
    'Djonathan Wastwoski': 3780,               // DJONATHAN RODRIGO WASTOWSKI
    'SILVIO WANZOWSKI': null,                  // Sobrenome não existe (Wansovski sim)
    'Edoir Oliniki': null,                     // Sobrenome não existe no banco
    'Alessandro C. Pilger': null,              // Sobrenome não existe no banco
    'Claudio V. Urhy': null,                   // Claussa Aline Urhy (1731) existe, Claudio não
    'Mario F. dos Passos': 2258,               // MARIO FERREIRA DOS PASSOS
    'Valério Dassoler': 79,                    // VALERIO AGOSTINHO DASSOLER
    'Anilda S. Smyslony': 332,                 // ANILDA STELTER ZMYSLONY
    'Paulo Alfredo Toiller': 768,              // PAULO ALFREDO TOILLIER
    'Guilherme M. H. Grutka': null,            // Sobrenome não existe no banco
    'Antônio A. Sieben': 2926,                 // ANTONIO ARLINDO SIEBEN
    'Mario Miller': null,                      // Sobrenome não existe no banco
    'Nelsy Nogueira Hugue': 2987,              // NELCY NOGUEIRA HUGUE
    'Antônio de Oliveira': 3164,               // ANTONIO DE OLIVEIRA
    'Irica B. Heinz': null,                    // Não encontrada
    'Salatiel do rosário': null,               // Não encontrado
    'Erci K. Gartiner': null,                  // Sobrenome não existe no banco
    'Rosane W. Oppermann': null,               // Nenhuma Rosane entre os Oppermann
    'Hélio Biersdorf': null,                   // Sobrenome não existe no banco
    'Valyer Eldor Reinke': 3328,               // VALTER ELDOR REINKE
    'vilmar Marchall': null,                   // Sobrenome não existe no banco
    'ELEANDRO WOITIOK': 1885,                  // ELEANDRO STEFLER WOJTIOK
    'Emerson R. Henz': null,                   // Nenhum Emerson entre os Henz
    'Emerson Henz': null,                      // Nenhum Emerson entre os Henz (no banco só 6 Henz)
  };

  console.log('Formato: "Nome Planilha" -> ID (NOME NO BANCO)\n');
  for (const [nome, id] of Object.entries(mapeamento)) {
    if (id !== null) {
      console.log(`  "${nome}" -> ${id}`);
    } else {
      console.log(`  "${nome}" -> ??? (NÃO ENCONTRADO)`);
    }
  }

  // Listar os que realmente não foram encontrados por nenhuma variação
  console.log('\n\n========================================');
  console.log('NOMES SEM CORRESPONDENCIA NO BANCO');
  console.log('(Precisam cadastro manual)');
  console.log('========================================\n');

  const semCorrespondencia = [
    'Adelmo Simsen (nenhum Adelmo entre os Simsen)',
    'Gabriel Niederle / Gabriel H. Niederle (nenhum Gabriel entre os Niederle)',
    'Daiane Niederle (nenhuma Daiane entre os Niederle)',
    'Germano Hunemeier / Germano A. Hunemeier (nenhum Germano entre os Hunemeier)',
    'Jeferson F. Fritzen (nenhum Jeferson entre os Fritzen)',
    'Marcelo Maldaner (nenhum Marcelo entre os Maldaner)',
    'Sergio Lewandowski (sobrenome não existe no banco)',
    'Walter Kleemann (só Ana Marcia Kleemann no banco)',
    'Carlos Schmmelpfnnig (sobrenome não existe)',
    'Giuvane Marholt / Giuvane C.S. Marholt (nenhum Giuvane entre os Marholt)',
    'Matheus Heinz (nenhum Matheus entre os Heinz)',
    'Emerson R. Henz (nenhum Emerson entre os Henz)',
    'Pedro Traczinski / Pedro J. Tracznski (só Geraldo Traczinski no banco)',
    'Luan Hoffer (sobrenome Hoffer/Hoefer não existe no banco)',
    'Valdir Hameski (sobrenome não existe)',
    'Hildegard Drewes (sobrenome não existe)',
    'Maria L. B. Fuhr / Maria Ines Fuhr / Maria I.G. Fuhr',
    'Claudio Burkauer (sobrenome não existe)',
    'Ivonir Sthalhofer/Sthalofer/Stahlfofer (nenhum Ivonir Staadtlober no banco)',
    'Sergio Maschner (sobrenome não existe)',
    'Elsa Klering / Elsa S. Klering (nenhuma Elsa entre os Klering)',
    'Jeferson Mittelstaedt (nenhum Jeferson entre os Mittelstaedt)',
    'Ana C. P. Mittelstaedt / Ana Caroline P. Mittelstaedt',
    'Braz Guesser (nenhum Braz entre os Guesser)',
    'Edson S. de Souza (não encontrado)',
    'Ida Adam / Ida M. Adam (nenhuma Ida entre os Adam)',
    'Ivanete M. Diehl (sobrenome não existe)',
    'Geovana L. P. Koch (nenhuma Geovana entre os Koch)',
    'Eduardo Wastowski / Eduardo G. Wastowski (nenhum Eduardo entre os Wastowski)',
    'SILVIO WANZOWSKI (Wansovski existe mas nenhum Silvio)',
    'Edoir Oliniki (sobrenome não existe)',
    'Alessandro C. Pilger (sobrenome não existe)',
    'Claudio V. Urhy (só Claussa Aline Urhy no banco, Claudio não)',
    'Guilherme M. H. Grutka (sobrenome não existe)',
    'Mario Miller (sobrenome não existe)',
    'Irica B. Heinz (não encontrada)',
    'Salatiel do rosário (não encontrado)',
    'Erci K. Gartiner (sobrenome não existe)',
    'Rosane W. Oppermann (nenhuma Rosane entre os Oppermann)',
    'Hélio Biersdorf (sobrenome não existe)',
    'vilmar Marchall (sobrenome não existe)',
  ];

  for (const nome of semCorrespondencia) {
    console.log(`  - ${nome}`);
  }

  await prisma.$disconnect();
}

buscar().catch(e => {
  console.error(e);
  prisma.$disconnect();
});
