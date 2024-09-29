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

    assert.equal(result.originalText, text);
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

    assert.equal(result.modification, 0);
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
});
