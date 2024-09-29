/**
 * The data returned when info is set to "general" in the get class method. This allows you to have a general overview about the successfull regex, fails and total.
 */
export interface General {
  success_in_pc: number;
  success: {
    count: number;
    name: string[];
  };
  fails: {
    count: number;
    name: string[];
  };
  total: {
    count: number;
    name: string[];
  };
}

export interface FuzzyStat {
  originalText: string;
  finalText: string;
  /**
   * Number of text modifications fuzzy search has done.
   */
  modification: number;
  /**
   * Store the name of the regex and its fuzzy search score. Usefull for threshold adjustement.
   */
  records: RegexNameAndScore[];
}

export interface RegexNameAndScore {
  name: string;
  score: number;
}

export interface Spacing {
  /**
   * Optional spacing between words.
   * @defaultValue true
   */
  optional?: boolean;
  /**
   * Allow you to define a custom spacing between words.
   */
  custom?: string;
}

/**
 * The option to pass at regex initialisation.
 */
export interface Options {
  spacing?: Spacing;
  /**
   * Flags of the regex. Possible flags are 'g' | 'i' | 'm' | 's' | 'u' | 'y'.
   * @defaultValue 'i' (insensitive)
   */
  flags?: string;
}

export interface QueryRegexData {
  result: string | RegExpMatchArray;
  regex: string | RegExp;
  flags: string;
  name: string;
  test?: boolean;
  reference: string;
  capturingGroup?: CapturingGroupWithResult[];
  updateNextSubQuery?: boolean;
  fuzzy?: Fuzzy;
  valueIfNotFound?: any;
}

export type SubQueryRegexData = Omit<QueryRegexData, 'fuzzy'>;

export interface QueryRegexDataWithSubQuery extends QueryRegexData {
  subQuery: SubQueryRegexData[];
}

/**
 * The information about the Regex at initialisation.
 */
export interface RegexInit {
  /**
   * The regex that will be used. Use a dubble "\\" because "\\" is an escaping character.
   * @example
   * // 'invoice type: classic, number: 4791
   * regex: `invoice type: \\w+, number: \\d+`
   */
  regex: string;
  /**
   * The name of the regex.
   */
  name: string;
  /**
   * The regex should only be tested for presence of a substring. Will return a boolean string.
   * @defaultValue "false"
   */
  test?: boolean;
  /**
   * Use group to capture substrings in your regex. Please note that capturing group does not work with the global flag enabled (g).
   * @defaultValue []
   */
  capturingGroup?: CapturingGroup[];
  /**
   * Update the next subQuery with the result of the current query.
   * @defaultValue true
   */
  updateNextSubQuery?: boolean;
  /**
   * Text to be displayed if no result are found.
   * @defaultValue "not found"
   */
  valueIfNotFound?: any;
  /**
   * Allows approximate text matching based on the provided expression. Useful if a certain deviation on the text is still accepted as a match.
   */
  fuzzy?: Fuzzy;
}

export interface Fuzzy {
  /**
   * The text expression to perform a fuzzy search on. A fuzzy search allows for approximate matching (i.e., when you are not sure of the exact text match).
   * Note: This only applies to plain text, not regular expressions.
   * See more on fuzzy search {@link https://greenflag31.github.io/regex-helper/documents/fuzzy-search.html }
   */
  expression: string;

  /**
   * The threshold that determines whether the fuzzy match is accepted.
   * For example, if the fuzzy search returns a match score of 0.8 and the threshold is set to 0.7, the expression will be considered a match and the part in the general text will be replaced by the expression.
   * See more on fuzzy search {@link https://greenflag31.github.io/regex-helper/documents/fuzzy-search.html }
   * @defaultValue 0.65
   */
  threshold?: number;

  /**
   * By default, a space is used to delimitate the complete word to replace in the original reference. Change it if you expect another structure.
   * See more on fuzzy search {@link https://greenflag31.github.io/regex-helper/documents/fuzzy-search.html }
   * @defaultValue " " (empty space)
   */
  delimitator?: string;
}

export interface CapturingGroupWithResult extends CapturingGroup {
  result: string;
}

export interface CapturingGroup {
  /**
   * The index of the capture group. Starts at 1.
   */
  index: number;
  /**
   * The name of the capture group.
   */
  name: string;
  /**
   * Text to be displayed if no result are found.
   * @defaultValue "not found"
   */
  valueIfNotFound?: any;
}
