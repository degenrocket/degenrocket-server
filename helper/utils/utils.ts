import {
  ConfigForSubmitSpasmEvent,
  CustomConfigForSubmitSpasmEvent,
  UnknownEventV2
} from "../../types/interfaces";

const { spasm } = require('spasm.js');
const { convert: convertHtmlToText } = require('html-to-text');

// Filter out undefined, null, 0, '', false, NaN, {}, []
// Keep {a: null}, {b: undefined}
// Examples:
// hasValue() // false
// hasValue(undefined)) // false
// hasValue(null) // false
// hasValue(0) // false
// hasValue('') // false
// hasValue(false) // false
// hasValue(NaN) // false
// hasValue([]) // false
// hasValue({}) // false
// hasValue({a:null}) // true
// hasValue({b:undefined}) // true
// hasValue({c:1}) // true
// hasValue(new Date()) // true
// hasValue([0]) // false
// hasValue([null]) // false
// hasValue([undefined]) // false
// hasValue([[undefined], [0], [null, NaN], '']) // false
// hasValue([[undefined], [0], [null, 1], '']) // true
// hasValue([[undefined], 1, [null, NaN], '']) // true
// hasValue([[null], 0, [true, NaN]]) // true
// hasValue([[null], 0, ['hello', NaN]]) // true
export const hasValue = (el?: any) => {
  // Filter out undefined, null, 0, '', false, NaN
  if (!el) return false

  // Filter out an empty object
  if (
    el // <- null and undefined check
    && Object.keys(el).length === 0
    && Object.getPrototypeOf(el) === Object.prototype
  ) {return false}

  // Filter out an empty array
  if (Array.isArray(el) && !el?.length) {return false}

  // Recursively check for at least one value inside an array
  if (Array.isArray(el) && el?.length) {
    let hasAtLeastOneValue: boolean = false
    el.forEach(function (e) {
      if (hasValue(e)) {
        hasAtLeastOneValue = true
      }
    })

    if (hasAtLeastOneValue) {
      return true
    } else {
      // console.error("ERROR. There are no values in the array", el)
      return false
    }
  }

  return true
}

export const isObjectWithValues = (val: any): boolean => {
  if (!val) return false
  if (Array.isArray(val)) return false
  if (typeof(val) !== "object") return false
  if (Object.keys(val).length === 0) return false

  return true
}

export const toBeString = (input: any): string => {
  switch (typeof input) {
    case 'number':
      return input.toString();
    case 'boolean':
      // Converts boolean to 'true' or 'false'
      return input.toString();
    case 'object':
      // Arrays are technically also objects in JS
      if (
        input && input !== null &&
        typeof(input) === 'object'
      ) {
        try {
          return JSON.stringify(input);
        } catch (e) {
          // Return empty string if JSON.stringify fails
          return '';
        }
      }
      break;
    case 'string':
      return input;
    default:
      return '';
  }
  return ''; // Fallback for cases not covered by the switch
}

export const toBeTimestamp = (time: any): number | undefined => {
 const date = new Date(time);
 const timestamp = date.getTime();

  // Check if the timestamp is NaN, indicating an invalid date
  if (Number.isNaN(timestamp)) {
    return undefined;
  }

  // Optional
  // Standardize the timestamp to 10 characters (seconds)
  // by rounding down the timestamp to the nearest second.
  // if (timestamp.toString().length > 10) {
  //   timestamp = Math.floor(timestamp / 1000) * 1000;
  // }

 return timestamp;
};

export const isValidUrl = (value?: any): boolean => {
  if (!value) return false
  try { 
      // new URL() constructor is less vulnerable to ReDoS attacks
      // because it's a built-it JS function that doesn't use regex
      new URL(value); 
      return true; 
  }
  catch(e) { 
      return false; 
  }
}

export const removeTrailingWhitespaceFromEachLine = (
  value?: string | number | boolean
): string => {
  if (!value || typeof(value) !== "string") return ""
  // Split the string into lines
  const lines = value.split('\n');
  // Trim whitespace from the end of each line
  const trimmedLines = lines.map(line => line.trim());
  // Join the lines back together
  const result = trimmedLines.join('\n');
  return result;
}

// Get rid of multiple spaces without regex
export const reduceMultipleSpaces = (str) => {
    let result = '';
    let inSpace = false;

    for (let i = 0; i < str.length; i++) {
        if (str[i] === ' ') {
            if (!inSpace) {
                result += ' ';
                inSpace = true;
            }
        } else {
            if (inSpace) {
                inSpace = false;
            }
            result += str[i];
        }
    }

    return result;
}

