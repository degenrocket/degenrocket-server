import {
  ConfigForSubmitSpasmEvent,
  CustomConfigForSubmitSpasmEvent,
  SpasmEventEnvelopeV2,
  SpasmEventEnvelopeWithTreeV2,
  SpasmEventV2,
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
    // For of is used instead of forEach to break from
    // the loop once at least one element has value.
    for (const e of el) {
      if (hasValue(e)) {
        hasAtLeastOneValue = true
        break
      }
    }

    if (hasAtLeastOneValue) {
      return true
    } else {
      // console.error("ERROR. There are no values in the array", el)
      return false
    }
  }

  return true
}

export const deepCopyOfObject = (obj: any) => {
  if (!obj || typeof(obj) !== "object") return {}
  return JSON.parse(JSON.stringify(obj))
}

export const copyOf = deepCopyOfObject

export const isStringOrNumber = (val: any): boolean => {
  if (!val && val !== 0) return false
  if (typeof(val) === "string") return true
  if (typeof(val) === "number") return true
  return false
}

export const isNumberOrString = isStringOrNumber
export const ifStringOrNumber = isStringOrNumber
export const ifNumberOrString = isStringOrNumber

export const isObjectWithValues = (val: any): boolean => {
  if (!val) return false
  if (Array.isArray(val)) return false
  if (typeof(val) !== "object") return false
  if (Object.keys(val).length === 0) return false

  return true
}

export const isArrayWithValues = (array: any): boolean => {
  if (!array) return false
  if (!Array.isArray(array)) return false
  if (!hasValue(array)) return false
  return true
}

export const isArrayOfStrings = (array: any): boolean => {
  if (!Array.isArray(array)) return false
  if (
    array.length > 0 &&
    array.every(element => typeof(element) === "string")
  ) {
    return true
  }
  return false
}

