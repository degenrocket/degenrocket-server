import { identifyLicense, identifyPostOrEvent } from './identifyEvent';
import { isNostrEvent } from './identifyEvent';
import { isNostrSpasmEvent } from './identifyEvent';
import { isNostrEventSignedOpened } from './identifyEvent';
import { isNostrSpasmEventSignedOpened } from './identifyEvent';
// import { isDmpEventSignedClosed } from './identifyEvent';
import { hasSignature } from './identifyEvent';
import { isObjectWithValues } from '../utils/utils';
import { NostrEvent, NostrEventSignedOpened, NostrSpasmEvent, NostrSpasmEventSignedOpened } from "../../types/interfaces";
import { DmpEvent, DmpEventSignedClosed, DmpEventSignedOpened } from "../../types/interfaces";

/**
 * NOTE:
 * To avoid bloating the code by creating the same objects again
 * and again, we instead predefine various valid events.
 * We then copy an object of one of the valid events into
 * an 'input' object for each test and modify a new 'input'
 * object to cover situations when a wrong data is passed.
 * This approach not only makes the code easier to read, but
 * it also helps us to bypass TypeScript's type check when
 * passing a wrong data into the functions e.g. if we want to
 * receive 'false'.
 * However, some valid objects might have nested objects.
 * In JavaScript it's common to create shallow copies using:
 * let testPost = { ...validPost };
 * let testPost = Object.assign({}, validPost);
 * These methods won't suit us, because a shallow copy means
 * creating a new object and copying over all the properties
 * from the original object. However, if the property value
 * is a reference to another object (like an array or another
 * object), the new object will still hold a reference to the
 * original object, not a copy of it.
 * So, if you modify the nested object in the new object,
 * it will also modify the original object.
 * Thus, we should create a deep copy of an object using
 * JSON.parse and JSON.stringify, e.g.:
 * const input = JSON.parse(JSON.stringify(validDmpEvent));
 */

const validDmpEvent: DmpEvent = {
  version: "dmp_v0.0.1",
  time: "2022-01-01T22:04:46.178Z",
  action: "post",
  target: "",
  title: "genesis",
  text: "not your keys, not your words",
  license: "MIT"
}

const validDmpEventSignedClosed: DmpEventSignedClosed = {
  signer: '0xf8553015220a857eda377a1e903c9e5afb3ac2fa',
  signature: '0xbd934a01dc3bd9bb183bda807d35e61accf7396c527b8a3d029c20c00b294cf029997be953772da32483b077eea856e6bafcae7a2aff95ae572af25dd3e204a71b',
  signedString: '{"version":"dmp_v0.0.1","time":"2022-01-01T22:04:46.178Z","action":"post","target":"","title":"genesis","text":"not your keys, not your words","license":"MIT"}'
}

const validDmpEventSignedOpened: DmpEventSignedOpened = {
  signer: '0xf8553015220a857eda377a1e903c9e5afb3ac2fa',
  signature: '0xbd934a01dc3bd9bb183bda807d35e61accf7396c527b8a3d029c20c00b294cf029997be953772da32483b077eea856e6bafcae7a2aff95ae572af25dd3e204a71b',
  signedString: '{"version":"dmp_v0.0.1","time":"2022-01-01T22:04:46.178Z","action":"post","target":"","title":"genesis","text":"not your keys, not your words","license":"MIT"}',
  signedObject: {
    version: "dmp_v0.0.1",
    time: "2022-01-01T22:04:46.178Z",
    action: "post",
    target: "",
    title: "genesis",
    text: "not your keys, not your words",
    license: "MIT"
  }
}

