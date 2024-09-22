const assert = require('chai').assert;
const RegexHelper = require('../dist/regex-helper');

it('should throw an error with global flag (g) and capturingGroup', () => {
  assert.throws(() => {
    new RegexHelper.RegexHelper()
      .query(
        {
          regex: `(?:service|product) :? (\\d+)`,
          name: 'serviceOrProduct',
          capturingGroup: [{ regex: '', index: 1, name: 'cannot work' }],
        },
        { flags: 'g' }
      )
      .findIn('The service: 12345 has been processed for the amount of 1,250.75 on 10/12/2023.')
      .get('data');
  }, Error);
});

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

it('should throw an error if multiple values found in subQuery and global flag "g"', () => {
  assert.throws(() => {
    new RegexHelper.RegexHelper()
      .query(
        {
          regex: `the`,
          name: 'serviceOrProduct',
        },
        { flags: 'gi' }
      )
      .subQuery({ regex: '^.', name: 'firstLetter' })
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
      .subQuery({ regex: '^.', name: 'firstLetter' })
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
      .subQuery({ regex: '^.', name: 'firstLetter' })
      .findIn('')
      .get('data');
  }, Error);
});