export const isArrayOfStringsWithValues = (array: any): boolean => {
  if (!Array.isArray(array)) return false
  if (!hasValue(array)) return false
  if (
    array.length > 0 &&
    array.every(element => typeof(element) === "string") &&
    array.every(element => hasValue(element))
  ) {
    return true
  }
  return false
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

/**
 * Converts value to a consistent timestamp across all platforms.
 * Input time value can be string, number, or Date object.
 * returns Consistent timestamp in milliseconds or undefined.
 */
export const toBeTimestamp = (
  originalTime: any
): number | null => {
  if (!originalTime) return null
  if (
    typeof(originalTime) === "number" &&
    originalTime < 0
  ) { return null }
  let time = Number(originalTime)
    ? Number(originalTime)
    : originalTime

  // First, normalize the input to a Date object
  let date: Date

  // Handle numeric inputs (timestamps or years)
  if (
    typeof time === 'number' &&
    !isNaN(time) &&
    Number.isSafeInteger(time)
  ) {
    date = new Date(time);
    
    if (!isValidDate(date)) {
      return null
    }
  } 
  // Handle string inputs
  else if (typeof time === 'string') {
    try {
      // Try parsing with timezone specification
      date = new Date(`${time} GMT`)
      
      // Fallback to standard parsing if needed
      if (!isValidDate(date)) {
        date = new Date(time)
        if (!isValidDate(date)) {
          return null
        }
      }
    } catch (err) {
      return null
    }
  } 
  // Handle Date objects
  else if (time instanceof Date) {
    date = time
    
    if (!isValidDate(date)) {
      return null
    }
  } 
  // Invalid input type
  else {
    return null
  }

  // Always use UTC for consistency
  return isValidDate(date) ? date.getTime() : null
}

// Nostr relays only accept 10 digits long timestamps
export const toBeShortTimestamp = (
  value: string | number
): number | null => {
  if (!value || !isStringOrNumber(value)) return null
  if (typeof(value) === "number" && value < 0) return null
  let timestamp = toBeTimestamp(value)
  if (!timestamp) return null
  if (String(timestamp) && String(timestamp).length === 13) {
    const str = String(timestamp)
    if (str && str.slice(0,10)) {
      const shortStr = str.slice(0,10)
      if (Number(shortStr)) { return Number(shortStr) }
    }
  } else if (
    String(timestamp) && String(timestamp).length === 10
  ) { return timestamp }
  return null
}

export const toBeLongTimestamp = (
  value: string | number
): number | null => {
  if (!value) return null
  if (typeof(value) === "number" && value < 0) return null
  if (!isStringOrNumber(value)) return null
  let timestamp = toBeTimestamp(value)
  if (!timestamp) return null
  // Some timestamps are 10 digits long, so we
  // need to standardize them to 13 digits
  if (String(timestamp) && String(timestamp).length === 10) {
    timestamp = timestamp * 1000;
  }
  if (
    timestamp && typeof(timestamp) === "number" &&
    String(timestamp) && String(timestamp).length >= 13
  ) {
    return timestamp
  } else {
    return null
  }
}

export const toBeFullTimestamp = toBeLongTimestamp
export const toBeStandardizedTimestamp = toBeShortTimestamp
export const toBeStandardTimestamp = toBeShortTimestamp
export const toBeNostrTimestamp = toBeShortTimestamp

export const isValidDate = (date: Date): boolean => {
  return (
    date instanceof Date &&
    !isNaN(date.getTime()) &&
    Number.isFinite(date.getTime())
  )
}

/*
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
*/

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
export const reduceMultipleSpaces = (str: string) => {
  if (!str || typeof(str) !== "string") { return '' }
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

export const withoutDb = (
  unknownEvent: SpasmEventV2 | SpasmEventEnvelopeV2 | SpasmEventEnvelopeWithTreeV2,
  depth: number = 0,
  maxDepth: number = 50
): SpasmEventV2 | SpasmEventEnvelopeV2 | SpasmEventEnvelopeWithTreeV2 | null => {
  // Maximum recursion depth to prevent stack overflow
  if (
    typeof(depth) !== "number" ||
    typeof(maxDepth) !== "number"
  ) { return unknownEvent }
  const maxRecursionDepth = maxDepth ?? 50
  if (depth >= maxRecursionDepth) {
    return unknownEvent
  }

  if (!unknownEvent || !isObjectWithValues(unknownEvent)) {
    return null
  }
  let event: SpasmEventV2 | SpasmEventEnvelopeV2 | SpasmEventEnvelopeWithTreeV2 =
    copyOf(unknownEvent)
  if (!event) { return null }

  if (event.db) {
    const { db, ...rest } = event
    event = rest
  }
  // if (event.stats) {
  //   const { stats, ...rest } = event
  //   event = rest
  // }

  if (
    "children" in event && event.children &&
    Array.isArray(event.children)
  ) {
    event.children.forEach((child, index) => {
      if (
        child.event && isObjectWithValues(child.event) &&
        "children" in event && event.children &&
        Array.isArray(event.children)
      ) {
        event.children[index] = withoutDb(
          child.event, depth + 1
        )
      }
    })
  }
  return event
}

export const withoutStats = (
  unknownEvent: SpasmEventV2 | SpasmEventEnvelopeV2 | SpasmEventEnvelopeWithTreeV2,
  depth: number = 0,
  maxDepth: number = 50
): SpasmEventV2 | SpasmEventEnvelopeV2 | SpasmEventEnvelopeWithTreeV2 | null => {
  // Maximum recursion depth to prevent stack overflow
  if (
    typeof(depth) !== "number" ||
    typeof(maxDepth) !== "number"
  ) { return unknownEvent }
  const maxRecursionDepth = maxDepth ?? 50
  if (depth >= maxRecursionDepth) {
    return unknownEvent
  }

  if (!unknownEvent || !isObjectWithValues(unknownEvent)) {
    return null
  }
  let event: SpasmEventV2 | SpasmEventEnvelopeV2 | SpasmEventEnvelopeWithTreeV2 =
    copyOf(unknownEvent)
  if (!event) { return null }

  // if (event.db) {
  //   const { db, ...rest } = event
  //   event = rest
  // }
  if (event.stats) {
    const { stats, ...rest } = event
    event = rest
  }

  if (
    "children" in event && event.children &&
    Array.isArray(event.children)
  ) {
    event.children.forEach((child, index) => {
      if (
        child.event && isObjectWithValues(child.event) &&
        "children" in event && event.children &&
        Array.isArray(event.children)
      ) {
        event.children[index] = withoutDb(
          child.event, depth + 1
        )
      }
    })
  }
  return event
}

export const withoutDbStats = (
  unknownEvent: SpasmEventV2 | SpasmEventEnvelopeV2 | SpasmEventEnvelopeWithTreeV2,
  depth: number = 0,
  maxDepth: number = 50
): SpasmEventV2 | SpasmEventEnvelopeV2 | SpasmEventEnvelopeWithTreeV2 | null => {
  // Maximum recursion depth to prevent stack overflow
  if (
    typeof(depth) !== "number" ||
    typeof(maxDepth) !== "number"
  ) { return unknownEvent }
  const maxRecursionDepth = maxDepth ?? 50
  if (depth >= maxRecursionDepth) {
    return unknownEvent
  }

  if (!unknownEvent || !isObjectWithValues(unknownEvent)) {
    return null
  }
  let event: SpasmEventV2 | SpasmEventEnvelopeV2 | SpasmEventEnvelopeWithTreeV2 =
    copyOf(unknownEvent)
  if (!event) { return null }

  event = withoutDb(event)
  event = withoutStats(event)

  return event
}

export const copyWithoutDbStats = withoutDbStats

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

export const splitStringIntoArrayOfStrings = (
  value: string,
  separator: string = ',',
  ifTrim: boolean = true
): string[] => {
  const array: string[] = []
  if (!value || typeof(value) !== "string") { return array }
  const dirtyArray: string[] =
    value.toLowerCase().split(separator)
  dirtyArray.forEach(el => {
    if (el && typeof(el) === "string") {
      // Remove whitespace
      if (ifTrim) {array.push(el.trim())} else {array.push(el)}
    }
  })
  return array
}

export const splitIntoArray = splitStringIntoArrayOfStrings

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

export const splitArrayInChunks = (
  array: any[], chunkSize: number
) => {
  let result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

// Used for tests to bypass TypeScript string type checks
export const fakeAsString = (val: any): string => val as string

// Used for tests to bypass TypeScript number type checks
export const fakeAsNumber = (val: any): number => val as number

// Used for tests to bypass TypeScript arrray type checks
export const fakeAsArray = (val: any): any[] => val as any[]

// Used for tests to bypass TypeScript null type checks
export const fakeAsNull = (val: any): null => val as null

// Used for tests to bypass TypeScript any type checks
export const fakeAsAny = (val: any): any => val as any

// Used for tests to bypass TypeScript any type checks
export const fakeAsObject = (val: any): Record<any, any> => { 
  return val as Record<any, any>
}
