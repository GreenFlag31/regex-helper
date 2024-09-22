# Common pitfalls

Pitfalls arise with the use of methods of antagonistic effects, ie. with the use of the global flag option (g) and the combinaison of another search method or the test option combined with a capture group. Errors will be explicitly logged in console.

## Problem

```typescript
const text = `The article: 471 has been paid on 12/12/2022. This message has been sent to email@email.com and test@test.com...`;

const regex = new RegexHelper()
  .query(
    {
      regex: `(?:service|article) :? (${anyDigits})`,
      name: 'articleOrService',
      // It is not possible to use a capture group with global flag option enabled, due to native Regex limitations (with the global flag provided, Javascript would not be able to understand which group to capture since they can be multiple).
      capturingGroup: [{ name: 'articleNumber', index: 1, valueIfNotFound: 'this cannot work' }],
    },
    // global flag option is enabled
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
  .subQuery({ regex: '^.', name: 'firstLetter', valueIfNotFound: 'this cannot work' })
  .query({
    regex: `has been (paid)`,
    name: 'isPaid',
    test: true,
    // It is not possible to use a capture group with test option enabled, since it will return a boolean string.
    capturingGroup: [{ name: 'paid', index: 1, valueIfNotFound: 'this cannot work' }],
  })
  .findIn(text)
  .get('data');
```

## Recommandation

If you need to perform another search, remove the global flag option and/or change your regex. If you wish to test for presence of a substring, remove the capture group or your test option.

```typescript
const regex = new RegexHelper()
  .query({
    regex: `(?:service|article) :? (${anyDigits})`,
    name: 'articleOrService',
    // Global flag has been removed
    // it will now correctly capture the digits group  (articleNumber: 471)
    capturingGroup: [{ name: 'articleNumber', index: 1, valueIfNotFound: 'this works' }],
  })
  .query({
    regex: `has been paid`,
    name: 'isPaid',
    test: true,
    valueIfNotFound: 'this works',
    // Remove the capture group or your test option
  })
  .findIn('The article: 471 has been paid on 12/12/2022')
  .get('data');
```

As a general tip: the more precise your regex will be, the better you will be able to find a result.