const validPostWithDmpEventSignedClosed = {
  id: 1337,
  target: "",
  action: "post",
  title: "genesis",
  text: "not your keys, not your words",
  signer: '0xf8553015220a857eda377a1e903c9e5afb3ac2fa',
  signed_message: '{"version":"dmp_v0.0.1","time":"2022-01-01T22:04:46.178Z","action":"post","target":"","title":"genesis","text":"not your keys, not your words","license":"MIT"}',
  signature: '0xbd934a01dc3bd9bb183bda807d35e61accf7396c527b8a3d029c20c00b294cf029997be953772da32483b077eea856e6bafcae7a2aff95ae572af25dd3e204a71b',
  signed_time: "2022-01-01T22:04:46.178Z",
  added_time: "2022-01-01T22:04:46.195Z",
  category: null,
  tags: null,
  tickers: null,
  upvote: 8,
  downvote: 0,
  bullish: 5,
  bearish: 0,
  important: 6,
  scam: 0,
  comments_count: 3,
  latest_action_added_time: "2023-01-01T22:04:46.195Z",
}

const validNostrEvent: NostrEvent = {
  id: "4376c65d2f232afbe9b882a35baa4f6fe8667c4e684749af565f981833ed6a65",
  pubkey: "6e468422dfb74a5738702a8823b9b28168abab8655faacb6853cd0ee15deee93",
  created_at: 1673347337,
  kind: 1,
  content: "Walled gardens became prisons, and nostr is the first step towards tearing down the prison walls.",
}

const validNostrSpasmEvent: NostrSpasmEvent = {
  id: "4376c65d2f232afbe9b882a35baa4f6fe8667c4e684749af565f981833ed6a65",
  pubkey: "6e468422dfb74a5738702a8823b9b28168abab8655faacb6853cd0ee15deee93",
  created_at: 1673347337,
  kind: 1,
  content: "Walled gardens became prisons, and nostr is the first step towards tearing down the prison walls.",
  tags: [
    [
      "spasm_version",
      "1.0.0"
    ],
  ],
}

const validNostrEventSignedOpened: NostrEventSignedOpened = {
  id: "4376c65d2f232afbe9b882a35baa4f6fe8667c4e684749af565f981833ed6a65",
  pubkey: "6e468422dfb74a5738702a8823b9b28168abab8655faacb6853cd0ee15deee93",
  created_at: 1673347337,
  kind: 1,
  content: "Walled gardens became prisons, and nostr is the first step towards tearing down the prison walls.",
  tags: [],
  sig: "908a15e46fb4d8675bab026fc230a0e3542bfade63da02d542fb78b2a8513fcd0092619a2c8c1221e581946e0191f2af505dfdf8657a414dbca329186f009262"
};

const validNostrSpasmEventSignedOpened: NostrSpasmEventSignedOpened = {
  kind: 1,
  created_at: 1705462957,
  tags:[
    ["license","SPDX-License-Identifier: CC0-1.0"],
    ["spasm_version","1.0.0"],
    ["spasm_action","post"],
    ["spasm_title","Nostr Spasm genesis"]
  ],
  content: "Walled gardens became prisons, and Spasm is the second step towards tearing down the prison walls.",
  pubkey: "2d2d9f19a98e533c27500e5f056a2a56db8fe92393e7a2135db63ad300486f42",
  id: "db300d320853b25b57fa03c586d18f69ad9786ec5e21114253fc3762b22a5651",
  sig: "db60516accfc025582bf556e3c7660c89e3982d2a656201aaea4189c6d3e3779b202c60302e55ad782ca711df20550384516abe4d7387470bc83ac757ed8f0f1"
};

const validNostrEventSignedString = '{"kind":1,"created_at":1705462957,"tags":[["license","SPDX-License-Identifier: CC0-1.0"],["spasm_version","1.0.0"],["spasm_action","post"],["spasm_title","Nostr Spasm genesis"]],"content":"Walled gardens became prisons, and Spasm is the second step towards tearing down the prison walls.","pubkey":"2d2d9f19a98e533c27500e5f056a2a56db8fe92393e7a2135db63ad300486f42","id":"db300d320853b25b57fa03c586d18f69ad9786ec5e21114253fc3762b22a5651","sig":"db60516accfc025582bf556e3c7660c89e3982d2a656201aaea4189c6d3e3779b202c60302e55ad782ca711df20550384516abe4d7387470bc83ac757ed8f0f1"}'

