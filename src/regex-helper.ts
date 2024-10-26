import { optionalSpacings, spacings } from './const';
import {
  RegexInit,
  Options,
  QueryRegexData,
  CapturingGroup,
  CapturingGroupWithResult,
  General,
  Spacing,
  Fuzzy,
  FuzzyStat,
} from './types';
import { search } from 'fast-fuzzy';

const DEFAULT_VALUE = 'not found';

const defaultOptionsInCommun = {
  countAsSuccess: true,
  possibleValues: [],
};

const defaultRegexInit: RegexInit = {
  regex: '',
  name: '',
  test: false,
  capturingGroup: [],
  valueIfNotFound: DEFAULT_VALUE,
  ...defaultOptionsInCommun,
  fuzzy: { expression: '', delimitator: ' ', threshold: 0.75 },
};

const defaultOptions: Options = { spacing: { optional: true }, flags: 'i' };

/**
 * Allow you to build regex easily by providing your options.
 * @example
 * ```javascript
 * const regex = new RegexHelper()
 *   .query({
 *      regex: `service|article :? (${anyDigits})`,
 *      name: 'articleOrService',
 *      capturingGroup: [{ name: 'articleNumber', index: 1 }],
 *   })
 *   .findIn('The article: 471 has been paid on 12/12/2022')
 *   .get('data');
 *  ```
 *
 * Get help on: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions
 *
 * Get help on: https://regex101.com/
 *
 */
export class RegexHelper {
  private regexResults: QueryRegexData[] = [];
  private currentRegexIndex = 0;
  private success: General['success']['name'] = [];
  private fuzzyStat: FuzzyStat = { modifications: [], count: 0, records: [] };

  constructor() {}

  private init(regexInit: RegexInit, options: Options) {
    const { regex } = regexInit;
    if (!regex) throw new Error('<RegexHelper>: Falsy regex.');

    options = this.setDefaultOptionsValues(options);
    regexInit = this.setDefaultRegexValues(regexInit, options.spacing!);

    this.pushResultValue(regexInit, options);
    return true;
  }

  private setDefaultRegexValues(regexAndName: RegexInit, spacing: Spacing) {
    return Object.freeze({
      ...defaultRegexInit,
      ...regexAndName,
      regex: this.addSpacing(regexAndName.regex, spacing),
    });
  }

  private setDefaultOptionsValues(options: Options): Options {
    return Object.freeze({
      ...defaultOptions,
      ...options,
    });
  }

  private pushResultValue(regexAndName: RegexInit, options: Options) {
    const {
      name,
      regex,
      test,
      capturingGroup,
      valueIfNotFound,
      fuzzy,
      countAsSuccess,
      possibleValues,
    } = regexAndName;

    this.regexResults.push({
      result: '',
      regex,
      flags: options.flags ?? 'i',
      name,
      test,
      reference: '',
      capturingGroup: this.initGroupCapture(capturingGroup),
      valueIfNotFound,
      fuzzy,
      countAsSuccess,
      possibleValues,
    });
  }

  private updateResultValue(value: string | RegExpMatchArray | null | undefined) {
    const currentRegex = this.getCurrentRegexResult();
    value = this.setDefaultValueIfNotFound(
      value,
      currentRegex.valueIfNotFound,
      currentRegex.name,
      currentRegex
    );

    currentRegex.result = value;
  }

  private addSpacing(sentence: string, optionSpacing: Spacing) {
    const { optional, custom } = optionSpacing;
    const spacing = optional ? optionalSpacings : spacings;
    const customOrSpacing = custom || spacing;
    const spaceSplittedSentence = sentence.split(' ');
    sentence = spaceSplittedSentence.join(customOrSpacing);

    return sentence;
  }

  /**
   * Allow you to build a new search based on the provided data.
   */
  query(regexAndName: RegexInit, options = defaultOptions) {
    this.init(regexAndName, options);

    this.currentRegexIndex += 1;
    return this;
  }

  /**
   * Find results on basis of the provided text. Throws an error if the text is falsy or the regex is invalid.
   */
  findIn(text: string) {
    if (!text) {
      throw new Error('<RegexHelper>: Searching skipped, the text provided is empty or undefined.');
    }

    this.success = [];
    this.toRegex(text);
    this.trimTextHandlerAndTransformRegexToString();
    return this;
  }

