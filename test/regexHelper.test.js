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