const validPostWithNostrSpasmEventSignedOpened = {
  id: 7,
  target: "",
  action: "post",
  title: "Nostr Spasm genesis",
  text: "Walled gardens became prisons, and Spasm is the second step towards tearing down the prison walls.",
  signer: "npub195ke7xdf3efncf6spe0s26322mdcl6frj0n6yy6akcadxqzgdapqjsm60y",
  signed_message: validNostrEventSignedString,
  signature: 'db60516accfc025582bf556e3c7660c89e3982d2a656201aaea4189c6d3e3779b202c60302e55ad782ca711df20550384516abe4d7387470bc83ac757ed8f0f1',
  signed_time: "2024-01-17T03:42:37.000Z",
  added_time: "2024-01-17T03:42:38.908Z",
  category: null,
  tags: null,
  tickers: null,
  upvote: 8,
  downvote: 0,
  bullish: 5,
  bearish: 0,
  important: 6,
  scam: 0,
  comments_count: 3,
  latest_action_added_time: "2024-01-17T03:44:46.195Z",
}

// isObjectWithValues()
describe("isObjectWithValues() function tests", () => {
  test("should return false if object is empty", () => {
    const input = {};
    expect(isObjectWithValues(input)).toBe(false);
  });

  test("should return true if has a valid DmpEvent", () => {
    const input = JSON.parse(JSON.stringify(validDmpEvent));
    expect(isObjectWithValues(input)).toBe(true);
  });

  test("should return true if has a valid DmpEventSignedClosed", () => {
    const input = JSON.parse(JSON.stringify(validDmpEventSignedClosed));
    expect(isObjectWithValues(input)).toBe(true);
  });

  test("should return true if has a valid DmpEventSignedOpened", () => {
    const input = JSON.parse(JSON.stringify(validDmpEventSignedOpened));
    expect(isObjectWithValues(input)).toBe(true);
  });

  test("should return true if has a valid NostrEvent", () => {
    const input = JSON.parse(JSON.stringify(validNostrEvent));
    expect(isObjectWithValues(input)).toBe(true);
  });

  test("should return true if has a valid NostrEventSignedOpened", () => {
    const input = JSON.parse(JSON.stringify(validNostrEventSignedOpened));
    expect(isObjectWithValues(input)).toBe(true);
  });

  test("should return true if has a valid NostrSpasmEvent", () => {
    const input = JSON.parse(JSON.stringify(validNostrSpasmEvent));
    expect(isObjectWithValues(input)).toBe(true);
  });

  test("should return true if has a valid NostrSpasmEventSignedOpened", () => {
    const input = JSON.parse(JSON.stringify(validNostrSpasmEventSignedOpened));
    expect(isObjectWithValues(input)).toBe(true);
  });
});

