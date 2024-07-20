const { bech32 } = require('bech32');

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

