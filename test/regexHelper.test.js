const assert = require('chai').assert;
const RegexHelper = require('../dist/regex-helper');

describe('RegexHelper', () => {
  it('should find article number correctly', () => {
    const result = new RegexHelper.RegexHelper()
      .query({
        regex: `(?:service|article) :? (\\d+)`,
        name: 'articleOrService',
        capturingGroup: [{ name: 'articleNumber', index: 1 }],
      })
      .subQuery({ regex: '\\d+$', name: 'digits' })
      .query({
        regex: `has been paid`,
        name: 'isPaid',
        test: true,
      })
      .findIn('The article: 471 has been paid on 12/12/2022.')
      .get('data');

    assert.equal(result['articleNumber'], '471');
  });
});

it('should find service number and amount correctly', () => {
  const result = new RegexHelper.RegexHelper()
    .query({
      regex: `(?:service|product) :? (\\d+)`,
      name: 'serviceOrProduct',
      capturingGroup: [{ name: 'serviceNumber', index: 1 }],
    })
    .query({ regex: 'of \\d{1,3}(?:,\\d{3})*(?:\\.\\d{2})?', name: 'amount' })
    .query({
      regex: `has been processed`,
      name: 'isProcessed',
      test: true,
    })
    .findIn('The service: 12345 has been processed for the amount of 1,250.75 on 10/12/2023.')
    .get('data');

  assert.equal(result['serviceNumber'], '12345');
  assert.equal(result['amount'], 'of 1,250.75');
  assert.equal(result['isProcessed'], 'true');
});

it('updateNextSubQuery should not update next subQuery', () => {
  const result = new RegexHelper.RegexHelper()
    .query({
      regex: `(?:service|product) :? (\\d+)`,
      name: 'serviceOrProduct',
    })
    .subQuery({ regex: '\\d+$', name: 'digits', updateNextSubQuery: false })
    .subQuery({ regex: 'service', name: 'service' })

    .findIn('The service: 12345 has been processed for the amount of 1,250.75 on 10/12/2023.')
    .get('data');

  assert.equal(result['digits'], '12345');
  assert.equal(result['service'], 'service');
});

it('should capture full name and email correctly', () => {
  const result = new RegexHelper.RegexHelper()
    .query({
      regex: `Name: ([A-Za-z]+ [A-Za-z]+)`,
      name: 'fullName',
      capturingGroup: [{ name: 'fullName', index: 1 }],
    })
    .query({
      regex: `Email: (\\w+\\.\\w+@\\w+\\.\\w+)`,
      name: 'emailSentence',
      capturingGroup: [{ name: 'email', index: 1 }],
    })
    .query({
      regex: `Registered successfully`,
      name: 'isRegistered',
      test: true,
    })
    .findIn('Name: John Doe, Email: john.doe@example.com. Registered successfully on 12/12/2022.')
    .get('data');

  assert.equal(result['fullName'], 'John Doe');
  assert.equal(result['email'], 'john.doe@example.com');
  assert.equal(result['isRegistered'], 'true');
});

it('should display correct multiple caturingGroup', () => {
  const result = new RegexHelper.RegexHelper()
    .query({
      regex: `Name: (John) (Doe)`,
      name: 'fullName',
      capturingGroup: [
        { name: 'firstName', index: 1 },
        { name: 'lastName', index: 2 },
      ],
    })
    .findIn('Name: John Doe, Email: john.doe@example.com. Registered successfully on 12/12/2022.')
    .get('data');

  assert.equal(result['firstName'], 'John');
  assert.equal(result['lastName'], 'Doe');
});

it('success should be equal to 100 percent', () => {
  const result = new RegexHelper.RegexHelper()
    .query({
      regex: `Name: (John) (Doe)`,
      name: 'fullName',
      capturingGroup: [
        { name: 'firstName', index: 1 },
        { name: 'lastName', index: 2 },
      ],
    })
    .findIn('Name: John Doe, Email: john.doe@example.com. Registered successfully on 12/12/2022.')
    .get('general');

  assert.equal(result.success_in_pc, '100');
});