  /**
   * Get the results of your queries.
   */
  get(info: 'data'): { [key: string]: string | RegExpMatchArray };
  get(info: 'general'): General;
  get(info: 'debug'): QueryRegexData[];
  get(info: 'fuzzy'): FuzzyStat;
  get(info: 'debug' | 'data' | 'general' | 'fuzzy') {
    if (info === 'data') return this.returnOnlyData();
    if (info === 'general') return this.getGeneralInfos();
    if (info === 'fuzzy') return this.fuzzyStat;

    return this.regexResults;
  }

  private getGeneralInfos() {
    const success = this.success.length;
    const failsName = this.failingRegex();
    const failsTotal = failsName.length;
    const total = success + failsTotal;
    const stat = Math.trunc((success / total) * 100) || 0;

    const general: General = {
      success_in_pc: stat,
      success: {
        count: success,
        name: this.success,
      },
      fails: {
        count: failsName.length,
        name: failsName,
      },
      total: {
        count: total,
        name: this.success.concat(failsName),
      },
    };

    return general;
  }

  private getFails(name: string, countAsSuccess: boolean | undefined) {
    return !this.success.includes(name) && Boolean(countAsSuccess) ? name : undefined;
  }

  private failingRegex() {
    const fails: (string | undefined)[] = [];

    for (const result of this.regexResults) {
      const { capturingGroup = [], name, countAsSuccess } = result;
      fails.push(this.getFails(name, countAsSuccess));

      for (const group of capturingGroup) {
        const { name, countAsSuccess } = group;
        fails.push(this.getFails(name, countAsSuccess));
      }
    }

    return fails.filter((fail) => fail !== undefined);
  }

  private returnOnlyData() {
    const data: { [key: string]: string | RegExpMatchArray } = {};

    for (const result of this.regexResults) {
      const { name, capturingGroup } = result;
      data[name] = result.result;

      this.displayCapturingGroupResults(data, capturingGroup);
    }

    return data;
  }

  private displayCapturingGroupResults(
    data: { [key: string]: string | RegExpMatchArray },
    capturingGroup: CapturingGroupWithResult[] | undefined = []
  ) {
    for (const group of capturingGroup) {
      const { name } = group;
      data[name] = group.result;
    }
  }

  private trimTextHandlerAndTransformRegexToString() {
    for (const regexResult of this.regexResults) {
      this.trimTextResponse(regexResult);
      regexResult.regex = (regexResult.regex as RegExp).source;
    }
  }

  private trimTextResponse(regexResult: QueryRegexData) {
    const {
      reference: { length },
    } = regexResult;
    const limit = 100;

    if (length > limit) {
      regexResult.reference = `${regexResult.reference.slice(0, limit)}... (text has been trimmed)`;
    }
  }

  private toRegex(text: string) {
    this.currentRegexIndex = 0;

    try {
      for (const regexResult of this.regexResults) {
        const { flags, regex } = regexResult;
        const mainRegex = new RegExp(regex, flags);
        regexResult.regex = mainRegex;
        this.matchOrTestRegex(regexResult, text);

        this.currentRegexIndex += 1;
      }
    } catch (error) {
      const { name } = this.regexResults[this.currentRegexIndex];
      throw new Error(`<RegexHelper>: Failed to build Regex at: ${name}. ${error}`);
    }
  }

  private matchOrTestRegex(regexResult: QueryRegexData, reference: string) {
    const { flags, test, fuzzy, name } = regexResult;
    const regex = regexResult.regex as RegExp;
    reference = this.fuzzySearch(fuzzy, reference, name);

    let result = reference.match(regex);

    if (test) {
      const isPresent = regex.test(reference);
      result = !isPresent ? null : [isPresent.toString()];
    }

    const resultValue = flags.includes('g') ? result : result?.[0];
    this.updateReference(reference);
    this.updateResultValue(resultValue);
    this.updateCapturingGroup(regexResult, result);
  }

