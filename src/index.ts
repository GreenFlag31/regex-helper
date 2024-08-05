import express from 'express';
import { log } from 'console';
import {
  amount,
  anyDigit,
  anyDigits,
  emailAdress,
  EUFullDate,
  EUFullDateWithDashes,
  URLSchema,
} from './const';
import { RegexHelper } from './regex-helper';

export type {
  Options,
  RegexInit,
  CapturingGroup,
  CapturingGroupWithResult,
  QueryRegexData,
  QueryRegexDataWithSubQuery,
  General,
} from './types';
export {
  EUFullDate,
  EUFullDateWithDashes,
  IPAdress,
  URLSchema,
  USFullDate,
  amount,
  anyDigit,
  anyDigits,
  anyNonDigit,
  anyNonWord,
  anyWord,
  anyWords,
  creditCard,
  emailAdress,
  fileExtension,
  nonWordBoundary,
  optionalSpacings,
  phoneNumber,
  spacings,
  wordBoundary,
  year,
} from './const';
export { RegexHelper } from './regex-helper';

const app = express();

const text = `The article: 471 has been paid on 12/12/2022. This message has been sent to email@email.com and test@test.com. Payment was made via credit card number 1234 5678 9012 3456. The total amount was $123.45. You can view your order history at https://example.com/orders. Service type: ordinary, number: 12345, phone: +49 123 45 65 78.`;

app.get('/pdf-to-png', (req, res) => {
  const regex = new RegexHelper({
    // pre build regex (dd/mm/yyyy)
    regex: `${EUFullDate}`,
    // the name of your regex
    name: 'fullDate',
    // text to display if no value found
    valueIfNotFound: 'Date not found',
  })
    .query({
      regex: `(?:service|article) :? (${anyDigits})`,
      name: 'articleOrService',
      // this will capture a value of the first group (index: 1)
      capturingGroup: [{ name: 'articleNumber', index: 1 }],
    })
    .query({
      regex: `has been paid`,
      name: 'isPaid',
      // search only for presence (returns a boolean string, "true" | "false")
      test: true,
    })
    .findIn('The article: 471 has been paid on 12/12/2022.')
    .get('data');
  // const regex = new RegexHelper({
  //   regex: `${EUFullDate}`,
  //   name: 'fullDate',
  //   updateNextSubQuery: false,
  // })
  //   .subQuery({
  //     regex: `invoice number :? ${anyDigits}`,
  //     name: 'invoice',
  //   })
  //   .subQuery({
  //     regex: `${anyDigits}$`,
  //     name: 'invoiceNumber',
  //   })
  //   .findIn('invoice number: 430 for client 0bc456 on : 12/12/2003')
  //   .get('data');
  log(regex);
  res.send(regex);
});

app.listen(3006, () => {
  console.log('listening on *:3006');
});
