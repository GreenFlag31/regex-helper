# Fuzzy search

Fuzzy search is a technique used in information retrieval where the search algorithm tries to find matches that are close to, but not necessarily exactly the same as, the search query. It allows for approximate string matching by accounting for possible misspellings, typographical errors, or minor differences in wording. Fuzzy search is useful when the exact terms or phrases are not known or when searching in datasets with inconsistent data quality. An external dependancy is used to perform fuzzy search.

## Simple example

```javascript
// Word 'article' is misspelled
const text = `The aricle 471 has been paid on 12/12/2022. This message has been sent to email@email.com and test@test.com...`;

const regex = new RegexHelper()
  .query({
    regex: `article (${anyDigits})`,
    name: 'articleType',
    capturingGroup: [{ name: 'articleNumber', index: 1 }],
    // Fuzzy search only applies on words, not regex
    fuzzy: { expression: 'article', threshold: 0.6 },
  })
  .findIn(text)
  .get('data');
```

This will correctly find the word `aricle` in the text and the number of the article will be correctly captured.

## Short explanation on how it works

A fuzzy search is performed on the provided text, searching for the expression with a specified threshold (defaulting to 0.65). If a match is found, the expression is replaced in the text, then the regex will be performed.

The threshold is the minimum score it should obtain to accept the correction. The higher the threshold, the less deviation from the original text is allowed. Lowering the threshold increases flexibility but also the likelihood of false positives. A threshold of 1 indicates a perfect match, 0 a perfect mismatch.

## Example with optional delimitator

```javascript
const result = new RegexHelper()
  .query({
    regex: `exercice :? (\\d+)`,
    name: 'exerciceYear',
    capturingGroup: [{ name: 'year', index: 1 }],
    fuzzy: { expression: 'exercice', delimitator: ':' },
  })
  .findIn('Total of the article : 87€. Exerciice:2024')
  .get('data');
```

A fuzzy search is performed on the word `exerciice` and replace the expression in the original text. Because there is no space between the expression searched and the year, it would replace the whole word `Exerciice:2024` if no delimitator is provided, failing to correctly find the year.