  private fuzzySearch(fuzzySearch: Fuzzy | undefined, reference: string, name: string) {
    if (!fuzzySearch?.expression) return reference;

    const { expression, threshold = 0.75, delimitator = ' ' } = fuzzySearch;

    reference = reference.replace(/\n/g, ' ');
    const chunks = reference.match(/.{1,60}(?:\s|$)/g) || [reference];
    const fuzziedSearch = search(expression, chunks, {
      returnMatchData: true,
    });

    let replacedInText = reference;

    for (const fuzzy of fuzziedSearch) {
      const { match, score, original } = fuzzy;
      const { length, index } = match;

      if (score !== 1) {
        this.fuzzyStat.records.push({
          name,
          score,
          threshold,
        });
      }

      if (score < threshold) continue;

      const originalPosition = replacedInText.indexOf(original);

      // possiblement non trouvé à cause d'effet de bord?
      if (originalPosition === -1) continue;

      const startIndex = originalPosition + index;
      const endIndex = startIndex + length;

      let nextDelimitation = replacedInText.indexOf(delimitator, endIndex);
      if (delimitator !== ' ') {
        // a given delimitator should start at startIndex
        nextDelimitation = replacedInText.indexOf(delimitator, startIndex);
      }

      const previousSpace = replacedInText.lastIndexOf(' ', startIndex);
      const nextSpace = replacedInText.indexOf(' ', endIndex);
      let limit = nextDelimitation;

      // if a space comes before the delimitation, take it
      if (nextSpace !== -1 && (nextSpace < nextDelimitation || nextDelimitation === -1)) {
        limit = nextSpace;
      }

      if (limit === -1 || startIndex === -1) continue;

      let wordFound = replacedInText.substring(previousSpace, limit).trim();

      const ponctuation = new RegExp(/[.,:;!?]/);
      const lastChar = wordFound.at(-1) || '';
      if (delimitator === ' ' && ponctuation.test(lastChar)) {
        // do not remove ponctuation
        wordFound = wordFound.substring(0, wordFound.length - 1);
      }

      if (wordFound.toLowerCase() === expression) continue;

      // rejecting a word of 3 char. bigger (arbitrary limit)
      if (wordFound.length > expression.length + 2) continue;

      replacedInText = replacedInText.replace(wordFound, expression);

      this.fuzzyStat.count += 1;
      this.fuzzyStat.modifications.push({
        original: wordFound,
        replaced: expression,
      });
    }

    return replacedInText;
  }

  private setDefaultValueIfNotFound(
    currentValue: string | string[] | RegExpMatchArray | undefined | null,
    customDefaultValue = DEFAULT_VALUE,
    currentRegexName: string,
    currentRegex: QueryRegexData | CapturingGroupWithResult
  ) {
    const { countAsSuccess, possibleValues, validation } = currentRegex;
    const currentValueToArray = Array.isArray(currentValue) ? currentValue : [currentValue];
    const predefinedValues = possibleValues || [];

    if (!currentValueToArray[0]) return customDefaultValue;

    if (typeof validation === 'function') {
      const validated = validation(currentValue);

      if (!validated) return customDefaultValue;
    }

    if (predefinedValues.length > 0) {
      const notIncluded = currentValueToArray.every((value) => !predefinedValues.includes(value!));

      if (notIncluded) return customDefaultValue;
    }

    if (!countAsSuccess) return currentValue as string | RegExpMatchArray;

    this.success.push(currentRegexName);
    return currentValue as string | RegExpMatchArray;
  }

  private updateCapturingGroup(regexResult: QueryRegexData, results: RegExpMatchArray | null) {
    const capturingGroup = regexResult.capturingGroup || [];
    const { name, test } = regexResult;
    if (test && capturingGroup.length) {
      const text = `Cannot update capture group with the testing option enabled at Regex: ${name}. Remove the testing option to use capture group.`;

      throw new Error(`<RegexHelper>: ${text}`);
    }

    for (const group of capturingGroup) {
      const { index, name } = group;
      const currentValue = this.capturingGroupWithGlobalFlag(results, regexResult, index);
      const value = this.setDefaultValueIfNotFound(
        currentValue,
        group.valueIfNotFound,
        name,
        group
      );

      group.result = value;
    }
  }

  private capturingGroupWithGlobalFlag(
    results: RegExpMatchArray | null,
    regexResult: QueryRegexData,
    index: number
  ) {
    const { flags, regex } = regexResult;

    if (!flags.includes('g') || !results) return results?.[index];

    const matchingResults: string[] = [];
    for (const result of results) {
      const { source } = regex as RegExp;
      const flagWithoutGlobal = flags.replace('g', '');
      const regexWithoutFlags = new RegExp(source, flagWithoutGlobal);
      const match = result.match(regexWithoutFlags);

      matchingResults.push((match || '')[index]);
    }

    return matchingResults;
  }

  private getCurrentRegexResult() {
    return this.regexResults[this.currentRegexIndex];
  }

  private updateReference(reference: string) {
    const currentRegex = this.getCurrentRegexResult();
    currentRegex.reference = reference;
  }

  private initGroupCapture(capturingGroup: CapturingGroup[] = []) {
    const capturingWithResult: CapturingGroupWithResult[] = [];

    for (const group of capturingGroup) {
      capturingWithResult.push({ ...defaultOptionsInCommun, ...group, result: '' });
    }

    return capturingWithResult;
  }
}
