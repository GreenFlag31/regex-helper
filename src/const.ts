export const anyDigit = '\\d';
export const anyDigits = '\\d+';
export const anyWord = '\\w';
export const anyWords = '\\w+';
export const anyNonDigit = '\\D';
export const anyNonWord = '\\W';
export const wordBoundary = '\\b';
export const nonWordBoundary = '\\B';
export const spacings = '\\s+';
export const optionalSpacings = '\\s*';
/**
 * This library comes with a serie of pre defined regex. Check if they are fitting your needs.
 */
export const EUFullDate = '[0-9]{2}/[0-9]{2}/[0-9]{4}';
export const USFullDate = '[0-9]\\{4\\}-[0-9]\\{2\\}-[0-9]\\{2\\}';
export const EUFullDateWithDashes = '[0-9]{2}-[0-9]{2}-[0-9]{4}';
export const year = '[0-9]{4}';
export const amount = `(?:${anyDigits}.${anyDigits})?${anyDigits}(?:.${anyDigits})?(?:,|\\.)${anyDigits}`;
export const emailAdress = '[\\w\\-]+(\\.[\\w\\-]+)*@(?:[A-Za-z0-9-]+\\.)+[A-Za-z]{2,4}';
export const IPAdress =
  '((?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))*';
// a tester sans groupe capture
export const creditCard =
  '(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6011[0-9]{12}|622((12[6-9]|1[3-9][0-9])|([2-8][0-9][0-9])|(9(([0-1][0-9])|(2[0-5]))))[0-9]{10}|64[4-9][0-9]{13}|65[0-9]{14}|3(?:0[0-5]|[68][0-9])[0-9]{11}|3[47][0-9]{13})*';
export const URLSchema =
  'https?://(?:www.)?[-a-zA-Z0-9@:%._+~#=]{1,256}.[a-zA-Z0-9(?:)]{1,6}\\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*)';
export const phoneNumber = '\\+?[1-9]\\d{1,14}';
export const fileExtension =
  '.+\\.(?:jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|mp3|mp4|avi|mkv|zip|rar|7z|tar|gz)';
