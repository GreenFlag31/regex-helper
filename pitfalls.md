# Common pitfalls

Pitfalls arise with the use of the global flag option (g) and the combinaison of another search method.

## Problem

```typescript
const text = `The article: 471 has been paid on 12/12/2022. This message has been sent to email@email.com and test@test.com...`;

const regex = new RegexHelper({
  regex: `${EUFullDate}`,
  name: 'fullDate',
  valueIfNotFound: 'Date not found',
})
  .query(
    {
      regex: `(?:service|article) :? (${anyDigits})`,
      name: 'articleOrService',
      // It is not possible to use a capture group with global flag option enabled, due to native Regex limitations (with the global flag provided, Javascript would not be able to understand which group to capture since they can be multiple).
      capturingGroup: [{ name: 'articleNumber', index: 1, valueIfNotFound: 'This cannot work' }],
    },
    { flags: 'gi' }
  )
  .query(
    {
      regex: `${emailAdress}`,
      name: 'email',
    },
    { flags: 'gi' }
  )
  // It is not possible to use a subQuery with a global flag option, since multiple values are found. However, it still works if a single value is found (not recommanded).
  .subQuery({ regex: '^.', name: 'firstLetter', valueIfNotFound: 'This cannot work' })
  .findIn(text)
  .get('data');
```

## Recommandation

If you need to perform another search, remove the global flag option and/or change your regex.

```typescript
const regex = new RegexHelper({
  regex: `${EUFullDate}`,
  name: 'fullDate',
  valueIfNotFound: 'Date not found',
})
  .query({
    regex: `(?:service|article) :? (${anyDigits})`,
    name: 'articleOrService',
    // Global flag has been removed
    // it will now correctly capture the digits group  (result: 471)
    capturingGroup: [{ name: 'articleNumber', index: 1, valueIfNotFound: 'This works' }],
  })
  .findIn('The article: 471 has been paid on 12/12/2022')
  .get('data');
```

The more precise your regex will be, the better you will be able to find a result.