// hasSignature()
describe("hasSignature() function tests", () => {
  test("should return false if object doesn't contain necessary properties", () => {
    const input = {};
    expect(hasSignature(input)).toBe(false);
  });

  test("should return false if signature key is missing", () => {
    const input = { signer: '0x' };
    expect(hasSignature(input)).toBe(false);
  });

  test("should return false if signature key length is empty", () => {
    const input = { signature: '' };
    expect(hasSignature(input)).toBe(false);
  });

  test("should return false if signature key length is less than 40", () => {
    const input = { signature: '0xbd934a01dc3bd9bb183bda807d35e61accf73' };
    expect(hasSignature(input)).toBe(false);
  });

  test("should return true if signature key exists and its length is greater than 40", () => {
    const input = { signature: 'a'.repeat(50) };
    expect(hasSignature(input)).toBe(true);
  });

  test("should return true if signature key exists and its length is greater than 40", () => {
    const input = { signature: '0xbd934a01dc3bd9bb183bda807d35e61accf7396c527b8a3d029c20c00b294cf029997be953772da32483b077eea856e6bafcae7a2aff95ae572af25dd3e204a71b' };
    expect(hasSignature(input)).toBe(true);
  });

  test("should return false if sig key length is empty", () => {
    const input = { sig: '', id: '' };
    expect(hasSignature(input)).toBe(false);
  });

  test("should return false if sig key length is less than 40", () => {
    const input = { sig: '0xbd934a01dc3bd9bb183bda807d35e61accf73', id: '' };
    expect(hasSignature(input)).toBe(false);
  });

  test("should return true if sig key exists and its length is greater than 40", () => {
    const input = { sig: 'a'.repeat(50), id: '' };
    expect(hasSignature(input)).toBe(true);
  });

  test("should return true if sig key exists and its length is greater than 40", () => {
    const input = { sig: '0xbd934a01dc3bd9bb183bda807d35e61accf7396c527b8a3d029c20c00b294cf029997be953772da32483b077eea856e6bafcae7a2aff95ae572af25dd3e204a71b', id: '' };
    expect(hasSignature(input)).toBe(true);
  });

  test("should return false if is a valid DmpEvent without signature", () => {
    const input = JSON.parse(JSON.stringify(validDmpEvent));
    expect(hasSignature(input)).toBe(false);
  });

  test("should return true if is a valid DmpEventSignedClosed", () => {
    const input = JSON.parse(JSON.stringify(validDmpEventSignedClosed));
    expect(hasSignature(input)).toBe(true);
  });

  test("should return true if is a valid DmpEventSignedOpened", () => {
    const input = JSON.parse(JSON.stringify(validDmpEventSignedOpened));
    expect(hasSignature(input)).toBe(true);
  });

  test("should return false if is a valid NostrEvent without signature", () => {
    const input = JSON.parse(JSON.stringify(validNostrEvent));
    expect(hasSignature(input)).toBe(false);
  });

  test("should return true if is a valid NostrEventSignedOpened", () => {
    const input = JSON.parse(JSON.stringify(validNostrEventSignedOpened));
    expect(hasSignature(input)).toBe(true);
  });

  test("should return false if is a valid NostrSpasmEvent without signature", () => {
    const input = JSON.parse(JSON.stringify(validNostrSpasmEvent));
    expect(hasSignature(input)).toBe(false);
  });

  test("should return true if is a valid NostrSpasmEventSignedOpened", () => {
    const input = JSON.parse(JSON.stringify(validNostrSpasmEventSignedOpened));
    expect(hasSignature(input)).toBe(true);
  });
  // Add similar tests for other signature keys ('sig')
});

// identifyLicense()
describe("identifyLicense() function tests", () => {
  test("should return false if no license found", () => {
    const input = JSON.parse(JSON.stringify(validDmpEvent));
    delete input.license
    expect(identifyLicense(input)).toBe(false);
  });

  test("should identify license inside DmpEvent", () => {
    const input = JSON.parse(JSON.stringify(validDmpEvent));
    expect(identifyLicense(input)).toBe("MIT");
  });

  test("should identify license inside DmpEventSignedClosed", () => {
    const input = JSON.parse(JSON.stringify(validDmpEventSignedClosed));
    expect(identifyLicense(input)).toBe("MIT");
  });

  test("should identify license inside DmpEventSignedOpened", () => {
    const input = JSON.parse(JSON.stringify(validDmpEventSignedOpened));
    expect(identifyLicense(input)).toBe("MIT");
  });

  test("should return false for NostrEvent", () => {
    const input = JSON.parse(JSON.stringify(validNostrEvent));
    expect(identifyLicense(input)).toBe(false);
  });

  test("should return false for NostrEventSignedOpened", () => {
    const input = JSON.parse(JSON.stringify(validNostrEventSignedOpened));
    expect(identifyLicense(input)).toBe(false);
  });

  test("should return false for NostrSpasmEvent", () => {
    const input = JSON.parse(JSON.stringify(validNostrSpasmEvent));
    expect(identifyLicense(input)).toBe(false);
  });

  test("should return false for NostrSpasmEventSignedOpened", () => {
    const input = JSON.parse(JSON.stringify(validNostrSpasmEventSignedOpened));
    expect(identifyLicense(input)).toBe("SPDX-License-Identifier: CC0-1.0");
  });

  test("should identify license inside SPASM tags of NostrSpasmEvent", () => {
  const input = JSON.parse(JSON.stringify(validNostrSpasmEvent));
  input.tags.push([
    "license",
    "SPDX-License-Identifier: CC0-1.0"
  ])
    expect(identifyLicense(input)).toBe("SPDX-License-Identifier: CC0-1.0");
  });

  test("should identify license inside SPASM tags of NostrSpasmEventSignedOpened", () => {
  const input = JSON.parse(JSON.stringify(validNostrSpasmEventSignedOpened));
  input.tags.push([
    "license",
    "SPDX-License-Identifier: CC0-1.0"
  ])
    expect(identifyLicense(input)).toBe("SPDX-License-Identifier: CC0-1.0");
  });
});

