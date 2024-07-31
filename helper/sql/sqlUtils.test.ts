import {
  howManyEntriesInTable
} from '../../db/dbUtils';
import {
  moderateDeleteValidDmpReply,
  moderateDeleteValidDmpReplyConvertedToSpasmEventV2,
  validDmpActionPostDiffSignerSignedClosed,
  validDmpActionPostSignedClosed,
  validDmpActionPostSignedClosedDuplicate,
  validDmpEventSignedClosed,
  validDmpEventSignedClosedConvertedToSpasmV2,
  validDmpReactionDownvoteDiffParentSignedClosed,
  validDmpReactionDownvoteDiffSignerSignedClosed,
  validDmpReactionDownvoteSignedClosed,
  validDmpReactionDownvoteSignedClosedDuplicate,
  validDmpReactionUpvote,
  validDmpReactionUpvoteDiffParentSignedClosed,
  validDmpReactionUpvoteDiffSignerSignedClosed,
  validDmpReactionUpvoteDiffSignerSignedClosedConvertedToSpasmEventV2,
  validDmpReactionUpvoteSignedClosed,
  validDmpReactionUpvoteSignedClosedConvertedToSpasmEventV2,
  validDmpReactionUpvoteSignedClosedDuplicate,
  invalidDmpReactionUpvoteSignedClosedWrongSignature,
  validDmpReplyDiffParentSignedClosed,
  validDmpReplyDiffSignerSignedClosed,
  validDmpReplySignedClosed,
  validDmpReplySignedClosedDuplicate,
  validSpasmEventRssItemV0ConvertedToSpasmV2
} from '../_tests/_events-data';
import {
  poolTest,
} from './../../db';
import {
  cleanDbTable,
  deleteSpasmEventsV2FromDbByIds,
  deleteSpasmEventV2FromDbById,
  fetchAllSpasmEventsV2ByIds,
  fetchAllSpasmEventsV2ByParentId,
  fetchAllSpasmEventsV2BySigner,
  fetchEventWithSameSpasmIdFromDbV2,
  fetchSpasmEventV2ById,
  incrementSpasmEventActionV2,
  insertSpasmEventV2,
  isEventBanned,
  isReactionDuplicate
} from './sqlUtils';
const { spasm } = require('spasm.js');

// template()
describe("template() function tests", () => {
  test("should return true if passed true", async () => {
    const input = true;
    const output = true;
    expect(input).toStrictEqual(output);
  });
});

