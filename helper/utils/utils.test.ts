import {ConfigForSubmitSpasmEvent} from '../../types/interfaces';
import {
  validSpasmEventRssItemV0,
  validSpasmEventRssItemV0ConvertedToSpasmV2
} from '../_tests/_events-data';
import {
  toBeString,
  containsHtmlTags,
  getCommonValuesInArrays,
  hasCommonValuesInArrays,
  ifEventContainsHtmlTags,
  mergeConfigsForSubmitSpasmEvent,
  splitStringIntoArrayOfStrings,
  splitIntoArray,
  toBeTimestamp,
  toBeLongTimestamp,
  toBeShortTimestamp,
  isValidDate,
  isValidUrl
} from './utils';
const { spasm } = require('spasm.js');

describe('toBeString function', () => {
  test('converts number to string', () => {
    expect(toBeString(42)).toBe('42');
  });

  test('leaves string unchanged', () => {
    expect(toBeString('hello')).toBe('hello');
  });

  test('converts boolean to string representation', () => {
    expect(toBeString(true)).toBe('true');
    expect(toBeString(false)).toBe('false');
  });

  test('stringifies objects', () => {
    const obj = { foo: 'bar', baz: 42 };
    expect(toBeString(obj)).toBe(JSON.stringify(obj));
  });

  test('stringifies arrays', () => {
    const arr = [ 1, "two", 3, [ 4, { value: "hello" } ] ]
    const output = '[1,"two",3,[4,{"value":"hello"}]]'
    // expect(toBeString(arr)).toBe(JSON.stringify(arr));
    expect(toBeString(arr)).toBe(output);
  });


  test('ignores null and undefined', () => {
    expect(toBeString(null)).toBe('');
    expect(toBeString(undefined)).toBe('');
  });

  test('returns empty string for unsupported types', () => {
    expect(toBeString([])).toBe('[]');
    expect(toBeString({})).toBe('{}');
  });
});

describe('toBeTimestamp functions', () => {
  test('converts to any, long, and short timestamps', () => {
    expect(toBeTimestamp("2022-01-01T22:04:46.178Z")).toBe(1641074686178);
    expect(toBeTimestamp("1641074686178")).toBe(1641074686178);
    expect(toBeTimestamp(1641074686178)).toBe(1641074686178);
    expect(toBeTimestamp("1641074686")).toBe(1641074686);
    expect(toBeTimestamp(1641074686)).toBe(1641074686);

    expect(toBeLongTimestamp("2022-01-01T22:04:46.178Z")).toBe(1641074686178);
    expect(toBeLongTimestamp("1641074686")).toBe(1641074686000);
    expect(toBeLongTimestamp(1641074686)).toBe(1641074686000);

    expect(toBeShortTimestamp("2022-01-01T22:04:46.178Z")).toBe(1641074686);
    expect(toBeShortTimestamp("1641074686178")).toBe(1641074686);
    expect(toBeShortTimestamp(1641074686178)).toBe(1641074686);
  });
});

describe('isValidDate() function', () => {
  test('converts to any, long, and short timestamps', () => {
    expect(isValidDate(new Date())).toBe(true);
    expect(isValidDate(new Date(0))).toBe(true);
    expect(isValidDate(new Date(1641074686178))).toBe(true);
    expect(isValidDate(new Date(1641074686))).toBe(true);
    expect(isValidDate(new Date("2022-01-01T22:04:46.178Z"))).toBe(true);
    expect(isValidDate(new Date("hello"))).toBe(false);
    expect(isValidDate(null)).toBe(false);
    expect(isValidDate(undefined)).toBe(false);
  });
});

describe("isValidUrl() function tests", () => {
  test("should return true if URL is valid, else false", () => {
    expect(isValidUrl(false)).toStrictEqual(false)
    expect(isValidUrl(null)).toStrictEqual(false)
    expect(isValidUrl(123)).toStrictEqual(false)
    expect(isValidUrl(0)).toStrictEqual(false)
    expect(isValidUrl([1])).toStrictEqual(false)
    expect(isValidUrl({url:'https://spasm.network'})).toStrictEqual(false)
    expect(isValidUrl('hellow world')).toStrictEqual(false)
    expect(isValidUrl('degenrocket.space')).toStrictEqual(false)
    expect(isValidUrl('ftp://degenrocket.space')).toStrictEqual(true)
    expect(isValidUrl('https://degenrocket.space')).toStrictEqual(true)
    expect(isValidUrl('https://forum.spasm.network')).toStrictEqual(true)
    expect(isValidUrl('https://one.two.three.four.com')).toStrictEqual(true)
    expect(isValidUrl('https://thedefiant.io')).toStrictEqual(true)
    expect(isValidUrl('https://thedefiant.io/news/123')).toStrictEqual(true)
    expect(isValidUrl('https://monero.observer')).toStrictEqual(true)
    expect(isValidUrl('mailto:monero.observer')).toStrictEqual(true)
  });
});