// TODO:
// isDmpEvent
// isDmpEventSignedClosed
// isDmpEventSignedOpened

// isNostrEvent()
// isNostrEventSignedOpened()
// isNostrSpasmEvent()
// isNostrSpasmEventSignedOpened()
describe("isNostrEvent(), isNostrEventSignedOpened(), isNostrSpasmEvent(), isNostrSpasmEventSignedOpened() functions tests", () => {
  // kind
  test("should return false if an object is missing 'kind'", () => {
    const input = JSON.parse(JSON.stringify(validNostrSpasmEventSignedOpened));
    delete input.kind
    expect(isNostrEvent(input)).toBe(false);
    expect(isNostrSpasmEvent(input)).toBe(false);
    expect(isNostrEventSignedOpened(input)).toBe(false);
    expect(isNostrSpasmEventSignedOpened(input)).toBe(false);
  });

  test("should return false if kind is a string", () => {
    const input = JSON.parse(JSON.stringify(validNostrSpasmEventSignedOpened));
    input.kind = "1"
    expect(isNostrEvent(input)).toBe(false);
    expect(isNostrSpasmEvent(input)).toBe(false);
    expect(isNostrEventSignedOpened(input)).toBe(false);
    expect(isNostrSpasmEventSignedOpened(input)).toBe(false);
  });

  test("should return true if an object has a kind 0", () => {
    const input = JSON.parse(JSON.stringify(validNostrSpasmEventSignedOpened));
    input.kind = 0
    expect(isNostrEvent(input)).toBe(true);
    expect(isNostrSpasmEvent(input)).toBe(true);
    expect(isNostrEventSignedOpened(input)).toBe(true);
    expect(isNostrSpasmEventSignedOpened(input)).toBe(true);
  });

  test("should return true if an object has a kind 1", () => {
    const input = JSON.parse(JSON.stringify(validNostrSpasmEventSignedOpened));
    input.kind = 1
    expect(isNostrEvent(input)).toBe(true);
    expect(isNostrSpasmEvent(input)).toBe(true);
    expect(isNostrEventSignedOpened(input)).toBe(true);
    expect(isNostrSpasmEventSignedOpened(input)).toBe(true);
  });

  // created_at
  test("should return false if an object is missing 'created_at'", () => {
    const input = JSON.parse(JSON.stringify(validNostrSpasmEventSignedOpened));
    delete input.created_at
    expect(isNostrEvent(input)).toBe(false);
    expect(isNostrSpasmEvent(input)).toBe(false);
    expect(isNostrEventSignedOpened(input)).toBe(false);
    expect(isNostrSpasmEventSignedOpened(input)).toBe(false);
  });

  test("should return false if created_at is a string", () => {
    const input = JSON.parse(JSON.stringify(validNostrSpasmEventSignedOpened));
    input.created_at = "1673347337",
    expect(isNostrEvent(input)).toBe(false);
    expect(isNostrSpasmEvent(input)).toBe(false);
    expect(isNostrEventSignedOpened(input)).toBe(false);
    expect(isNostrSpasmEventSignedOpened(input)).toBe(false);
  });

  test("should return true if an object has created_at 0", () => {
    const input = JSON.parse(JSON.stringify(validNostrSpasmEventSignedOpened));
    input.created_at = 0
    expect(isNostrEvent(input)).toBe(true);
    expect(isNostrSpasmEvent(input)).toBe(true);
    expect(isNostrEventSignedOpened(input)).toBe(true);
    expect(isNostrSpasmEventSignedOpened(input)).toBe(true);
  });

  test("should return true if an object has a normal created_at", () => {
    const input = JSON.parse(JSON.stringify(validNostrSpasmEventSignedOpened));
    expect(isNostrEvent(input)).toBe(true);
    expect(isNostrSpasmEvent(input)).toBe(true);
    expect(isNostrEventSignedOpened(input)).toBe(true);
    expect(isNostrSpasmEventSignedOpened(input)).toBe(true);
  });

  // pubkey
  test("should return false if an object is missing 'pubkey'", () => {
    const input = JSON.parse(JSON.stringify(validNostrSpasmEventSignedOpened));
    delete input.pubkey
    expect(isNostrEvent(input)).toBe(false);
    expect(isNostrSpasmEvent(input)).toBe(false);
    expect(isNostrEventSignedOpened(input)).toBe(false);
    expect(isNostrSpasmEventSignedOpened(input)).toBe(false);
  });

  test("should return false if pubkey is a number", () => {
    const input = JSON.parse(JSON.stringify(validNostrSpasmEventSignedOpened));
    input.pubkey = 1337
    expect(isNostrEvent(input)).toBe(false);
    expect(isNostrSpasmEvent(input)).toBe(false);
    expect(isNostrEventSignedOpened(input)).toBe(false);
    expect(isNostrSpasmEventSignedOpened(input)).toBe(false);
  });

  test("should return true if an object has a normal pubkey", () => {
    const input = JSON.parse(JSON.stringify(validNostrSpasmEventSignedOpened));
    expect(isNostrEvent(input)).toBe(true);
    expect(isNostrSpasmEvent(input)).toBe(true);
    expect(isNostrEventSignedOpened(input)).toBe(true);
    expect(isNostrSpasmEventSignedOpened(input)).toBe(true);
  });

  // content
  test("should return false if an object is missing 'content'", () => {
    const input = JSON.parse(JSON.stringify(validNostrSpasmEventSignedOpened));
    delete input.content
    expect(isNostrEvent(input)).toBe(false);
    expect(isNostrSpasmEvent(input)).toBe(false);
    expect(isNostrEventSignedOpened(input)).toBe(false);
    expect(isNostrSpasmEventSignedOpened(input)).toBe(false);
  });

  test("should return false if content is a number", () => {
    const input = JSON.parse(JSON.stringify(validNostrSpasmEventSignedOpened));
    input.content = 1337
    expect(isNostrEvent(input)).toBe(false);
    expect(isNostrSpasmEvent(input)).toBe(false);
    expect(isNostrEventSignedOpened(input)).toBe(false);
    expect(isNostrSpasmEventSignedOpened(input)).toBe(false);
  });

  test("should return true if an object has content '0' (string)", () => {
    const input = JSON.parse(JSON.stringify(validNostrSpasmEventSignedOpened));
    input.content = "0"
    expect(isNostrEvent(input)).toBe(true);
    expect(isNostrSpasmEvent(input)).toBe(true);
    expect(isNostrEventSignedOpened(input)).toBe(true);
    expect(isNostrSpasmEventSignedOpened(input)).toBe(true);
  });

  test("should return true if an object has a normal content", () => {
    const input = JSON.parse(JSON.stringify(validNostrSpasmEventSignedOpened));
    expect(isNostrEvent(input)).toBe(true);
    expect(isNostrSpasmEvent(input)).toBe(true);
    expect(isNostrEventSignedOpened(input)).toBe(true);
    expect(isNostrSpasmEventSignedOpened(input)).toBe(true);
  });

  // valid event
  test("should return true if an object is a valid Nostr event", () => {
    const input = JSON.parse(JSON.stringify(validNostrSpasmEventSignedOpened));
    expect(isNostrEvent(input)).toBe(true);
    expect(isNostrSpasmEvent(input)).toBe(true);
    expect(isNostrEventSignedOpened(input)).toBe(true);
    expect(isNostrSpasmEventSignedOpened(input)).toBe(true);
  });
});

