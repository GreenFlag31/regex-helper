# Regex-helper-ease

A lightweight JavaScript library that helps structure regex quickly and easily. This library does not replace learning regex but assists in their usage by removing the concrete implementation of regex and focus on results instead.

This library supports fuzzy search, ie. it still identify misspelled words, correct them, and run the provided regex.

## Getting started

### Package installation

Installation:

```sh
npm install regex-helper-ease
```

## Documentation

Find the complete documentation [here](https://greenflag31.github.io/regex-helper/).

## Example

```javascript
const results = new RegexHelper()
  .query({
    // pre build regex (dd/mm/yyyy)
    regex: `${EUFullDate}`,
    // the name of your regex
    name: 'fullDate',
    // text to display if no value has been found
    valueIfNotFound: 'Date not found',
  })
  .query({
    regex: `has been paid`,
    name: 'isPaid',
    // test only for presence
    test: true,
  })
  .query({
    regex: `year :? (\\d+)`,
    name: 'yearSentence',
    // will not count as success
    countAsSuccess: false,
    // provide a validation function*
    capturingGroup: [{ name: 'year', index: 1, validation: validators.year }],
  })
  .query({
    regex: `article :? (${anyDigits})`,
    name: 'articleSentence',
    // this will capture the value of the first group (index: 1)
    capturingGroup: [{ name: 'article', index: 1 }],
    // it searchs for the given expression 'article', allowing deviation
    fuzzy: { expression: 'article' },
  })
  // the text where to perform searching (misspelled word 'artiicle').
  .findIn('The artiicle: 471 has been paid on 12/12/2021. Accounting of year: 2022 has been done.')
  // 'debug' | 'data' | 'general' | 'fuzzy'
  .get('data');
```

## Results

The regex displays following results:

```javascript
{
  fullDate: '12/12/2021',
  isPaid: 'true',
  yearSentence: 'year: 2022',
  year: '2022',
  articleSentence: 'article: 471',
  article: '471'
}
```

\*Validation could be defined as:

```javascript
// Simple validation, but it can be more complex with Zod, Joi, etc.
const validators = {
  year: (value: string) => +value > 2020,
};
```

## Developer experience

This library comes with a serie of pre build regex. Special attention has been given on developer experience. Properties and methods are exhaustively documented and typed. Use your IDE's autocompletion or hover on properties and methods for help. Errors will be thrown with explicit messages.

## File a bug, got a new idea, or want to contribute?

Feel free! [Open a ticket](https://github.com/GreenFlag31/regex-helper/issues).

## Changelog

V0.0.2: [MINOR] Improved typescript return type of the results.

V0.0.3: [MINOR] Escaping empty regex at initialisation and adding a general success rate in percentage in the General interface. Bug corrections and adding tests.

V0.0.4: [MINOR] Adding fuzzy search possibility and tests.

V0.0.5: [MINOR] Improving fuzzy search and adding tests.

V0.0.6: [MINOR] Removing subQuery searchs (capturing groups is an alternative and offers a cleaner API), increase of the fuzzy threshold to decrease false positive (set to 0.75), improving fuzzy search, support for global search with capturing groups (flag `g`), addition of options (`possibleValues`, `countAsSuccess`, `validation`) and adding tests.

## Discover others libraries

All libraries are permanently supported. Discover them [here](https://www.npmjs.com/~greenflag31).