// containsHtmlTags()
describe("containsHtmlTags() function tests", () => {
  test("should return false if string has no HTML tags", () => {
    const input = "hello world";
    expect(containsHtmlTags(input)).toBe(false);
  });

  test("should return false if string has \n without HTML tags", () => {
    expect(containsHtmlTags("hello\nworld")).toBe(false);
    expect(containsHtmlTags("hello \nworld")).toBe(false);
    expect(containsHtmlTags("hello \nworld ")).toBe(false);
    expect(containsHtmlTags("hello \nworld  \nnew line")).toBe(false);
    expect(containsHtmlTags("hello \\nworld ")).toBe(false);
    expect(containsHtmlTags("hello  \nworld  ")).toBe(false);
    expect(containsHtmlTags("hello \ \nworld ")).toBe(false);
    expect(containsHtmlTags("hello \\\nworld ")).toBe(false);
  });

  test("should return false if string has markdown without HTML tags", () => {
    expect(containsHtmlTags("*hello* world")).toBe(false);
    expect(containsHtmlTags("**hello** world")).toBe(false);
    expect(containsHtmlTags("# hello world")).toBe(false);
    expect(containsHtmlTags("## hello world")).toBe(false);
    expect(containsHtmlTags("### hello world")).toBe(false);
    expect(containsHtmlTags("#### hello world")).toBe(false);
    expect(containsHtmlTags("##### hello world")).toBe(false);
    expect(containsHtmlTags("###### hello world")).toBe(false);
    expect(containsHtmlTags("###### hello world")).toBe(false);
    expect(containsHtmlTags("hello [world](https://example.com)")).toBe(false);
    expect(containsHtmlTags("hello ![world](https://example.com/image.png)")).toBe(false);
  });

  test("should return false if string has markdown and \n without HTML tags", () => {
    const input = `# Hello world\nLine one\nline two\nline three\nwith a [link](https://example.com)\n![image](https://example.com/image.png)`;
    expect(containsHtmlTags(input)).toBe(false);
  });

  test("should return false if string has less or greater than, but no HTML tags", () => {
    expect(containsHtmlTags("1 < 3")).toBe(false);
    expect(containsHtmlTags("8 > 5")).toBe(false);
    expect(containsHtmlTags("<3 love")).toBe(false);
    expect(containsHtmlTags("1 &lt; 3")).toBe(false);
    expect(containsHtmlTags("8 &gt; 5")).toBe(false);
  });

  test("should return false if multi line string with one trailing whitespace has no HTML tags", () => {
    const input = `Hello
World and
next line 
with a **bold** [link](https://example.com)`;
    expect(containsHtmlTags(input)).toBe(false);
  });

  test("should return true if string has basic HTML tags", () => {
    // Closed tags:
    expect(containsHtmlTags("hello<br>world")).toBe(true);
    expect(containsHtmlTags("hello</br>world")).toBe(true);
    expect(containsHtmlTags("<p>hello world</p>")).toBe(true);
    expect(containsHtmlTags("<em>hello world</em>")).toBe(true);
    expect(containsHtmlTags("<div>hello world</div>")).toBe(true);
    expect(containsHtmlTags("<strong>hello world</strong>")).toBe(true);
    // Not closed tags:
    expect(containsHtmlTags("<p>hello world<p>")).toBe(true);
    expect(containsHtmlTags("<em>hello world<em>")).toBe(true);
    expect(containsHtmlTags("<div>hello world<div>")).toBe(true);
    expect(containsHtmlTags("<strong>hello world<strong>")).toBe(true);
    // Only open tag:
    expect(containsHtmlTags("<p>hello world")).toBe(true);
    expect(containsHtmlTags("<em>hello world")).toBe(true);
    expect(containsHtmlTags("<div>hello world")).toBe(true);
    expect(containsHtmlTags("<strong>hello world")).toBe(true);
  });

  test("should return true if string has a HTML tags", () => {
    const input = "<a href='https://example.com'>hello world</a>";
    expect(containsHtmlTags(input)).toBe(true);
  });

  test("should return true if string has img HTML tags", () => {
    const input = "<img src='https://example.com/image.png'>hello world</img>";
    expect(containsHtmlTags(input)).toBe(true);
  });

  test("should return true if string has invalid HTML tags", () => {
    const input = "<asf>hello world</asf>";
    expect(containsHtmlTags(input)).toBe(true);
  });
});

