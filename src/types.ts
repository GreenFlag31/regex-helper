/**
 * The data returned when info is set to "general" in the get class method. This allows you to have a general overview about the successfull regex, fails and total.
 */
export interface General {
  success: number;
  failed: number;
  total: number;
}

/**
 * The option to pass at regex initialisation.
 */
export interface Options {
  spacing?: {
    /**
     * Optional spacing.
     * @defaultValue true.
     */
    optional?: boolean;
    /**
     * Allow you to define a custom spacing.
     */
    custom?: string;
  };
  /**
   * Flags of the regex. Possible flags are 'g' | 'i' | 'm' | 's' | 'u' | 'y'.
   * @defaultValue 'i' (insensitive).
   */
  flags?: string;
}

export interface QueryRegexData {
  result: string | RegExpMatchArray;
  regex: string | RegExp;
  flags: string;
  [name: string]: any;
  test?: boolean;
  reference: string;
  capturingGroup?: CapturingGroupWithResult[];
  updateNextSubQuery?: boolean;
  valueIfNotFound?: string;
}

export interface QueryRegexDataWithSubQuery extends QueryRegexData {
  subQuery: QueryRegexData[];
}

/**
 * The information about the Regex at initialisation.
 */
export interface RegexInit {
  /**
   * The regex that will be used. Use a dubble "\\" because "\\" is an escaping character.
   */
  regex: string;
  /**
   * The name of the regex.
   */
  name: string;
  /**
   * The regex should only be tested for presence of a substring. Will return a boolean string.
   * @defaultValue false.
   */
  test?: boolean;
  /**
   * Use group to capture substrings in your regex. Please note that capturing group does not work with the 'g' flag.
   * @defaultValue [].
   */
  capturingGroup?: CapturingGroup[];
  /**
   * Update the next subQuery with the result of the current query.
   * @defaultValue true.
   */
  updateNextSubQuery?: boolean;
  /**
   * Text to be displayed if no result are found.
   * @defaultValue "not found".
   */
  valueIfNotFound?: string;
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
   * @defaultValue "not found".
   */
  valueIfNotFound?: string;
}
