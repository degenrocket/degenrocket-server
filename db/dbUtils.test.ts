import {
  initializeDatabaseMain,
  initializeDatabaseTest,
} from './dbUtils';

// template()
describe("template() function tests", () => {
  test("should return true if passed true", () => {
    const input = true;
    const output = true;
    expect(input).toStrictEqual(output);
  });
});

describe("initializeDatabaseMain() function tests", () => {
  test("should return true if database is initialized", async () => {
    console.log = () => {}
    const input = await initializeDatabaseMain()
    expect(input).toStrictEqual(true);
  });
});

describe("initializeDatabaseTest() function tests", () => {
  test("should return true if database is initialized", async () => {
    console.log = () => {}
    const input = await initializeDatabaseTest()
    expect(input).toStrictEqual(true);
  });
});