// ifEventContainsHtmlTags()
describe("ifEventContainsHtmlTags() function tests", () => {
  // TODO
});

// sanitizeEvent()
describe("sanitizeEvent() function tests", () => {
  const nestedArrayDirty = [
    "one", "<img src=x onerror=alert(1)//>", [ "three" ], 4,
    [ 5, true, [ "<svg><g/onload=alert(2)//<p>", 7, 8, false ],
        {
          word: "<p>abc<iframe//src=jAva&Tab;script:alert(3)>def</p>",
          words: [ "ten", "eleven" ],
          number: 12,
          numbers: [ 13, 14 ],
          mix: [ 15, "sixteen", '<math><mi//xlink:href="data:x,<script>alert(4)</script>">', true, false, "" ],
          object: {
            text: "<TABLE><tr><td>HELLO</tr></TABL>",
            booleans: [ true, false ],
            mix: [ 19, true, "<UL><li><A HREF=//google.com>click</UL>", 21, false ]
          }
        }
    ]
  ]
// DOMPurify.sanitize('<img src=x onerror=alert(1)//>'); // becomes <img src="x">
// DOMPurify.sanitize('<svg><g/onload=alert(2)//<p>'); // becomes <svg><g></g></svg>
// DOMPurify.sanitize('<p>abc<iframe//src=jAva&Tab;script:alert(3)>def</p>'); // becomes <p>abc</p>
// DOMPurify.sanitize('<math><mi//xlink:href="data:x,<script>alert(4)</script>">'); // becomes <math><mi></mi></math>
// DOMPurify.sanitize('<TABLE><tr><td>HELLO</tr></TABL>'); // becomes <table><tbody><tr><td>HELLO</td></tr></tbody></table>
// DOMPurify.sanitize('<UL><li><A HREF=//google.com>click</UL>'); // becomes <ul><li><a href="//google.com">click</a></li></ul>
  const nestedObjectDirty = {
    content: "hello",
    value: 31*64,
    valent: false,
    original: {
      content: "world",
      array: JSON.parse(JSON.stringify(nestedArrayDirty))
    }
  }
  const eventDirty = JSON.parse(JSON.stringify(nestedObjectDirty))
  const nestedArrayClean = [
    "one", '<img src="x">', [ "three" ], 4,
    [ 5, true, [ "<svg><g></g></svg>", 7, 8, false ],
        {
          word: "<p>abc</p>",
          words: [ "ten", "eleven" ],
          number: 12,
          numbers: [ 13, 14 ],
          mix: [ 15, "sixteen", "<math><mi></mi></math>", true, false, "" ],
          object: {
            text: "<table><tbody><tr><td>HELLO</td></tr></tbody></table>",
            booleans: [ true, false ],
            mix: [ 19, true, '<ul><li><a href="//google.com">click</a></li></ul>', 21, false ]
          }
        }
    ]
  ]
  const nestedObjectClean = {
    content: "hello",
    value: 31*64,
    valent: false,
    original: {
      content: "world",
      array: JSON.parse(JSON.stringify(nestedArrayClean))
    }
  }
  const eventClean = JSON.parse(JSON.stringify(nestedObjectClean))

  test("should sanitize all nested strings in event", () => {
    const input = JSON.parse(JSON.stringify(eventDirty));
    spasm.sanitizeEvent(input)
    const output = JSON.parse(JSON.stringify(eventClean));
    expect(input).toStrictEqual(output);
  });
});