// identifyPostOrEvent() for DMP events
describe("identifyPostOrEvent() tests for DMP events", () => {
  test("should identify DmpEvent", () => {
    const input = JSON.parse(JSON.stringify(validDmpEvent));
    const output = {
      eventInfo: {
        baseProtocol: "dmp",
        hasExtraSpasmFields: false,
        hasSignature: false,
        isSpasmCompatible: true,
        license: "MIT",
        privateKey: false,
        type: "DmpEvent"
      },
      eventIsSealed: false,
      eventIsSealedUnderKeyName: false,
      webType: "web3"
    }
    expect(identifyPostOrEvent(input)).toEqual(output);
  });

  test("should identify DmpEventSignedClosed", () => {
    const input = JSON.parse(JSON.stringify(validDmpEventSignedClosed));
    // TODO:
    // should 'signedString' also return eventInfo.eventIsSealed?
    // should eventInfo.eventIsSealedUnderKeyName be 'signedString'?
    const output = {
      eventInfo: {
        baseProtocol: "dmp",
        hasExtraSpasmFields: false,
        hasSignature: true,
        isSpasmCompatible: true,
        license: "MIT",
        privateKey: "ethereum",
        type: "DmpEventSignedClosed"
      },
      eventIsSealed: false,
      eventIsSealedUnderKeyName: false,
      webType: "web3"
    }
    expect(identifyPostOrEvent(input)).toEqual(output);
  });

  test("should identify DmpEventSignedOpened", () => {
    const input = JSON.parse(JSON.stringify(validDmpEventSignedOpened));
    const output = {
      eventInfo: {
        baseProtocol: "dmp",
        hasExtraSpasmFields: false,
        hasSignature: true,
        isSpasmCompatible: true,
        license: "MIT",
        privateKey: "ethereum",
        type: "DmpEventSignedOpened"
      },
      eventIsSealed: false,
      eventIsSealedUnderKeyName: false,
      webType: "web3"
    }
    expect(identifyPostOrEvent(input)).toEqual(output);
  });
});

