import { containsHtmlTags } from './utils';

// containsHtmlTags()
describe("isObjectWithValues() function tests", () => {
  test("should return false if string has no HTML tags", () => {
    const input = "hello world";
    expect(containsHtmlTags(input)).toBe(false);
  });

  test("should return false if string has \n", () => {
    const input = "hello\nworld";
    expect(containsHtmlTags(input)).toBe(false);
  });

  test("should return false if string has markdown", () => {
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

  test("should return false if string has markdown and \n", () => {
    const input = `# Hello world\nLine one\nline two\nline three\nwith a [link](https://example.com)\n![image](https://example.com/image.png)`;
    expect(containsHtmlTags(input)).toBe(false);
  });

  test("should return false if string has less or greater than", () => {
    expect(containsHtmlTags("1 < 3")).toBe(false);
    expect(containsHtmlTags("8 > 5")).toBe(false);
    expect(containsHtmlTags("<3 love")).toBe(false);
    expect(containsHtmlTags("1 &lt; 3")).toBe(false);
    expect(containsHtmlTags("8 &gt; 5")).toBe(false);
  });

  test("should return false if multi line string has no HTML tags", () => {
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