// convertToSpasm() with sanitizeEvent() with DOMPurify
// validPostWithRssItem - old name
// validSpasmEventRssItemV0 - new name
// validSpasmEventRssItemV0ConvertedToSpasmV2
describe("convertToSpasm() tests", () => {
  // RssItem
  test("should return a valid SpasmEventV2 when passed a valid SpasmEventV0", () => {
    const input = JSON.parse(JSON.stringify(validSpasmEventRssItemV0));
    const inputMalicious = {
      ...input,
      // tags: ["dark", "<img src=x onerror=alert(1)//>"]
      tags: ["dark", "forest"]
    }
    const output = JSON.parse(JSON.stringify(validSpasmEventRssItemV0ConvertedToSpasmV2));
    expect(spasm.convertToSpasm(
      inputMalicious,
      { to: { spasm: { version: "2.0.0" } } }
    )).toEqual(output);
  });
  test("should return null if an event has malicious code", () => {
    const input = JSON.parse(JSON.stringify(validSpasmEventRssItemV0));
    const inputMalicious = {
      ...input,
      tags: ["dark", "<img src=x onerror=alert(1)//>"]
    }
    // const output = JSON.parse(JSON.stringify(validSpasmEventRssItemV0ConvertedToSpasmV2));
    expect(spasm.convertToSpasm(
      inputMalicious,
      { to: { spasm: { version: "2.0.0" } } }
    )).toEqual(null);
  });
});

// ifEventContainsHtmlTags() with sanitizeEvent() with DOMPurify
// validPostWithRssItem - old name
// validSpasmEventRssItemV0 - new name
// validSpasmEventRssItemV0ConvertedToSpasmV2
describe("ifEventContainsHtmlTags() tests", () => {
  test("should return false if an event has HTML tags", () => {
    const input = JSON.parse(JSON.stringify(validSpasmEventRssItemV0));
    const inputWithHtml = {
      ...input,
      tags: ["dark", "forest"]
    }
    expect(ifEventContainsHtmlTags(inputWithHtml)).toEqual(false);
  });
  test("should return true if an event has HTML tags", () => {
    const input = JSON.parse(JSON.stringify(validSpasmEventRssItemV0));
    const inputWithHtml = {
      ...input,
      tags: ["dark", "<div>some divs</div>"]
    }
    expect(ifEventContainsHtmlTags(inputWithHtml)).toEqual(true);
  });
  test("should return true if an event has malicious HTML tags", () => {
    const input = JSON.parse(JSON.stringify(validSpasmEventRssItemV0));
    const inputWithHtml = {
      ...input,
      tags: ["dark", "<img src=x onerror=alert(1)//>"]
    }
    expect(ifEventContainsHtmlTags(inputWithHtml)).toEqual(true);
  });
  test("should return true if an event has HTML tags", () => {
    const input = JSON.parse(JSON.stringify(validSpasmEventRssItemV0));
    const inputWithHtml = {
      ...input,
      tags: ["dark", "<div>some divs</div>"]
    }
    expect(ifEventContainsHtmlTags(inputWithHtml)).toEqual(true);
  });
  test("should return true if an event has HTML tags deeply nested in tags", () => {
    const input = JSON.parse(JSON.stringify(validSpasmEventRssItemV0));
    const inputWithHtml = {
      ...input,
      tags: [
        "dark",
        {
          value: {
            array: [ 1, [ "two", [ "<div>some divs</div>" ] ] ]
          }
        }
      ]
    }
    expect(ifEventContainsHtmlTags(inputWithHtml)).toEqual(true);
  });
  test("should return false if an event has no HTML tags deeply nested in tags", () => {
    const input = JSON.parse(JSON.stringify(validSpasmEventRssItemV0));
    const inputWithHtml = {
      ...input,
      tags: [
        "dark",
        {
          value: {
            array: [ 1, [ "two", [ "forest" ] ] ]
          }
        }
      ]
    }
    expect(ifEventContainsHtmlTags(inputWithHtml)).toEqual(false);
  });
  test("should return true if an event has HTML tags in content", () => {
    const input = JSON.parse(JSON.stringify(validSpasmEventRssItemV0));
    const inputWithHtml = {
      ...input,
      content: "line one<br>line two"
    }
    expect(ifEventContainsHtmlTags(inputWithHtml)).toEqual(true);
  });
  test("should return false if an event has no HTML tags in content", () => {
    const input = JSON.parse(JSON.stringify(validSpasmEventRssItemV0));
    const inputWithHtml = {
      ...input,
      content: "line one\nline two"
    }
    expect(ifEventContainsHtmlTags(inputWithHtml)).toEqual(false);
  });
});

