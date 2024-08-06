import { optionalSpacings, spacings } from './const';
import {
  RegexInit,
  Options,
  QueryRegexDataWithSubQuery,
  QueryRegexData,
  CapturingGroup,
  CapturingGroupWithResult,
  General,
} from './types';
const DEFAULT_VALUE = 'not found';

const defaultRegexInit: RegexInit = {
  regex: '',
  name: '',
  test: false,
  capturingGroup: [],
  updateNextSubQuery: true,
  valueIfNotFound: DEFAULT_VALUE,
};

const defaultOptions: Options = { spacing: { optional: true }, flags: 'i' };

/**
 * Allow you to build regex easily by providing your options.
 * @example
 * ```javascript
 * const regex = new RegexHelper({
 *    regex: `${EUFullDate}`,
 *    name: 'EUFullDate',
 * })
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
  private regexResults: QueryRegexDataWithSubQuery[] = [];
  private currentRegexIndex = 0;
  private success: General['success']['name'] = [];

  constructor(
    private readonly regexAndName = defaultRegexInit,
    private readonly options = defaultOptions
  ) {
    this.init(regexAndName, options);
    return this;
  }

  private init(regexAndName: RegexInit, options: Options) {
    const { regex } = regexAndName;
    const sentenceWithSpacings = this.addSpacing(regex, options.spacing);
    regexAndName.regex = sentenceWithSpacings;
    this.pushResultValue(regexAndName, options);
  }

  private pushResultValue(regexAndName: RegexInit, options: Options) {
    const { name, regex, test, capturingGroup, updateNextSubQuery, valueIfNotFound } = regexAndName;
    const { flags } = options;

    this.regexResults.push({
      result: '',
      regex,
      flags: flags ?? 'i',
      name,
      test,
      reference: '',
      capturingGroup: this.initGroupCapture(capturingGroup),
      updateNextSubQuery: updateNextSubQuery ?? true,
      valueIfNotFound,
      subQuery: [],
    });
  }

  private updateResultValue(
    value: string | RegExpMatchArray | null | undefined,
    subQuery = false,
    subQueryIteration = -1
  ) {
    const currentRegex = this.getCurrentRegexResult();
    const currentSubQuery = currentRegex.subQuery[subQueryIteration];
    value = this.setDefaultValueIfNotFound(
      value,
      subQuery ? currentSubQuery.valueIfNotFound : currentRegex.valueIfNotFound,
      subQuery ? currentSubQuery.name : currentRegex.name
    );

    if (subQuery) {
      currentSubQuery.result = value;
      return;
    }

    currentRegex.result = value;
  }

  private addSpacing(sentence: string, optionSpacing = defaultOptions.spacing!) {
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
  query(regexAndName = defaultRegexInit, options = defaultOptions) {
    this.init(regexAndName, options);
    this.currentRegexIndex += 1;
    return this;
  }

  /**
   * Find results on basis of the provided text. Throws an error if the text is falsy.
   */
  findIn(text: string) {
    if (!text) {
      throw new Error(
        `<RegexHelper>: \x1b[31mSearching skipped, the text provided is not defined.\x1b[0m`
      );
    }

    this.success = [];
    this.toRegex(text);
    this.trimTextHandlerAndTransformRegexToString();
    return this;
  }

  /**
   * Get the results of your queries.
   *
   * debug: gives a complete overview of the data. Returns QueryRegexDataWithSubQuery[].
   *
   * data: displays only the results. Returns only the results of the regex under the form of key value pairs.
   *
   * general: displays a general overview. Returns the number of successfull matches, fails, and total and their respective regex names.
   */
  get(info: 'debug' | 'data' | 'general') {
    if (info === 'data') return this.returnOnlyData();
    if (info === 'general') return this.getGeneralInfos();
    return this.regexResults;
  }

  private getGeneralInfos() {
    const data = this.returnOnlyData();
    const allRegex = Object.keys(data);
    const total = allRegex.length;
    const success = this.success.length;
    const fails: string[] = [];

    for (const regex of allRegex) {
      if (!this.success.includes(regex)) fails.push(regex);
    }

    const general: General = {
      success: {
        count: success,
        name: this.success,
      },
      fails: {
        count: fails.length,
        name: fails,
      },
      total: {
        count: total,
        name: allRegex,
      },
    };

    return general;
  }

  private returnOnlyData() {
    const data: { [key: string]: string | RegExpMatchArray } = {};

    for (const result of this.regexResults) {
      const { name, subQuery, capturingGroup } = result;
      data[name] = result.result;

      this.displayCapturingGroupResults(data, capturingGroup);

      for (const sub of subQuery) {
        const { name, capturingGroup } = sub;
        data[name] = sub.result;
        this.displayCapturingGroupResults(data, capturingGroup);
      }
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
      regexResult.regex = regexResult.regex.toString();

      for (const subQueryContainer of regexResult.subQuery) {
        this.trimTextResponse(subQueryContainer);
        subQueryContainer.regex = subQueryContainer.regex.toString();
      }
    }
  }

  private trimTextResponse(regexResult: QueryRegexDataWithSubQuery | QueryRegexData) {
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
    let subQueryIndex = 0;

    try {
      for (const regexResult of this.regexResults) {
        subQueryIndex = 0;
        const { flags, regex } = regexResult;
        const mainRegex = new RegExp(regex, flags);
        regexResult.regex = mainRegex;
        this.matchOrTestRegex(regexResult, text, mainRegex);

        for (const subQueryContainer of regexResult.subQuery) {
          const { flags, regex, reference } = subQueryContainer;
          const subRegex = new RegExp(regex, flags);
          subQueryContainer.regex = subRegex;
          this.matchOrTestRegex(subQueryContainer, reference, subRegex, subQueryIndex);
          subQueryIndex += 1;
        }

        this.currentRegexIndex += 1;
      }
    } catch (error) {
      const { name } = this.regexResults[this.currentRegexIndex];
      throw new Error(`<RegexHelper>: \x1b[31mFailed to build Regex at: ${name}. ${error}`);
    }
  }

  private matchOrTestRegex(
    regexResult: QueryRegexDataWithSubQuery | QueryRegexData,
    reference: string,
    regex: RegExp,
    subQueryIndex = -1
  ) {
    const { flags, test } = regexResult;
    let result = reference.match(regex);

    if (test) {
      const isPresent = regex.test(reference);
      result = [isPresent.toString()];
    }

    const resultValue = flags.includes('g') ? result : result?.[0];
    const isSubQuery = subQueryIndex !== -1;
    this.updateCapturingGroup(regexResult, result);
    this.updateReference(reference, resultValue || '', subQueryIndex);
    this.updateResultValue(resultValue, isSubQuery, subQueryIndex);
  }

  private setDefaultValueIfNotFound(
    currentValue: string | RegExpMatchArray | undefined | null,
    customDefaultValue: string | undefined,
    currentRegexName: string
  ) {
    if (Array.isArray(currentValue) && currentValue.length > 0) {
      this.success.push(currentRegexName);
    } else if (!Array.isArray(currentValue) && currentValue) {
      this.success.push(currentRegexName);
    } else currentValue = customDefaultValue ?? DEFAULT_VALUE;

    return currentValue;
  }

  private updateCapturingGroup(
    regexResult: QueryRegexDataWithSubQuery | QueryRegexData,
    result: RegExpMatchArray | null
  ) {
    const capturingGroup = regexResult.capturingGroup || [];
    const { flags, name, test } = regexResult;
    if (flags.includes('g') && capturingGroup.length) {
      console.warn(
        `<RegexHelper>: \x1b[31mCannot update capture group with the global flag at Regex: ${name}. Remove the global flag to use capture group.\x1b[0m`
      );
    } else if (test && capturingGroup.length) {
      console.warn(
        `<RegexHelper>: \x1b[31mCannot update capture group with the testing option enabled at Regex: ${name}. Remove the testing option to use capture group.\x1b[0m`
      );
    }

    for (const group of capturingGroup) {
      const { index, name } = group;
      const currentValue = flags.includes('g') ? '' : result?.[index];
      const value = this.setDefaultValueIfNotFound(
        currentValue,
        group.valueIfNotFound,
        name
      ) as string;
      group.result = value;
    }
  }

  private getCurrentRegexResult() {
    return this.regexResults[this.currentRegexIndex];
  }

  private updateReference(
    reference: string,
    resultValue: string | RegExpMatchArray,
    subQueryIndex = -1
  ) {
    const currentRegex = this.getCurrentRegexResult();
    const { subQuery, updateNextSubQuery } = currentRegex;
    const isSubQuery = subQueryIndex !== -1;
    const nextSubQuery = subQuery[subQueryIndex + 1];
    const currentSubQuery = subQuery[subQueryIndex];
    const updateNext = currentSubQuery ? currentSubQuery.updateNextSubQuery : updateNextSubQuery;

    if (!isSubQuery) {
      currentRegex.reference = reference;
    }

    if (Array.isArray(resultValue) && resultValue.length > 1 && nextSubQuery && updateNext) {
      console.warn(
        `<RegexHelper>: \x1b[31mCannot update the reference of a subquery with the global flag in Regex: ${
          currentRegex.name
        }. The values found are multiple: ${JSON.stringify(
          resultValue
        )}. A value must be single to build a new Regex on it.\x1b[0m`
      );
      return;
    }

    if (nextSubQuery) {
      resultValue = Array.isArray(resultValue) ? resultValue[0] : resultValue;
      nextSubQuery.reference = updateNext ? resultValue : reference;
    }
  }

  private updateSubQuery(subQuery: QueryRegexData) {
    const current = this.getCurrentRegexResult();
    current.subQuery.push(subQuery);
  }

  private initGroupCapture(capturingGroup: CapturingGroup[] = []) {
    const capturingWithResult: CapturingGroupWithResult[] = [];

    for (const group of capturingGroup) {
      capturingWithResult.push({ ...group, result: '' });
    }

    return capturingWithResult;
  }

  /**
   * Allow you to perform a subQuery, identical to a new query. A subQuery belongs to a query and is generally used to perform a new query based the result of its parent query. SubQueries can form a chain of more complex queries. A query can have zero to unlimited subQueries.
   * @example
   * ```javascript
   * const regex = new RegexHelper({
   *   regex: `invoice number: ${anyDigits}`,
   *   name: 'invoice',
   * })
   *  .subQuery({
   *    regex: `${anyDigits}$`,
   *    name: 'invoiceNumber',
   *  })
   * .findIn('invoice number: 430 for client 0bc456 on : 12/12/2003')
   * .get('data');
   * ```
   */
  subQuery(regexAndName: RegexInit = defaultRegexInit, options: Options = defaultOptions) {
    const { name, regex, test, capturingGroup, updateNextSubQuery, valueIfNotFound } = regexAndName;
    const { flags } = options;
    const sentenceWithSpacings = this.addSpacing(regex, options.spacing);

    const subQuery: QueryRegexData = {
      result: name,
      regex: sentenceWithSpacings,
      flags: flags ?? 'i',
      capturingGroup: this.initGroupCapture(capturingGroup),
      valueIfNotFound,
      updateNextSubQuery: updateNextSubQuery ?? true,
      name,
      test,
      reference: '',
    };

    this.updateSubQuery(subQuery);
    return this;
  }
}
