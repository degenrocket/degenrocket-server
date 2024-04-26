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

// Leverage html-to-text NPM package to check whether
// a string has any valid HTML tags.
export const containsHtmlTags = (
  value?: string | number | boolean
): boolean => {
  if (!value || typeof(value) !== "string") return false

  try {
    const text = convertHtmlToText(value, { wordwrap: false });
    /**
     *  We have to replace \n with ' ' in original value because
     *  that's what html-to-text NPM package does with \n.
     */
    return text !== value.replace(/\n/g, ' ');
  } catch (error) {
    return false;
  }
}
