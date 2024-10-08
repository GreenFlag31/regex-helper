import { optionalSpacings, spacings } from './const';
import {
  RegexInit,
  Options,
  QueryRegexDataWithSubQuery,
  QueryRegexData,
  CapturingGroup,
  CapturingGroupWithResult,
  General,
  Spacing,
  Fuzzy,
  FuzzyStat,
  SubQueryRegexData,
} from './types';
import { fuzzy, search, sortKind } from 'fast-fuzzy';

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
  private regexResults: QueryRegexDataWithSubQuery[] = [];
  private currentRegexIndex = 0;
  private success: General['success']['name'] = [];
  private fuzzyStat: FuzzyStat = { modifications: [], count: 0, records: [] };

  constructor() {}

  private init(regexAndName: RegexInit, options: Options) {
    const { regex } = regexAndName;
    if (!regex) return false;

    options = this.setDefaultOptionsValues(options);
    regexAndName = this.setDefaultRegexValues(regexAndName, options.spacing!);
    // ajouter par défaut le seuil pour le fuzzy

    this.pushResultValue(regexAndName, options);
    return true;
  }

  private setDefaultRegexValues(regexAndName: RegexInit, spacing: Spacing): RegexInit {
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
    const { name, regex, test, capturingGroup, updateNextSubQuery, valueIfNotFound, fuzzy } =
      regexAndName;

    this.regexResults.push({
      result: '',
      regex,
      flags: options.flags ?? 'i',
      name,
      test,
      reference: '',
      capturingGroup: this.initGroupCapture(capturingGroup),
      updateNextSubQuery: updateNextSubQuery ?? true,
      valueIfNotFound,
      fuzzy,
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
    const init = this.init(regexAndName, options);
    if (!init) return this;

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
  get(info: 'debug'): QueryRegexDataWithSubQuery[];
  get(info: 'fuzzy'): FuzzyStat;
  get(info: 'debug' | 'data' | 'general' | 'fuzzy') {
    if (info === 'data') return this.returnOnlyData();
    if (info === 'general') return this.getGeneralInfos();
    if (info === 'fuzzy') return this.fuzzyStat;
    return this.regexResults;
  }

  private getGeneralInfos() {
    const data = this.returnOnlyData();
    const allRegex = Object.keys(data);
    const total = allRegex.length;
    const success = this.success.length;
    const fails: string[] = [];
    const stat = Math.trunc((success / total) * 100);

    for (const regex of allRegex) {
      if (!this.success.includes(regex)) fails.push(regex);
    }

    const general: General = {
      success_in_pc: stat,
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
      regexResult.regex = (regexResult.regex as RegExp).source;

      for (const subQueryContainer of regexResult.subQuery) {
        this.trimTextResponse(subQueryContainer);
        subQueryContainer.regex = (subQueryContainer.regex as RegExp).source;
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
        this.matchOrTestRegex(regexResult, text);

        for (const subQueryContainer of regexResult.subQuery) {
          const { flags, regex, reference } = subQueryContainer;
          const subRegex = new RegExp(regex, flags);
          subQueryContainer.regex = subRegex;
          this.matchOrTestRegex(subQueryContainer, reference, subQueryIndex);
          subQueryIndex += 1;
        }

        this.currentRegexIndex += 1;
      }
    } catch (error) {
      const { name } = this.regexResults[this.currentRegexIndex];
      throw new Error(`<RegexHelper>: Failed to build Regex at: ${name}. ${error}`);
    }
  }

  private matchOrTestRegex(
    regexResult: QueryRegexDataWithSubQuery | QueryRegexData,
    reference: string,
    subQueryIndex = -1
  ) {
    const { flags, test, fuzzy, name } = regexResult;
    const regex = regexResult.regex as RegExp;
    const isSubQuery = subQueryIndex !== -1;
    reference = this.fuzzySearch(fuzzy, reference, isSubQuery, name);

    let result = reference.match(regex);

    if (test) {
      const isPresent = regex.test(reference);
      result = isPresent === false ? null : [isPresent.toString()];
    }

    const resultValue = flags.includes('g') ? result : result?.[0];
    this.updateCapturingGroup(regexResult, result);
    this.updateReference(reference, resultValue || '', subQueryIndex);
    this.updateResultValue(resultValue, isSubQuery, subQueryIndex);
  }

  private fuzzySearch(
    fuzzySearch: Fuzzy | undefined,
    reference: string,
    isSubQuery: boolean,
    name: string
  ) {
    if (!fuzzySearch || isSubQuery) return reference;

    const { expression, threshold = 0.65, delimitator = ' ' } = fuzzySearch;

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

      if (score === 1 || score < threshold) continue;

      const startIndex = replacedInText.indexOf(original) + index;
      const endIndex = startIndex + length;

      let nextDelimitation = replacedInText.indexOf(delimitator, endIndex);
      if (delimitator !== ' ') {
        // a given delimitator should start at startIndex
        nextDelimitation = replacedInText.indexOf(delimitator, startIndex);
      }

      const nextSpace = replacedInText.indexOf(' ', endIndex);
      let limit = nextDelimitation;

      // if a space comes before the delimitation, take it
      if (nextSpace !== -1 && (nextSpace < nextDelimitation || nextDelimitation === -1)) {
        limit = nextSpace;
      }

      if (limit === -1 || startIndex === -1) continue;

      const foundInOriginalText = replacedInText.substring(startIndex, limit).trim();
      replacedInText = replacedInText.replace(foundInOriginalText, expression);

      this.fuzzyStat.count += 1;
      this.fuzzyStat.modifications.push({
        original: foundInOriginalText,
        replaced: expression,
      });
    }

    return replacedInText;
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
      throw new Error(
        `<RegexHelper>: Cannot update capture group with the global flag at Regex: ${name}. Remove the global flag to use capture group.`
      );
    } else if (test && capturingGroup.length) {
      throw new Error(
        `<RegexHelper>: Cannot update capture group with the testing option enabled at Regex: ${name}. Remove the testing option to use capture group.`
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
    const currentSubQuery = subQuery[subQueryIndex];
    const isNextSubQuery = subQuery[subQueryIndex + 1];
    const updateNext = currentSubQuery ? currentSubQuery.updateNextSubQuery : updateNextSubQuery;

    if (!isSubQuery) {
      currentRegex.reference = reference;
    }

    if (Array.isArray(resultValue) && resultValue.length > 1 && isNextSubQuery && updateNext) {
      throw new Error(
        `<RegexHelper>: Cannot update the reference of a subquery with the global flag in Regex: ${
          currentRegex.name
        }. The values found are multiple: ${JSON.stringify(
          resultValue
        )}. A value must be single to build a new Regex on it.`
      );
    }

    if (isNextSubQuery) {
      // Preemptively modify the next subQuery
      resultValue = Array.isArray(resultValue) ? resultValue[0] : resultValue;
      isNextSubQuery.reference = updateNext ? resultValue : reference;
    }
  }

  private updateSubQuery(subQuery: QueryRegexData) {
    const current = this.regexResults[this.currentRegexIndex - 1];
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
   * const regex = new RegexHelper()
   *  .query({
   *      regex: `invoice number: ${anyDigits}`,
   *      name: 'invoice',
   *   })
   *  .subQuery({
   *    regex: `${anyDigits}$`,
   *    name: 'invoiceNumber',
   *  })
   * .findIn('invoice number: 430 for client 0bc456 on : 12/12/2003')
   * .get('data');
   * ```
   */
  subQuery(regexAndName: Omit<RegexInit, 'fuzzy'>, options = defaultOptions) {
    const { name, regex, test, capturingGroup, updateNextSubQuery, valueIfNotFound } = regexAndName;
    if (!regex) return this;

    options = this.setDefaultOptionsValues(options);
    regexAndName = this.setDefaultRegexValues(regexAndName, options.spacing!);

    const subQuery: SubQueryRegexData = {
      result: name,
      regex,
      flags: options.flags ?? 'i',
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