it('multiple values found should be an array', () => {
  const result = new RegexHelper.RegexHelper()
    .query(
      {
        regex: `Name: John Doe`,
        name: 'fullName',
      },
      { flags: 'gi' }
    )
    .findIn(
      'Name: John Doe, Email: john.doe@example.com. Registered successfully on 12/12/2022. Document signed with: Name: John Doe'
    )
    .get('data');

  assert.isArray(result.fullName);
});

// FUZZY SEARCH

describe('Fuzzy Search Tests', () => {
  it('a match should happen on a text with deviation where fuzzy search is enabled', () => {
    const result = new RegexHelper.RegexHelper()
      .query({
        regex: `been paid`,
        name: 'isPaid',
        test: true,
        fuzzy: { expression: 'been paid' },
      })
      .findIn('The article: 471 has been paiid on 12/12/2022.')
      .get('data');

    assert.equal(result.isPaid, 'true');
  });

  it('should find the mandat amount with fuzzy search', () => {
    const result = new RegexHelper.RegexHelper()
      .query({
        regex: `total du mandat :? (\\d+)`,
        name: 'mandat',
        capturingGroup: [{ name: 'amount', index: 1 }],
        fuzzy: { expression: 'total du mandat' },
      })
      .findIn(
        "Le joueur incarne Iznogoud, personnage principal et antihéros, qui souhaite ardemment « devenir calife à la place du calife », et doit entamer un périple afin de trouver un « objet magique pour devenir calife » à travers une dizaine de niveaux variant de la ville à une zone herbeuse, en passant par un aquarium, une ville remplie de jouets et l'enfer. Total du manda : 87€. Il peut notamment marcher, courir, sauter sur diverses plates-formes, et se servir de trois types de projectiles, tels que les pièces d'or, pour vaincre ses ennemis."
      )
      .get('data');

    assert.equal(result.amount, '87');
  });

  it('should find year with incorrect formed word with given delimitator', () => {
    const result = new RegexHelper.RegexHelper()
      .query({
        regex: `exercice :? (\\d+)`,
        name: 'exerciceYear',
        capturingGroup: [{ name: 'year', index: 1 }],
        fuzzy: { expression: 'exercice', delimitator: ':' },
      })
      .findIn('Total du manda : 87€. Exerciice:2024')
      .get('data');

    assert.equal(result.year, '2024');
  });

  it('should find year with incorrect formed word and in absence of given delimitator', () => {
    const result = new RegexHelper.RegexHelper()
      .query({
        regex: `exercice :? (\\d+)`,
        name: 'exerciceYear',
        capturingGroup: [{ name: 'year', index: 1 }],
        fuzzy: { expression: 'exercice', delimitator: ':' },
      })
      .findIn('Total du manda : 87€. Exerciice 2024')
      .get('data');

    assert.equal(result.year, '2024');
  });

  it('should find mandate with incorrect formed word', () => {
    const result = new RegexHelper.RegexHelper()
      .query({
        regex: `mandat :? (\\d+)`,
        name: 'mandateAmount',
        capturingGroup: [{ name: 'amount', index: 1 }],
        fuzzy: { expression: 'mandat', delimitator: ':' },
      })
      .findIn('Total du Manda : 99€. Exerciice 2024')
      .get('data');

    assert.equal(result.amount, '99');
  });

  it('should not alter the original text if score = 1', () => {
    const text = 'Total du Mandat : 99€. Exerciice 2024';
    const result = new RegexHelper.RegexHelper()
      .query({
        regex: `mandat :? (\\d+)`,
        name: 'mandateAmount',
        capturingGroup: [{ name: 'amount', index: 1 }],
        fuzzy: { expression: 'mandat', delimitator: ':' },
      })
      .findIn(text)
      .get('fuzzy');

    assert.equal(result.count, 0);
  });

  it('should not trigger a text replacement if score = 1', () => {
    const result = new RegexHelper.RegexHelper()
      .query({
        regex: `mandat :? (\\d+)`,
        name: 'mandateAmount',
        capturingGroup: [{ name: 'amount', index: 1 }],
        fuzzy: { expression: 'mandat', delimitator: ':' },
      })
      .findIn('Total du Mandat : 99€. Exerciice 2024')
      .get('fuzzy');

    assert.equal(result.modifications, 0);
  });

  it('should find the mandat amount with misspelled mandat word', () => {
    const result = new RegexHelper.RegexHelper()
      .query({
        regex: `mandat :? (\\d+)`,
        name: 'mandateAmount',
        capturingGroup: [{ name: 'amount', index: 1 }],
        fuzzy: { expression: 'mandat' },
      })
      .findIn('Total du Maat 99€. Exerciice 2024')
      .get('data');

    assert.equal(result.amount, 99);
  });

  it('should find the mandate amount with multiple mandates', () => {
    const text =
      "article. ) Page 1\nINS 53082 Commune de COLFONTAINE Exercice:2023\ni Province du HAINAUT\nMandai 23000068 Réunion Directeurs généraux hennuyers Date du Collége Communal 01/02/2023\nMANDAT DE PAIEMENT\nLE COLLEGE COMMUNAL CHARGE LE DIRECTEUR FINANCIER DE PAYER LES DEPENSES CI-DESSOUS:\nArticle - Ordinaire 1 105/12316.2023\nFRAIS DE RECEPTION ET DE REPRESENTATION\nConcerne : Réunion Directeurs généraux hennuyers\nPayable a: 000004107 Bénéficiaire: Imputation : 23000115\nRIZOM RESTAURANT Engagement : 23000192\nrue Sainte-Louise 82 Echéance : 14/03/2023\n7301 Hornu\nIBAN: Communic. : Réunion Directeurs généraux he Journal caisse N°:\nCréd. actuel: 2.000.00 Créd. disponible: -6.908,62 Dispo. Groupe: 0,00 Extrait c.c.: NZ:\nMontant de l'imputation : 620,50 | Du: / /\nTotal 8 620,50 | Pour acquit: artiicle:2024 . Commentaires: Fait a: Le i |\nTotal du mandat: 620,50\nLE COLLEGE COMMUNAL charge LE DIRECTEUR FINANCIER de la Commune de payer les montants indiqués ci-dessus\nsoit lasomme de: Six Cent Vingt Euros Cinquante Cents\nORDONNANCE A COLFONTAINE LE 01/02/2023\nLE DIRECTEUR GENERAL L'ECHEVIN DES FINANCES\nt\n_—¢ C aN\nES Lt\nPa EN\n\\\nDANIEL BLANQUET G. LIVOLSI\n\n";

    const result = new RegexHelper.RegexHelper()
      .query({
        regex: `mandat :? (\\d+)`,
        name: 'mandateAmount',
        capturingGroup: [{ name: 'amount', index: 1 }],
        fuzzy: { expression: 'mandat' },
      })
      .findIn(text)
      .get('data');

    assert.equal(result.amount, 23000068);
  });

  it('should find the mandate amount with: Tootal du mandate', () => {
    const result = new RegexHelper.RegexHelper()
      .query({
        regex: `total du mandat :? (\\d+)`,
        name: 'mandat',
        capturingGroup: [{ name: 'amount', index: 1 }],
        fuzzy: { expression: 'total du mandat' },
      })
      .findIn(
        "Le joueur incarne Iznogoud, personnage principal et antihéros, qui souhaite ardemment « devenir calife à la place du calife », et doit entamer un périple afin de trouver un « objet magique pour devenir calife » à travers une dizaine de niveaux variant de la ville à une zone herbeuse, en passant par un aquarium, une ville remplie de jouets et l'enfer. Tootal du mandate : 87€. Il peut notamment marcher, courir, sauter sur diverses plates-formes, et se servir de trois types de projectiles, tels que les pièces d'or, pour vaincre ses ennemis."
      )
      .get('data');

    assert.equal(result.amount, 87);
  });

  it('should find the exercice with misspelled word and delimitator', () => {
    const text =
      "article. ) Page 1\nINS 53082 Commune de COLFONTAINE Exxercice:2023\ni Province du HAINAUT\nMandai 23000068 Réunion Directeurs généraux hennuyers Date du Collége Communal 01/02/2023\nMANDAT DE PAIEMENT\nLE COLLEGE COMMUNAL CHARGE LE DIRECTEUR FINANCIER DE PAYER LES DEPENSES CI-DESSOUS:\nArticle - Ordinaire 1 105/12316.2023\nFRAIS DE RECEPTION ET DE REPRESENTATION\nConcerne : Réunion Directeurs généraux hennuyers\nPayable a: 000004107 Bénéficiaire: Imputation : 23000115\nRIZOM RESTAURANT Engagement : 23000192\nrue Sainte-Louise 82 Echéance : 14/03/2023\n7301 Hornu\nIBAN: Communic. : Réunion Directeurs généraux he Journal caisse N°:\nCréd. actuel: 2.000.00 Créd. disponible: -6.908,62 Dispo. Groupe: 0,00 Extrait c.c.: NZ:\nMontant de l'imputation : 620,50 | Du: / /\nTotal 8 620,50 | Pour acquit: artiicle:2024 . Commentaires: Fait a: Le i |\nTotal du mandat: 620,50\nLE COLLEGE COMMUNAL charge LE DIRECTEUR FINANCIER de la Commune de payer les montants indiqués ci-dessus\nsoit lasomme de: Six Cent Vingt Euros Cinquante Cents\nORDONNANCE A COLFONTAINE LE 01/02/2023\nLE DIRECTEUR GENERAL L'ECHEVIN DES FINANCES\nt\n_—¢ C aN\nES Lt\nPa EN\n\\\nDANIEL BLANQUET G. LIVOLSI\n\n";

    const result = new RegexHelper.RegexHelper()
      .query({
        regex: `exercice :? (\\d+)`,
        name: 'exerciceAmount',
        capturingGroup: [{ name: 'exercice', index: 1 }],
        fuzzy: { expression: 'exercice', delimitator: ':' },
      })
      .findIn(text)
      .get('data');

    assert.equal(result.exercice, 2023);
  });

  it('should find the exercice with misspelled word and delimitator but with a space inbetween', () => {
    const text =
      'article. ) Page 1\nINS 53082 Commune de COLFONTAINE Exxercice :2023\ni Province du HAINAUT\nMandai 23000068 Réunion Directeurs généraux hennuyers Date du Collége Communal 01/02/2023';

    const result = new RegexHelper.RegexHelper()
      .query({
        regex: `exercice :? (\\d+)`,
        name: 'exerciceAmount',
        capturingGroup: [{ name: 'exercice', index: 1 }],
        fuzzy: { expression: 'exercice', delimitator: ':' },
      })
      .query({
        regex: `mandat :? (\\d+)`,
        name: 'mandateAmount',
        capturingGroup: [{ name: 'amount', index: 1 }],
        fuzzy: { expression: 'mandat' },
      })
      .findIn(text)
      .get('data');

    assert.equal(result.exercice, 2023);
    assert.equal(result.amount, 23000068);
  });

  it('should find 3 fuzzy search modifications', () => {
    const text =
      "article. ) Page 1\nINS 53082 Commune de COLFONTAINE Exxercice:2023\ni Province du HAINAUT\nMandai 23000068 Réunion Directeurs généraux hennuyers Date du Collége Communal 01/02/2023\nMANDAT DE PAIEMENT\nLE COLLEGE COMMUNAL CHARGE LE DIRECTEUR FINANCIER DE PAYER LES DEPENSES CI-DESSOUS:\nArticle - Ordinaire 1 105/12316.2023\nFRAIS DE RECEPTION ET DE REPRESENTATION\nConcerne : Réunion Directeurs généraux hennuyers\nPayable a: 000004107 Bénéficiaire: Imputation : 23000115\nRIZOM RESTAURANT Engagement : 23000192\nrue Sainte-Louise 82 Echéance : 14/03/2023\n7301 Hornu\nIBAN: Communic. : Réunion Directeurs généraux he Journal caisse N°:\nCréd. actuel: 2.000.00 Créd. disponible: -6.908,62 Dispo. Groupe: 0,00 Extrait c.c.: NZ:\nMontant de l'imputation : 620,50 | Du: / /\nTotal 8 620,50 | Pour acquit: artiicle:2024 . Commentaires: Fait a: Le i |\nTotal du mandat: 620,50\nLE COLLEGE COMMUNAL charge LE DIRECTEUR FINANCIER de la Commune de payer les montants indiqués ci-dessus\nsoit lasomme de: Six Cent Vingt Euros Cinquante Cents\nORDONNANCE A COLFONTAINE LE 01/02/2023\nLE DIRECTEUR GENERAL L'ECHEVIN DES FINANCES\nt\n_—¢ C aN\nES Lt\nPa EN\n\\\nDANIEL BLANQUET G. LIVOLSI\n\n";

    const fuzzy = new RegexHelper.RegexHelper()
      .query({
        regex: `exercice :? (\\d+)`,
        name: 'exerciceAmount',
        capturingGroup: [{ name: 'exercice', index: 1 }],
        fuzzy: { expression: 'exercice', delimitator: ':' },
      })
      .query({
        regex: `mandat :? (\\d+)`,
        name: 'mandateAmount',
        capturingGroup: [{ name: 'amount', index: 1 }],
        fuzzy: { expression: 'mandat' },
      })
      .query({
        regex: `article :? (\\d+)`,
        name: 'articleAmount',
        capturingGroup: [{ name: 'article', index: 1 }],
        fuzzy: { expression: 'article', delimitator: ':' },
      })
      .findIn(text)
      .get('fuzzy');

    assert.equal(fuzzy.count, 3);
  });

  it('should find artiicle', () => {
    const text = "'The artiicle: 471 has been paid on 12/12/2022.'";

    const result = new RegexHelper.RegexHelper()
      .query({
        regex: `article :? (\\d+)`,
        name: 'articleAmount',
        capturingGroup: [{ name: 'article', index: 1 }],
        fuzzy: { expression: 'article' },
      })
      .findIn(text)
      .get('data');

    assert.equal(result.article, 471);
  });

  it('should find a match with missing words', () => {
    const text =
      "article. ) Page 1\nINS 53082 Commune de COLFONTAINE Exerci:2023\ni Province du HAINAUT\nMandai 23000068 Réunion Directeurs généraux hennuyers Date du Collége Communal 01/02/2023\nMANDAT DE PAIEMENT\nLE COLLEGE COMMUNAL CHARGE LE DIRECTEUR FINANCIER DE PAYER LES DEPENSES CI-DESSOUS:\nArticle - Ordinaire 1 105/12316.2023\nFRAIS DE RECEPTION ET DE REPRESENTATION\nConcerne : Réunion Directeurs généraux hennuyers\nPayable a: 000004107 Bénéficiaire: Imputation : 23000115\nRIZOM RESTAURANT Engagement : 23000192\nrue Sainte-Louise 82 Echéance : 14/03/2023\n7301 Hornu\nIBAN: Communic. : Réunion Directeurs généraux he Journal caisse N°:\nCréd. actuel: 2.000.00 Créd. disponible: -6.908,62 Dispo. Groupe: 0,00 Extrait c.c.: NZ:\nMontant de l'imputation : 620,50 | Du: / /\nTotal 8 620,50 | Pour acquit: artiicle:2024 . Commentaires: Fait a: Le i |\nTotal du mandat: 620,50\nLE COLLEGE COMMUNAL charge LE DIRECTEUR FINANCIER de la Commune de payer les montants indiqués ci-dessus\nsoit lasomme de: Six Cent Vingt Euros Cinquante Cents\nORDONNANCE A COLFONTAINE LE 01/02/2023\nLE DIRECTEUR GENERAL L'ECHEVIN DES FINANCES\nt\n_—¢ C aN\nES Lt\nPa EN\n\\\nDANIEL BLANQUET G. LIVOLSI\n\n";

    const result = new RegexHelper.RegexHelper()
      .query({
        regex: `exercice :? (\\d+)`,
        name: 'exerciceAmount',
        capturingGroup: [{ name: 'exercice', index: 1 }],
        fuzzy: { expression: 'exercice', delimitator: ':' },
      })
      .findIn(text)
      .get('data');

    assert.equal(result.exercice, 2023);
  });
});
