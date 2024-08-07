import express from 'express';
import { log } from 'console';
import {
  amount,
  anyDigit,
  anyDigits,
  anyWords,
  emailAdress,
  EUFullDate,
  EUFullDateWithDashes,
  phoneNumber,
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

const text = `The article: 471 has been paid on 12/12/2022. This message has been sent to email@email.com and test@test.com. Payment was made via credit card number 1234 5678 9012 3456. The total amount was $123.45. You can view your order history at https://example.com/orders. Service type: ordinary, number: 12345, phone: +49123456578.`;

app.get('/pdf-to-png', (req, res) => {
  const regex = new RegexHelper({
    regex: `${EUFullDate}`,
    name: 'EUFullDate',
  })
    .query({
      regex: `Service type: ${anyWords}, number: ${anyDigits}, phone: ${phoneNumber}.`,
      name: 'articleOrService',
    })
    .findIn(text)
    .get('general');

  res.send(regex);
});

app.listen(3006, () => {
  console.log('listening on *:3006');
});
