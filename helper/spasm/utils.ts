const { bech32 } = require('bech32');
const { convert: convertHtmlToText } = require('html-to-text');

export const isObjectWithValues = (val: any): boolean => {
  if (!val) return false
  if (Array.isArray(val)) return false
  if (typeof(val) !== "object") return false
  if (Object.keys(val).length === 0) return false

  return true
}


// Nostr
export const convertHexToBech32 = (hexKey, prefix?) => {
  try {
    // Convert private or public key from HEX to bech32
    let bytes = new Uint8Array(hexKey.length / 2);

    for(let i = 0; i < hexKey.length; i+=2) {
        bytes[i/2] = parseInt(hexKey.substr(i, 2), 16);
    }

    const words = bech32.toWords(bytes);

    prefix = prefix ?? 'npub'

    const bech32Key = bech32.encode(prefix, words);

    return bech32Key
  } catch (error) {
    console.error(error)
    return ''
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