// Leverage html-to-text NPM package to check whether
// a string has any valid HTML tags.
export const containsHtmlTags = (
  value?: string | number | boolean
): boolean => {
  if (!value || typeof(value) !== "string") return false

  try {
    const convertedText = convertHtmlToText(value, { wordwrap: false, preserveNewlines: true });
    // console.log("convertedText:", convertedText)
    // console.log("convertedText.length:", convertedText.length)
    /**
     *  We have to replace \n with ' ' in original value because
     *  that's what html-to-text NPM package does with \n.
     *  Also &lt; and &gt; to < and >
     *  And remove trailing whitespace at the end of each line.
     */
    let originalValue = value
    // console.log("originalValue:", originalValue)
    // console.log("originalValue.length:", originalValue.length)
    // Currently disabled, using preserveNewlines: true instead.
    // originalValue = originalValue.replace(/\n/g, ' ')
    originalValue = originalValue.replace(/&lt;/g, '<')
    originalValue = originalValue.replace(/&gt;/g, '>')
    originalValue = removeTrailingWhitespaceFromEachLine(originalValue)
    originalValue = reduceMultipleSpaces(originalValue)
    // console.log("originalValue after all:", originalValue)
    // console.log("originalValue.length after all:", originalValue.length)
    return convertedText !== originalValue
  } catch (error) {
    return false;
  }
}

export const ifEventContainsHtmlTags = (event: UnknownEventV2) => {
  const copyOfEvent = JSON.parse(JSON.stringify(event))
  let htmlTagsDetected = false
  const checkIfContainsHtmlTags = (value: any) => {
    if (containsHtmlTags(value)) {
      htmlTagsDetected = true
    }
  }
  spasm.executeFunctionForAllNestedValuesOfType(
    copyOfEvent,
    {
      customFunction: checkIfContainsHtmlTags,
      valueType: "string"
    }
  )
  if (htmlTagsDetected) return true
  return false
}

// TODO handle if value is an object/array
export const hasCommonValuesInArrays = (
  arr1: any[],
  arr2: any[]
): boolean => {
  if (!arr1 || !Array.isArray(arr1)) return false
  if (!arr2 || !Array.isArray(arr2)) return false
  return arr1.some(item => arr2.includes(item))
}

// TODO handle if value is an object/array
export const getCommonValuesInArrays = (
  arr1: any[],
  arr2: any[]
): any[] => {
  if (!arr1 || !Array.isArray(arr1)) return []
  if (!arr2 || !Array.isArray(arr2)) return []
  const commonValues: any[] = []
  arr1.forEach(item => {
    if (arr2.includes(item)) {
      commonValues.push(item)
    }
  })
  return commonValues
}

export const mergeObjects = (
  defaultObject: Object,
  customObject: Object
): Object => {
  if (
    !isObjectWithValues(defaultObject) &&
    !isObjectWithValues(customObject)
  ) return {}
  if (
    isObjectWithValues(defaultObject) &&
    !isObjectWithValues(customObject)
  ) return defaultObject
  if (
    !isObjectWithValues(defaultObject) &&
    isObjectWithValues(customObject)
  ) return customObject

  const mergedObject: Object = { ...defaultObject };

  for (const key in customObject) {
    const value = customObject[key];
    if (
      typeof value === 'object' &&
      !Array.isArray(value) &&
      value !== null
    ) {
      // If the value is an object, recursively merge it
      mergedObject[key] = mergeObjects(defaultObject[key], value);
    } else if (
      value !== undefined
    ) {
      mergedObject[key] = value
    }
  }

  return mergedObject
}

export const mergeConfigsForSubmitSpasmEvent = (
  defaultConfig: ConfigForSubmitSpasmEvent,
  customConfig: CustomConfigForSubmitSpasmEvent
): ConfigForSubmitSpasmEvent => {
  const newConfig = mergeObjects(defaultConfig, customConfig)
  return newConfig as ConfigForSubmitSpasmEvent
}

// The Set data structure only stores unique values.
// When the array is converted into a Set, any duplicate values
// are automatically removed. Then, the spread operator (...)
// is used to convert the Set back into an array 1.
export const removeDuplicatesFromArray = (
  array: (string | number)[]
): (string | number)[] => {
  if (!Array.isArray(array)) {
    return []
  }
  return [...new Set(array)];
}
