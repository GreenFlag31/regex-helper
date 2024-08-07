# Regex-helper

A lightweight JavaScript library that helps structure regex quickly and easily. This library does not replace learning regex but assists in their usage by removing the concrete implementation of regex and focus on results instead.

## Getting started

### Package installation

Installation:

```sh
npm install regex-helper
```

## Documentation

Find the complete documentation [here](https://greenflag31.github.io/regex-helper/).

## Example

```javascript
const regex = new RegexHelper({
  // pre build regex (dd/mm/yyyy)
  regex: `${EUFullDate}`,
  // the name of your regex
  name: 'fullDate',
  // text to display if no value has been found
  valueIfNotFound: 'Date not found',
})
  .query({
    regex: `(?:service|article) :? (${anyDigits})`,
    name: 'articleOrService',
    // this will capture the value of the first group (index: 1)
    capturingGroup: [{ name: 'articleNumber', index: 1 }],
  })
  .query({
    regex: `has been paid`,
    name: 'isPaid',
    // test only for presence (returns a boolean string, "true" | "false")
    test: true,
  })
  // the text where to perform searching
  .findIn('The article: 471 has been paid on 12/12/2022.')
  // can be: 'data' | 'debug' | 'general'
  .get('data');
```

## Results

The regex displays following results:

```javascript
{
  fullDate: '12/12/2022',
  articleOrService: 'article: 471',
  articleNumber: '471',
  isPaid: 'true'
}
```

## Developer experience

This library comes with a serie of pre build regex. Special attention has been given on developer experience. Properties and methods are exhaustively documented and typed. Use your IDE's autocompletion or hover on properties and methods for help. Errors (see 'pitfalls' [here](https://greenflag31.github.io/regex-helper/docs/documents/pitfalls.html)) will be logged in console with explicit messages.

## File a bug, got a new idea, or want to contribute?

Feel free! [Open a ticket](https://github.com/GreenFlag31/regex-helper/issues).

## Changelog

## Discover others libraries

All libraries are permanently supported. Discover them [here](https://www.npmjs.com/~greenflag31).