// identifyPostOrEvent() for Posts with DMP events
describe("identifyPostOrEvent() tests for Posts with DMP events", () => {
  test("should identify a Post with DmpEventSignedClosed", () => {
    const input = JSON.parse(JSON.stringify(validPostWithDmpEventSignedClosed));
    const output = {
      eventInfo: {
        baseProtocol: "dmp",
        hasExtraSpasmFields: false,
        hasSignature: true,
        isSpasmCompatible: true,
        license: "MIT",
        privateKey: "ethereum",
        type: "DmpEventSignedClosed"
      },
      eventIsSealed: true,
      eventIsSealedUnderKeyName: "signed_message",
      webType: "web3"
    }
    expect(identifyPostOrEvent(input)).toEqual(output);
  });

  // TODO:
  // test("should identify a Post with DmpEvent", () => {
  // test("should identify a Post with DmpEventSignedOpened", () => {
});

// identifyPostOrEvent() for Nostr events
describe("identifyPostOrEvent() tests for Nostr events", () => {
  test("should identify NostrEvent", () => {
    const input = JSON.parse(JSON.stringify(validNostrEvent));
    const output = {
      eventInfo: {
        baseProtocol: "nostr",
        hasExtraSpasmFields: false,
        hasSignature: false,
        isSpasmCompatible: false,
        license: false,
        privateKey: false,
        type: "NostrEvent"
      },
      eventIsSealed: false,
      eventIsSealedUnderKeyName: false,
      webType: "web3"
    }
    expect(identifyPostOrEvent(input)).toEqual(output);
  });

  test("should identify NostrEventSignedOpened", () => {
    const input = JSON.parse(JSON.stringify(validNostrEventSignedOpened));
    const output = {
      eventInfo: {
        baseProtocol: "nostr",
        hasExtraSpasmFields: false,
        hasSignature: true,
        isSpasmCompatible: false,
        license: false,
        privateKey: "nostr",
        type: "NostrEventSignedOpened"
      },
      eventIsSealed: false,
      eventIsSealedUnderKeyName: false,
      webType: "web3"
    }
    expect(identifyPostOrEvent(input)).toEqual(output);
  });

  test("should identify NostrSpasmEvent", () => {
    const input = JSON.parse(JSON.stringify(validNostrSpasmEvent));
    const output = {
      eventInfo: {
        baseProtocol: "nostr",
        hasExtraSpasmFields: true,
        hasSignature: false,
        isSpasmCompatible: true,
        license: false,
        privateKey: false,
        type: "NostrSpasmEvent"
      },
      eventIsSealed: false,
      eventIsSealedUnderKeyName: false,
      webType: "web3"
    }
    expect(identifyPostOrEvent(input)).toEqual(output);
  });

  test("should identify NostrSpasmEventSignedOpened", () => {
    const input = JSON.parse(JSON.stringify(validNostrSpasmEventSignedOpened));
    const output = {
      eventInfo: {
        baseProtocol: "nostr",
        hasExtraSpasmFields: true,
        hasSignature: true,
        isSpasmCompatible: true,
        license: "SPDX-License-Identifier: CC0-1.0",
        privateKey: "nostr",
        type: "NostrSpasmEventSignedOpened"
      },
      eventIsSealed: false,
      eventIsSealedUnderKeyName: false,
      webType: "web3"
    }
    expect(identifyPostOrEvent(input)).toEqual(output);
  });
});