describe("multiple chained tests", () => {
  test("multiple chained tests", async () => {
    // Clean up db table before testing.
    expect(
      await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);

    expect(
      await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)

    expect(
      await fetchEventWithSameSpasmIdFromDbV2(
        validDmpEventSignedClosed, poolTest
      )
    ).toStrictEqual(null)
    
    expect(
      (
        await spasm.convertToSpasm(
          validDmpReactionUpvoteSignedClosed,
          { to: { version: "2.0.0" } }
        )
      ).content
    ).toStrictEqual("upvote")

    expect(
      (
        await spasm.convertToSpasm(
          validDmpReactionUpvoteSignedClosedDuplicate,
          { to: { version: "2.0.0" } }
        )
      ).content
    ).toStrictEqual("upvote")

    // Dmp events
    expect(await isReactionDuplicate(
      validDmpReactionUpvoteSignedClosed, poolTest
    )).toStrictEqual(false)

    expect(await isReactionDuplicate(
      validDmpReactionUpvoteSignedClosedDuplicate, poolTest
    )).toStrictEqual(false)

    // returns false because event is not in db yet
    expect(
      await deleteSpasmEventV2FromDbById(
        validDmpEventSignedClosedConvertedToSpasmV2.ids[0].value,
        poolTest,
        "spasm_events"
      )
    ).toStrictEqual(false);

    expect(await insertSpasmEventV2(
      validDmpEventSignedClosed, poolTest
    )).toStrictEqual(true)

    expect(await howManyEntriesInTable(
      "spasm_events", poolTest
    )).toStrictEqual(1)

    expect((await fetchEventWithSameSpasmIdFromDbV2(
        validDmpEventSignedClosed, poolTest)
      ).title
    ).toStrictEqual("genesis")

    expect(await insertSpasmEventV2(
      validDmpReactionUpvoteSignedClosed, poolTest
    )).toStrictEqual(true)

    expect(await isReactionDuplicate(
        validDmpReactionUpvoteSignedClosed, poolTest
    )).toStrictEqual(true)

    expect(await isReactionDuplicate(
      validDmpReactionUpvoteSignedClosedDuplicate, poolTest
    )).toStrictEqual(true)

    // returns false because its action is 'post', not 'react'
    expect(await isReactionDuplicate(
        validDmpEventSignedClosed, poolTest
    )).toStrictEqual(false)

    const fetchedEventDmpById = await fetchSpasmEventV2ById(
      validDmpEventSignedClosedConvertedToSpasmV2.ids[0].value,
      poolTest
    )

    expect(fetchedEventDmpById.title).toStrictEqual("genesis")

    const fetchedEventsDmpBySigner = await fetchAllSpasmEventsV2BySigner(
      "0xf8553015220a857eda377a1e903c9e5afb3ac2fa",
      poolTest
    )

    expect(fetchedEventsDmpBySigner[0].title).toStrictEqual("genesis")

    expect(
      await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(2)

    // returns true because event has been deleted
    expect(
      await deleteSpasmEventV2FromDbById(
        validDmpEventSignedClosedConvertedToSpasmV2.ids[0].value,
        poolTest,
        "spasm_events"
      )
    ).toStrictEqual(true);

    expect(
      await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(1)

    const deletedEventDmpById = await fetchSpasmEventV2ById(
      validDmpEventSignedClosedConvertedToSpasmV2.ids[0].value,
      poolTest
    )

    expect(deletedEventDmpById).toStrictEqual(null)

    // Web2 events
    expect(
      await insertSpasmEventV2(
        validSpasmEventRssItemV0ConvertedToSpasmV2,
        poolTest
      )
    ).toStrictEqual(true)

    expect(
      await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(2)

    // This web2 event has 3 ids (spasmid, url, guid):
    // spasmid018c2de31b99295885fbc4d86ecbeaa51c006a79abe5e728493b24bd186fb752eb
    // https://forum.degenrocket.space/?b=21&t=fog&c=samourai&h=hijack
    // https://forum.degenrocket.space/?l=terraforming
    const fetchedEventWeb2ByIdSpasmid = await fetchSpasmEventV2ById(
      "spasmid018c2de31b99295885fbc4d86ecbeaa51c006a79abe5e728493b24bd186fb752eb",
      poolTest
    )

    const fetchedEventWeb2ByIdUrl = await fetchSpasmEventV2ById(
      "https://forum.degenrocket.space/?b=21&t=fog&c=samourai&h=hijack",
      poolTest
    )

    const fetchedEventWeb2ByIdGuid = await fetchSpasmEventV2ById(
      "https://forum.degenrocket.space/?l=terraforming",
      poolTest
    )

    expect(fetchedEventWeb2ByIdSpasmid.title).toStrictEqual("To the Moon!")
    expect(fetchedEventWeb2ByIdUrl.title).toStrictEqual("To the Moon!")
    expect(fetchedEventWeb2ByIdGuid.title).toStrictEqual("To the Moon!")

    expect(
      await deleteSpasmEventsV2FromDbByIds(
        [
          "https://forum.degenrocket.space/?b=21&t=fog&c=samourai&h=hijack",
          "https://forum.degenrocket.space/?l=terraforming",
          "some-random-id with space",
          12345
        ],
        poolTest
      )
    ).toStrictEqual(true)

    // Calling the same function should return false because
    // there will be no events to delete after the initial
    // deletion above.
    expect(
      await deleteSpasmEventsV2FromDbByIds(
        [
          "https://forum.degenrocket.space/?b=21&t=fog&c=samourai&h=hijack",
          "https://forum.degenrocket.space/?l=terraforming",
          "some-random-id with space",
          12345
        ],
        poolTest
      )
    ).toStrictEqual(false)

    expect(
      await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(1)

    // Clean up db table after testing.
    expect(
      await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);

    expect(
      await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)
  });
});

// isReactionDuplicate()
describe("isReactionDuplicate() function tests", () => {
  test("should return true if passed true", async () => {
    // Clean up db table before testing.
    expect(
      await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);

    expect(
      await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)

    // ============
    // Step 1. Check an empty database.
    // Should return false for all events since db is empty
    // Action: post
    expect(await isReactionDuplicate(
      validDmpActionPostSignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpActionPostSignedClosedDuplicate, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpActionPostDiffSignerSignedClosed, poolTest
    )).toStrictEqual(false)

    // Action: react (upvote)
    expect(await isReactionDuplicate(
      validDmpReactionUpvoteSignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReactionUpvoteSignedClosedDuplicate, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReactionUpvoteDiffParentSignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReactionUpvoteDiffSignerSignedClosed, poolTest
    )).toStrictEqual(false)
    
    // Action: react (downvote)
    expect(await isReactionDuplicate(
      validDmpReactionDownvoteSignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReactionDownvoteSignedClosedDuplicate, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReactionDownvoteDiffParentSignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReactionDownvoteDiffSignerSignedClosed, poolTest
    )).toStrictEqual(false)

    // Action: reply
    expect(await isReactionDuplicate(
      validDmpReplySignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReplySignedClosedDuplicate, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReplyDiffParentSignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReplyDiffSignerSignedClosed, poolTest
    )).toStrictEqual(false)

    // ============
    // Step 2. Check db after inserting 'post' events.
    expect(await insertSpasmEventV2(
      validDmpActionPostSignedClosed, poolTest
    )).toStrictEqual(true)
    expect(await insertSpasmEventV2(
      validDmpActionPostSignedClosedDuplicate, poolTest
    )).toStrictEqual(true)

    // Should return false because all actions 'post' submitted
    // above have no parent IDs, because they are not 'react',
    // 'edit', 'moderate', etc. The current version of function
    // isReactionDuplicate() doesn't mark new posts and other
    // events without parent ID as 'duplicate', which means
    // that users can submit the same post again and again
    // if it has a different Spasm ID, e.g. due to different
    // timestamp.
    // Action: post
    expect(await isReactionDuplicate(
      validDmpActionPostSignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpActionPostSignedClosedDuplicate, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpActionPostDiffSignerSignedClosed, poolTest
    )).toStrictEqual(false)

    // Action: react (upvote)
    expect(await isReactionDuplicate(
      validDmpReactionUpvoteSignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReactionUpvoteSignedClosedDuplicate, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReactionUpvoteDiffParentSignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReactionUpvoteDiffSignerSignedClosed, poolTest
    )).toStrictEqual(false)
    
    // Action: react (downvote)
    expect(await isReactionDuplicate(
      validDmpReactionDownvoteSignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReactionDownvoteSignedClosedDuplicate, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReactionDownvoteDiffParentSignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReactionDownvoteDiffSignerSignedClosed, poolTest
    )).toStrictEqual(false)

    // Action: reply
    expect(await isReactionDuplicate(
      validDmpReplySignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReplySignedClosedDuplicate, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReplyDiffParentSignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReplyDiffSignerSignedClosed, poolTest
    )).toStrictEqual(false)

    // ============
    // Step 3. Check db after inserting one upvote reaction.
    expect(await insertSpasmEventV2(
      validDmpReactionUpvoteSignedClosed, poolTest
    )).toStrictEqual(true)

    // Action: post
    expect(await isReactionDuplicate(
      validDmpActionPostSignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpActionPostSignedClosedDuplicate, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpActionPostDiffSignerSignedClosed, poolTest
    )).toStrictEqual(false)

    // Action: react (upvote)
    expect(await isReactionDuplicate(
      validDmpReactionUpvoteSignedClosed, poolTest
    )).toStrictEqual(true)
    expect(await isReactionDuplicate(
      validDmpReactionUpvoteSignedClosedDuplicate, poolTest
    )).toStrictEqual(true)
    expect(await isReactionDuplicate(
      validDmpReactionUpvoteDiffParentSignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReactionUpvoteDiffSignerSignedClosed, poolTest
    )).toStrictEqual(false)
    
    // Action: react (downvote)
    expect(await isReactionDuplicate(
      validDmpReactionDownvoteSignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReactionDownvoteSignedClosedDuplicate, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReactionDownvoteDiffParentSignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReactionDownvoteDiffSignerSignedClosed, poolTest
    )).toStrictEqual(false)

    // Action: reply
    expect(await isReactionDuplicate(
      validDmpReplySignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReplySignedClosedDuplicate, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReplyDiffParentSignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReplyDiffSignerSignedClosed, poolTest
    )).toStrictEqual(false)

    // ============
    // Step 4. Check db after inserting downvote reaction.
    expect(await insertSpasmEventV2(
      validDmpReactionDownvoteSignedClosed, poolTest
    )).toStrictEqual(true)

    // Action: post
    expect(await isReactionDuplicate(
      validDmpActionPostSignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpActionPostSignedClosedDuplicate, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpActionPostDiffSignerSignedClosed, poolTest
    )).toStrictEqual(false)

    // Action: react (upvote)
    expect(await isReactionDuplicate(
      validDmpReactionUpvoteSignedClosed, poolTest
    )).toStrictEqual(true)
    expect(await isReactionDuplicate(
      validDmpReactionUpvoteSignedClosedDuplicate, poolTest
    )).toStrictEqual(true)
    expect(await isReactionDuplicate(
      validDmpReactionUpvoteDiffParentSignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReactionUpvoteDiffSignerSignedClosed, poolTest
    )).toStrictEqual(false)
    
    // Action: react (downvote)
    expect(await isReactionDuplicate(
      validDmpReactionDownvoteSignedClosed, poolTest
    )).toStrictEqual(true)
    expect(await isReactionDuplicate(
      validDmpReactionDownvoteSignedClosedDuplicate, poolTest
    )).toStrictEqual(true)
    expect(await isReactionDuplicate(
      validDmpReactionDownvoteDiffParentSignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReactionDownvoteDiffSignerSignedClosed, poolTest
    )).toStrictEqual(false)

    // Action: reply
    expect(await isReactionDuplicate(
      validDmpReplySignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReplySignedClosedDuplicate, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReplyDiffParentSignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReplyDiffSignerSignedClosed, poolTest
    )).toStrictEqual(false)

    // ============
    // Step 5. Check db after inserting one reply.
    expect(await insertSpasmEventV2(
      validDmpReplySignedClosed, poolTest
    )).toStrictEqual(true)

    // Action: post
    expect(await isReactionDuplicate(
      validDmpActionPostSignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpActionPostSignedClosedDuplicate, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpActionPostDiffSignerSignedClosed, poolTest
    )).toStrictEqual(false)

    // Action: react (upvote)
    expect(await isReactionDuplicate(
      validDmpReactionUpvoteSignedClosed, poolTest
    )).toStrictEqual(true)
    expect(await isReactionDuplicate(
      validDmpReactionUpvoteSignedClosedDuplicate, poolTest
    )).toStrictEqual(true)
    expect(await isReactionDuplicate(
      validDmpReactionUpvoteDiffParentSignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReactionUpvoteDiffSignerSignedClosed, poolTest
    )).toStrictEqual(false)
    
    // Action: react (downvote)
    expect(await isReactionDuplicate(
      validDmpReactionDownvoteSignedClosed, poolTest
    )).toStrictEqual(true)
    expect(await isReactionDuplicate(
      validDmpReactionDownvoteSignedClosedDuplicate, poolTest
    )).toStrictEqual(true)
    expect(await isReactionDuplicate(
      validDmpReactionDownvoteDiffParentSignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReactionDownvoteDiffSignerSignedClosed, poolTest
    )).toStrictEqual(false)

    // Action: reply
    expect(await isReactionDuplicate(
      validDmpReplySignedClosed, poolTest
    )).toStrictEqual(true)
    expect(await isReactionDuplicate(
      validDmpReplySignedClosedDuplicate, poolTest
    )).toStrictEqual(true)
    expect(await isReactionDuplicate(
      validDmpReplyDiffParentSignedClosed, poolTest
    )).toStrictEqual(false)
    expect(await isReactionDuplicate(
      validDmpReplyDiffSignerSignedClosed, poolTest
    )).toStrictEqual(false)

    // Clean up db table after testing.
    expect(
      await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);

    expect(
      await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)
  });
});

// template()
describe("template() function tests", () => {
  test("should return true if passed true", async () => {
    const input = true;
    const output = true;
    expect(input).toStrictEqual(output);

    // Clean up db table before testing.
    expect(
      await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);

    expect(
      await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)

    expect(await insertSpasmEventV2(
      validDmpEventSignedClosed, poolTest
    )).toStrictEqual(true)

    expect(await isEventBanned(
      validDmpReplySignedClosed, poolTest
    )).toStrictEqual(false)

    expect(
      await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(1)

    // Adding moderate event that bans the previous event,
    // but doesn't not explicitly delete it from db.
    // action: moderate, content: delete
    expect(await insertSpasmEventV2(
      moderateDeleteValidDmpReply, poolTest
    )).toStrictEqual(true)

    expect(
      await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(2)
    
    expect(await spasm.convertToSpasm(
      moderateDeleteValidDmpReply
    )).toStrictEqual(
      moderateDeleteValidDmpReplyConvertedToSpasmEventV2
    )

    expect(await isEventBanned(
      validDmpReplySignedClosed, poolTest
    )).toStrictEqual(true)

    // Deleting the moderation event should
    // unban the original event
    expect(await deleteSpasmEventV2FromDbById(
      moderateDeleteValidDmpReplyConvertedToSpasmEventV2.ids[0].value,
      poolTest
    )).toStrictEqual(true)

    expect(await isEventBanned(
      validDmpReplySignedClosed, poolTest
    )).toStrictEqual(false)

    // Clean up db table after testing.
    expect(
      await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);

    expect(
      await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)
  });
});

// fetchAllSpasmEventsV2ByIds()
describe("fetchAllSpasmEventsV2ByIds() function tests", () => {
  test("should return true if passed true", async () => {
    const input = true;
    const output = true;
    expect(input).toStrictEqual(output);

    // Clean up db table before testing.
    expect(
      await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);

    expect(
      await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)

    expect(
      (
        await fetchAllSpasmEventsV2ByIds(
          [validDmpEventSignedClosedConvertedToSpasmV2.ids[0].value],
          poolTest
        )
      )[0]
    ).toStrictEqual(undefined)

    expect(await insertSpasmEventV2(
      validDmpEventSignedClosed, poolTest
    )).toStrictEqual(true)

    expect(await insertSpasmEventV2(
      moderateDeleteValidDmpReply, poolTest
    )).toStrictEqual(true)

    expect(
      (
        await fetchAllSpasmEventsV2ByIds(
          [
            validDmpEventSignedClosedConvertedToSpasmV2.ids[0].value,
            moderateDeleteValidDmpReplyConvertedToSpasmEventV2.ids[0].value
          ],
          poolTest
        )
      )[1].content
    ).toStrictEqual("delete")

    // Clean up db table after testing.
    expect(
      await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);

    expect(
      await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)
  });
});

// fetchAllSpasmEventsV2ByParentId()
describe("fetchAllSpasmEventsV2ByParentId() tests", () => {
  test("should return true if passed true", async () => {
    const input = true;
    const output = true;
    expect(input).toStrictEqual(output);

    // Clean up db table before testing.
    expect(await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);

    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)

    // tests here
    expect(await insertSpasmEventV2(
      validDmpEventSignedClosed, poolTest
    )).toStrictEqual(true)

    expect((await fetchSpasmEventV2ById(
      validDmpEventSignedClosed.signature, poolTest
    )).title).toStrictEqual("genesis")

    expect(await insertSpasmEventV2(
      validDmpReactionUpvoteSignedClosed, poolTest
    )).toStrictEqual(true)

    expect((await fetchAllSpasmEventsV2ByParentId(
      validDmpEventSignedClosed.signature, poolTest
    ))[0].content).toStrictEqual("upvote")

    expect(await insertSpasmEventV2(
      validDmpReactionDownvoteSignedClosed, poolTest
    )).toStrictEqual(true)

    expect((await fetchAllSpasmEventsV2ByParentId(
      validDmpEventSignedClosed.signature, poolTest
    ))[1].content).toStrictEqual("downvote")

    // Clean up db table after testing.
    expect(await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);

    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)
  });
});

// applySpasmEventReactionV2()
describe("applySpasmEventReactionV2() function tests", () => {
  test("should return true if passed true", async () => {
    const input = true;
    const output = true;
    expect(input).toStrictEqual(output);

    // Clean up db table before testing.
    expect(await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);

    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)

    // tests here
    expect(await insertSpasmEventV2(
      validDmpEventSignedClosed, poolTest
    )).toStrictEqual(true)

    const genesisBeforeAnything = await fetchSpasmEventV2ById(
      validDmpEventSignedClosed.signature, poolTest
    )
    expect(
      genesisBeforeAnything?.title
    ).toStrictEqual("genesis")
    expect(
      genesisBeforeAnything?.stats
    ).toStrictEqual(undefined)
    expect(
      genesisBeforeAnything?.stats?.length
    ).toStrictEqual(undefined)
    expect(
      genesisBeforeAnything?.stats?.[0].action
    ).toStrictEqual(undefined)
    expect(
      genesisBeforeAnything?.stats?.[0].total
    ).toStrictEqual(undefined)
    expect(
      genesisBeforeAnything?.stats?.[0].latestTimestamp
    ).toStrictEqual(undefined)
    expect(
      genesisBeforeAnything?.stats?.[0].latestDbTimestamp
    ).toStrictEqual(undefined)
    expect(
      genesisBeforeAnything?.stats?.[0].contents?.length
    ).toStrictEqual(undefined)
    expect(
      genesisBeforeAnything?.stats?.[0].contents?.[0].total
    ).toStrictEqual(undefined)

    // Unsigned events shouldn't be counted
    expect(await incrementSpasmEventActionV2(
      validDmpReactionUpvote, poolTest
    )).toStrictEqual(false)

    // Events with invalid signatures shouldn't be counted
    expect(await incrementSpasmEventActionV2(
      invalidDmpReactionUpvoteSignedClosedWrongSignature, poolTest
    )).toStrictEqual(false)

    const genesisAfterFailedIncrements = await fetchSpasmEventV2ById(
      validDmpEventSignedClosed.signature, poolTest
    )
    expect(
      genesisAfterFailedIncrements?.title
    ).toStrictEqual("genesis")
    expect(
      genesisAfterFailedIncrements?.stats
    ).toStrictEqual(undefined)

    // Add one upvote
    expect(await incrementSpasmEventActionV2(
      validDmpReactionUpvoteSignedClosed, poolTest
    )).toStrictEqual(true)
    const genesisAfterUpvote = await fetchSpasmEventV2ById(
      validDmpEventSignedClosed.signature, poolTest
    )
    expect(
      genesisAfterUpvote?.stats?.length
    ).toStrictEqual(1)
    expect(
      genesisAfterUpvote?.stats?.[0].action
    ).toStrictEqual("react")
    expect(
      genesisAfterUpvote?.stats?.[0].total
    ).toStrictEqual(1)
    expect(
      typeof(genesisAfterUpvote?.stats?.[0].latestTimestamp)
    ).toStrictEqual("number")
    expect(
      genesisAfterUpvote?.stats?.[0].latestTimestamp
    ).toStrictEqual(
      validDmpReactionUpvoteSignedClosedConvertedToSpasmEventV2
        .timestamp
    )
    // expect(
    //   typeof(genesisAfterUpvote?.stats?.[0].latestDbTimestamp)
    // ).toStrictEqual("number")
    expect(
      genesisAfterUpvote?.stats?.[0].contents?.length
    ).toStrictEqual(1)
    expect(
      genesisAfterUpvote?.stats?.[0].contents?.[0].value
    ).toStrictEqual("upvote")
    expect(
      genesisAfterUpvote?.stats?.[0].contents?.[0].total
    ).toStrictEqual(1)

    // Add one more upvote
    expect(await incrementSpasmEventActionV2(
      validDmpReactionUpvoteDiffSignerSignedClosed, poolTest
    )).toStrictEqual(true)
    const genesisAfterUpvoteUpvote = await fetchSpasmEventV2ById(
      validDmpEventSignedClosed.signature, poolTest
    )
    expect(
      genesisAfterUpvoteUpvote?.stats?.length
    ).toStrictEqual(1)
    expect(
      genesisAfterUpvoteUpvote?.stats?.[0].action
    ).toStrictEqual("react")
    expect(
      genesisAfterUpvoteUpvote?.stats?.[0].total
    ).toStrictEqual(2)
    expect(
      typeof(genesisAfterUpvote?.stats?.[0].latestTimestamp)
    ).toStrictEqual("number")
    expect(
      genesisAfterUpvoteUpvote?.stats?.[0].latestTimestamp
    ).toStrictEqual(
      validDmpReactionUpvoteDiffSignerSignedClosedConvertedToSpasmEventV2
        .timestamp
    )
    expect(
      genesisAfterUpvoteUpvote?.stats?.[0].contents?.length
    ).toStrictEqual(1)
    expect(
      genesisAfterUpvoteUpvote?.stats?.[0].contents?.[0].value
    ).toStrictEqual("upvote")
    expect(
      genesisAfterUpvoteUpvote?.stats?.[0].contents?.[0].total
    ).toStrictEqual(2)

    // Add one downvote
    expect(await incrementSpasmEventActionV2(
      validDmpReactionDownvoteSignedClosed, poolTest
    )).toStrictEqual(true)
    const genesisAfterUpUpDown = await fetchSpasmEventV2ById(
      validDmpEventSignedClosed.signature, poolTest
    )
    expect(
      genesisAfterUpUpDown?.stats?.length
    ).toStrictEqual(1)
    expect(
      genesisAfterUpUpDown?.stats?.[0].action
    ).toStrictEqual("react")
    expect(
      genesisAfterUpUpDown?.stats?.[0].total
    ).toStrictEqual(3)
    expect(
      genesisAfterUpUpDown?.stats?.[0].contents?.length
    ).toStrictEqual(2)
    expect(
      genesisAfterUpvote?.stats?.[0].contents?.[0].value
    ).toStrictEqual("upvote")
    expect(
      genesisAfterUpUpDown?.stats?.[0].contents?.[0].total
    ).toStrictEqual(2)
    expect(
      genesisAfterUpUpDown?.stats?.[0].contents?.[1].value
    ).toStrictEqual("downvote")
    expect(
      genesisAfterUpUpDown?.stats?.[0].contents?.[1].total
    ).toStrictEqual(1)

    // Add one reply
    expect(await incrementSpasmEventActionV2(
      validDmpReplySignedClosed, poolTest
    )).toStrictEqual(true)
    const genesisAfterUpUpDownReply =
      await fetchSpasmEventV2ById(
      validDmpEventSignedClosed.signature, poolTest
    )
    expect(
      genesisAfterUpUpDownReply?.stats?.length
    ).toStrictEqual(2)
    expect(
      genesisAfterUpUpDownReply?.stats?.[0].action
    ).toStrictEqual("react")
    expect(
      genesisAfterUpUpDownReply?.stats?.[0].total
    ).toStrictEqual(3)
    expect(
      genesisAfterUpUpDownReply?.stats?.[0].contents?.length
    ).toStrictEqual(2)
    expect(
      genesisAfterUpUpDownReply?.stats?.[0].contents?.[0].value
    ).toStrictEqual("upvote")
    expect(
      genesisAfterUpUpDownReply?.stats?.[0].contents?.[0].total
    ).toStrictEqual(2)
    expect(
      genesisAfterUpUpDownReply?.stats?.[0].contents?.[1].value
    ).toStrictEqual("downvote")
    expect(
      genesisAfterUpUpDownReply?.stats?.[0].contents?.[1].total
    ).toStrictEqual(1)
    expect(
      genesisAfterUpUpDownReply?.stats?.[1].action
    ).toStrictEqual("reply")
    expect(
      genesisAfterUpUpDownReply?.stats?.[1].total
    ).toStrictEqual(1)

    // Add one more reply
    expect(await incrementSpasmEventActionV2(
      validDmpReplyDiffSignerSignedClosed, poolTest
    )).toStrictEqual(true)
    const genesisAfterUpUpDownReplyReply =
      await fetchSpasmEventV2ById(
      validDmpEventSignedClosed.signature, poolTest
    )
    expect(
      genesisAfterUpUpDownReplyReply?.stats?.length
    ).toStrictEqual(2)
    expect(
      genesisAfterUpUpDownReplyReply?.stats?.[0].action
    ).toStrictEqual("react")
    expect(
      genesisAfterUpUpDownReplyReply?.stats?.[0].total
    ).toStrictEqual(3)
    expect(
      genesisAfterUpUpDownReplyReply?.stats?.[0].contents?.length
    ).toStrictEqual(2)
    expect(
      genesisAfterUpUpDownReplyReply?.stats?.[0].contents?.[0].value
    ).toStrictEqual("upvote")
    expect(
      genesisAfterUpUpDownReplyReply?.stats?.[0].contents?.[0].total
    ).toStrictEqual(2)
    expect(
      genesisAfterUpUpDownReplyReply?.stats?.[0].contents?.[1].value
    ).toStrictEqual("downvote")
    expect(
      genesisAfterUpUpDownReplyReply?.stats?.[0].contents?.[1].total
    ).toStrictEqual(1)
    expect(
      genesisAfterUpUpDownReplyReply?.stats?.[1].action
    ).toStrictEqual("reply")
    expect(
      genesisAfterUpUpDownReplyReply?.stats?.[1].total
    ).toStrictEqual(2)

    // Clean up db table after testing.
    expect(await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);

    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)
  });
});

// incrementSpasmEventStats()
describe("incrementSpasmEventStats() tests", () => {
  test("should return true if passed true", async () => {
    const input = true;
    const output = true;
    expect(input).toStrictEqual(output);

    // Clean up db table before testing.
    expect(await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);

    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)

    // tests here

    // Clean up db table after testing.
    expect(await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);

    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)
  });
});

// template()
describe("template() function tests", () => {
  test("should return true if passed true", async () => {
    const input = true;
    const output = true;
    expect(input).toStrictEqual(output);

    // Clean up db table before testing.
    expect(await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);

    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)

    // tests here

    // Clean up db table after testing.
    expect(await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);

    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)
  });
});
