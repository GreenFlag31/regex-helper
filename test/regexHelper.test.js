const assert = require('chai').assert;
const RegexHelper = require('../dist/regex-helper');

describe('Error management', () => {
  it('should throw an error with test and capturingGroup', () => {
    assert.throws(() => {
      new RegexHelper.RegexHelper()
        .query({
          regex: `(?:service|product) :? (\\d+)`,
          name: 'serviceOrProduct',
          capturingGroup: [{ regex: '', index: 1, name: 'cannot work' }],
          test: true,
        })
        .findIn('The service: 12345 has been processed for the amount of 1,250.75 on 10/12/2023.')
        .get('data');
    }, Error);
  });

  it('should throw an error if text provided is falsy', () => {
    assert.throws(() => {
      new RegexHelper.RegexHelper()
        .query(
          {
            regex: `the`,
            name: 'serviceOrProduct',
          },
          { flags: 'gi' }
        )
        .findIn('')
        .get('data');
    }, Error);
  });

  it('should throw an error if the regex is invalid', () => {
    assert.throws(() => {
      new RegexHelper.RegexHelper()
        .query(
          {
            regex: `th(^e`,
            name: 'serviceOrProduct',
          },
          { flags: 'gi' }
        )
        .findIn('')
        .get('data');
    }, Error);
  });
});