// identifyPostOrEvent() for Posts with Nostr events
describe("identifyPostOrEvent() tests for Posts with Nostr events", () => {
  test("should identify a Post with NostrSpasmEventSignedOpened", () => {
    const input = JSON.parse(JSON.stringify(validPostWithNostrSpasmEventSignedOpened));
    const output = {
      eventInfo: {
        baseProtocol: "nostr",
        hasExtraSpasmFields: true,
        hasSignature: true,
        isSpasmCompatible: true,
        license: "SPDX-License-Identifier: CC0-1.0",
        privateKey: "nostr",
        type: "NostrSpasmEventSignedOpened"
      },
      eventIsSealed: true,
      eventIsSealedUnderKeyName: "signed_message",
      webType: "web3"
    }
    expect(identifyPostOrEvent(input)).toEqual(output);
  });

  // TODO:
  // test("should identify a Post with NostrEvent", () => {
  // test("should identify a Post with NostrSpasmEvent", () => {
  // test("should identify a Post with NostrSpasmEventSignedClosed", () => {
});


// TODO: template
// describe("another function tests", () => {
//   test("should identify DMP event", () => {
//     const input = {
//       signer: '0xf8553015220a857eda377a1e903c9e5afb3ac2fa',
//       signature: '0xbd934a01dc3bd9bb183bda807d35e61accf7396c527b8a3d029c20c00b294cf029997be953772da32483b077eea856e6bafcae7a2aff95ae572af25dd3e204a71b',
//       signedString: '{"version":"dmp_v0.0.1","time":"2022-01-01T22:04:46.178Z","action":"post","target":"","title":"genesis","text":"not your keys, not your words","license":"MIT"}'
//     };
//     expect(identifyPostOrEvent(input)).toBe(false);
//   });
// });
