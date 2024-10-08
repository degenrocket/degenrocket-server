import {poolTest} from "../../db";
import {howManyEntriesInTable} from "../../db/dbUtils";
import {cleanDbTable, fetchAndAddCommentsRecursively, insertSpasmEventV2} from "../sql/sqlUtils";
import {copyOf, isObjectWithValues} from "../utils/utils";
import {childOfGenesisDepth1Branch1Author1ReplySpasmEventV2, childOfGenesisDepth2Branch1Author2ReplySpasmEventV2, childOfGenesisDepth3Branch1Author1ReplySpasmEventV2, validDmpEventSignedClosedConvertedToSpasmV2} from "./_events-data";

// Tree
describe("Tests for different tree-related functions", () => {
  test("Tests for comments", async () => {
    // Clean up db table before testing.
    expect(await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);

    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)

    expect(await insertSpasmEventV2(
      copyOf(childOfGenesisDepth1Branch1Author1ReplySpasmEventV2),
      poolTest
    )).toStrictEqual(true)

    expect(await insertSpasmEventV2(
      copyOf(childOfGenesisDepth2Branch1Author2ReplySpasmEventV2),
      poolTest
    )).toStrictEqual(true)

    expect(await insertSpasmEventV2(
      copyOf(childOfGenesisDepth3Branch1Author1ReplySpasmEventV2),
      poolTest
    )).toStrictEqual(true)

    const eventWithComments = await fetchAndAddCommentsRecursively(
      copyOf(validDmpEventSignedClosedConvertedToSpasmV2),
      poolTest
    )
      // console.log("eventWithComments:", eventWithComments.children[0].event)
      // console.log("eventWithComments:", eventWithComments.children[0].event.children[0].event)
    expect(
      isObjectWithValues(
        eventWithComments
         .children[0].event
         .children[0].event
         .children[0].event
      )
    ).toStrictEqual(true)

    // Clean up db table after testing.
    expect(await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);

    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)
  });
});