describe('RegexHelper', () => {
  it('should find article number correctly', () => {
    const result = new RegexHelper.RegexHelper()
      .query({
        regex: `(?:service|article) :? (\\d+)`,
        name: 'articleOrService',
        capturingGroup: [{ name: 'articleNumber', index: 1 }],
      })
      .query({
        regex: `has been paid`,
        name: 'isPaid',
        test: true,
      })
      .findIn('The article: 471 has been paid on 12/12/2022.')
      .get('data');

    assert.equal(result['articleNumber'], '471');
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

  it('success_in_pc should be equal to 0 in case of no match', () => {
    const text = 'The type: example has been realised on 12/01/2023.';

    const result = new RegexHelper.RegexHelper()
      .query({
        regex: `type :? (\\d+)`,
        name: 'typeName',
        countAsSuccess: false,
        capturingGroup: [{ name: 'type', index: 1, valueIfNotFound: '', countAsSuccess: false }],
      })
      .findIn(text)
      .get('general');

    assert.equal(result.success_in_pc, 0);
  });
});

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

  it('should find the mandat amount with misspelled mandat word', () => {
    const result = new RegexHelper.RegexHelper()
      .query({
        regex: `mandat :? (\\d+)`,
        name: 'mandateAmount',
        capturingGroup: [{ name: 'amount', index: 1 }],
        fuzzy: { expression: 'mandat', threshold: 0.6 },
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

describe('possibleValues and countAsSuccess', () => {
  it('should not find a match if not in the provided values', () => {
    const text = 'The service : example has been realised on 12/01/2023.';

    const result = new RegexHelper.RegexHelper()
      .query({
        regex: `service -? :? (\\w+)`,
        name: 'serviceName',
        capturingGroup: [
          {
            name: 'service',
            index: 1,
            possibleValues: ['ordinaire', 'extra'],
            valueIfNotFound: '',
          },
        ],
      })
      .findIn(text)
      .get('data');

    assert.equal(result.service, '');
  });

  it('should find a match if value in the provided values', () => {
    const text = 'The service : extra has been realised on 12/01/2023.';

    const result = new RegexHelper.RegexHelper()
      .query({
        regex: `service -? :? (\\w+)`,
        name: 'serviceName',
        capturingGroup: [
          {
            name: 'service',
            index: 1,
            possibleValues: ['ordinaire', 'extra'],
            valueIfNotFound: '',
          },
        ],
      })
      .findIn(text)
      .get('data');

    assert.equal(result.service, 'extra');
  });

  it('should not count the capturingGroup as success if countAsSuccess is set to false && success is true', () => {
    const text = 'The type: example has been realised on 12/01/2023.';

    const result = new RegexHelper.RegexHelper()
      .query({
        regex: `type :? (\\w+)`,
        name: 'typeName',
        capturingGroup: [{ name: 'type', index: 1, valueIfNotFound: '', countAsSuccess: false }],
      })
      .findIn(text)
      .get('general');

    assert.notInclude(result.success.name, 'type');
  });

  it('should not count as success if all countAsSuccess are set to false', () => {
    const text = 'The type: example has been realised on 12/01/2023.';

    const result = new RegexHelper.RegexHelper()
      .query({
        regex: `type :? (\\w+)`,
        name: 'typeName',
        countAsSuccess: false,
        capturingGroup: [{ name: 'type', index: 1, valueIfNotFound: '', countAsSuccess: false }],
      })
      .findIn(text)
      .get('general');

    assert.equal(result.success.count, 0);
  });
});

describe('capturing group and global flag', () => {
  it('should select values within the results found', () => {
    const text =
      'The type: example has been realised on 12/01/2023. The type: data has been realised on 12/01/2023. The type: ordinary has been realised on 12/01/2023.';

    const result = new RegexHelper.RegexHelper()
      .query(
        {
          regex: `type :? (\\w+)`,
          name: 'typeName',
          capturingGroup: [{ name: 'type', index: 1, valueIfNotFound: '' }],
        },
        { flags: 'g' }
      )
      .findIn(text)
      .get('data');

    assert.sameMembers(result.type, ['example', 'data', 'ordinary']);
  });

  it('should display no value if nothing has been found', () => {
    const text =
      'The type: example has been realised on 12/01/2023. The type: data has been realised on 12/01/2023. The type: ordinary has been realised on 12/01/2023.';

    const result = new RegexHelper.RegexHelper()
      .query(
        {
          regex: `type :? (\\d+)`,
          name: 'typeName',
          capturingGroup: [{ name: 'type', index: 1, valueIfNotFound: '' }],
        },
        { flags: 'g' }
      )
      .findIn(text)
      .get('data');

    assert.equal(result.type, '');
  });

  it('should keep the flag choice of the user, without global option', () => {
    const text =
      'The type: EXAMPLE has been realised on 12/01/2023. The type: DATA has been realised on 12/01/2023. The type: ORDINARY has been realised on 12/01/2023.';

    const result = new RegexHelper.RegexHelper()
      .query(
        {
          regex: `type :? ([a-z]+)`,
          name: 'typeName',
          capturingGroup: [{ name: 'type', index: 1, valueIfNotFound: '' }],
        },
        { flags: 'gi' }
      )
      .findIn(text)
      .get('data');

    assert.sameMembers(result.type, ['EXAMPLE', 'DATA', 'ORDINARY']);
  });
});

describe('validation', () => {
  it('should validate with the user provided function (1)', () => {
    const validators = {
      year: (value) => +value > 2020,
    };

    const result = new RegexHelper.RegexHelper()
      .query({
        regex: `year :? (\\d+)`,
        name: 'yearSentence',
        countAsSuccess: false,
        capturingGroup: [
          { name: 'year', index: 1, validation: validators.year, valueIfNotFound: '' },
        ],
      })
      .findIn(
        'The artiicle: 471 has been paid on 12/12/2021. Accounting of year: 2022 has been done.'
      )
      .get('data');

    assert.equal(result.year, '2022');
  });

  it('should validate with the user provided function (2)', () => {
    const validators = {
      year: (value) => +value > 2022,
    };

    const result = new RegexHelper.RegexHelper()
      .query({
        regex: `year :? (\\d+)`,
        name: 'yearSentence',
        countAsSuccess: false,
        capturingGroup: [
          { name: 'year', index: 1, validation: validators.year, valueIfNotFound: '' },
        ],
      })
      .findIn(
        'The artiicle: 471 has been paid on 12/12/2021. Accounting of year: 2022 has been done.'
      )
      .get('data');

    assert.equal(result.year, '');
  });

  it('should have success to 0 if failed validation', () => {
    const validators = {
      year: (value) => +value > 2022,
    };

    const result = new RegexHelper.RegexHelper()
      .query({
        regex: `year :? (\\d+)`,
        name: 'yearSentence',
        countAsSuccess: false,
        capturingGroup: [
          { name: 'year', index: 1, validation: validators.year, valueIfNotFound: '' },
        ],
      })
      .findIn(
        'The artiicle: 471 has been paid on 12/12/2021. Accounting of year: 2022 has been done.'
      )
      .get('general');

    assert.equal(result.success.count, 0);
  });

  it('should have success to 1 if successfull validation', () => {
    const validators = {
      year: (value) => +value > 2021,
    };

    const result = new RegexHelper.RegexHelper()
      .query({
        regex: `year :? (\\d+)`,
        name: 'yearSentence',
        countAsSuccess: false,
        capturingGroup: [
          { name: 'year', index: 1, validation: validators.year, valueIfNotFound: '' },
        ],
      })
      .findIn(
        'The artiicle: 471 has been paid on 12/12/2021. Accounting of year: 2022 has been done.'
      )
      .get('general');

    assert.equal(result.success.count, 1);
  });
});