describe("ifEventContainsHtmlTags() tests", () => {
  test("should return false if arrays have no common values", () => {
    const arr1 = []
    const arr2 = []
    const arr3 = [ 1, 2 , 3 ]
    const arr4 = [ "four", "five", "six" ]
    const arr5 = [ 5, 4, 3 ]
    const arr6 = [ "eight", "seven", "six" ]
    const arr7 = [ 5, 4, 3, "eight", "seven", "six" ]
    const arr8 = [ 7, 6, 5, "ten", "nine", "eight" ]
    const arr9 = [ 9, { value: "nine" } ]
    const arr10 = [ 99, { value: "nine" } ]
    const arr11 = [ 11, { value: "eleven" } ]

    // hasCommonValuesInArrays()
    expect(hasCommonValuesInArrays(arr1, arr2)).toEqual(false);
    expect(hasCommonValuesInArrays(arr1, arr3)).toEqual(false);
    expect(hasCommonValuesInArrays(arr1, arr4)).toEqual(false);
    expect(hasCommonValuesInArrays(arr3, arr4)).toEqual(false);
    expect(hasCommonValuesInArrays(arr3, arr6)).toEqual(false);
    expect(hasCommonValuesInArrays(arr4, arr5)).toEqual(false);
    expect(hasCommonValuesInArrays(arr9, arr11)).toEqual(false);
    expect(hasCommonValuesInArrays(arr10, arr11)).toEqual(false);
    expect(hasCommonValuesInArrays(arr3, arr5)).toEqual(true);
    expect(hasCommonValuesInArrays(arr4, arr6)).toEqual(true);
    expect(hasCommonValuesInArrays(arr3, arr7)).toEqual(true);
    expect(hasCommonValuesInArrays(arr4, arr7)).toEqual(true);
    expect(hasCommonValuesInArrays(arr7, arr8)).toEqual(true);
    // TODO handle if value is an object/array
    // expect(hasCommonValuesInArrays(arr9, arr10)).toEqual(true);
    // expect([{value: 1}].includes({value: 1})).toEqual(true);
    // expect([[1]].includes([1])).toEqual(true);
    // expect([1].includes(1)).toEqual(true);

    // commonValuesInArrays()
    expect(getCommonValuesInArrays(arr3, arr5)).toEqual([3]);
    expect(getCommonValuesInArrays(arr4, arr6)).toEqual(["six"]);
    expect(getCommonValuesInArrays(arr3, arr7)).toEqual([3]);
    expect(getCommonValuesInArrays(arr4, arr7)).toEqual(["six"]);
    expect(getCommonValuesInArrays(arr7, arr8)).toEqual([ 5, "eight"]);
  });
});

describe("mergeConfigsForSubmitSpasmEvent() tests", () => {
  test("should merge configs", async () => {
    const defaultConfig = new ConfigForSubmitSpasmEvent()
    const customConfig = new ConfigForSubmitSpasmEvent()
    customConfig.web3.signature.ethereum.enabled = false

    const input = mergeConfigsForSubmitSpasmEvent(
      defaultConfig, customConfig
    )
    const output = new ConfigForSubmitSpasmEvent()
    output.web3.signature.ethereum.enabled = false

    expect(input).toEqual(output);
  });
});

// splitStringIntoArrayOfStrings
describe("splitStringIntoArrayOfStrings() tests", () => {
  test("should return true if passed true", async () => {
    const input = "one, two,three, four . five , six  "
    const output1 = ["one","two","three","four . five","six" ]
    const output2 = ["one, two,three, four","five , six" ]
    const output3 = ["one"," two","three"," four . five "," six  "]
    expect(splitStringIntoArrayOfStrings(input))
      .toStrictEqual(output1);
    expect(splitStringIntoArrayOfStrings(input, '.'))
      .toStrictEqual(output2);
    expect(splitStringIntoArrayOfStrings(input, ',', false))
      .toStrictEqual(output3);
    // aliases
    expect(splitIntoArray(input))
      .toStrictEqual(output1);
    expect(splitIntoArray(input, '.'))
      .toStrictEqual(output2);
    expect(splitIntoArray(input, ',', false))
      .toStrictEqual(output3);
  });
});

// template()
describe("template() function tests", () => {
  test("should return true if passed true", async () => {
    const input = true;
    const output = true;
    expect(input).toStrictEqual(output);
  });
});
