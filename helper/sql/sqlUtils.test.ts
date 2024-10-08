import {
  howManyEntriesInTable
} from '../../db/dbUtils';
import {copyOf, copyWithoutDbStats, isObjectWithValues, withoutDbStats} from '../utils/utils';
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
  // validDmpReactionUpvoteDiffParentSignedClosedConvertedToSpasmEventV2,
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
  validSpasmEventRssItemV0ConvertedToSpasmV2,
  validDmpReply,
  validPostWithNostrReplyToDmpEventConvertedToSpasmV2,
  validSpasmWithDmpReplyToDmpEventV0ConvertedToSpasmEventV2,
  validDmpEventSignedClosedConvertedToSpasmV2WithTwoChildren,
  childOfGenesisDepth1Branch1Author1ReplySpasmEventV2,
  childOfGenesisDepth2Branch1Author2ReplySpasmEventV2,
  childOfGenesisDepth3Branch1Author1ReplySpasmEventV2,
  childOfGenesisDepth4Branch1Author2ReplySpasmEventV2,
  childOfGenesisDepth5Branch1Author1ReplySpasmEventV2,
  childOfGenesisDepth6Branch1Author2ReplySpasmEventV2,
  childOfGenesisDepth7Branch1Author1ReplySpasmEventV2,
  childOfGenesisDepth8Branch1Author2ReplySpasmEventV2,
  childOfGenesisDepth9Branch1Author1ReplySpasmEventV2,
  childOfGenesisDepth10Branch1Author2ReplySpasmEventV2,
  childOfGenesisDepth11Branch1Author1ReplySpasmEventV2,
  childOfGenesisDepth12Branch1Author2ReplySpasmEventV2
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
  fetchAllSpasmEventsV2ByParentIds,
  fetchAllSpasmEventsV2BySigner,
  fetchEventWithSameSpasmIdFromDbV2,
  fetchSpasmEventV2ById,
  fetchAllSpasmEventsV2ByShortId,
  incrementSpasmEventActionV2,
  insertSpasmEventV2,
  isEventBanned,
  isReactionDuplicate,
  fetchSpasmEventV2ByShortId,
  fetchCommentsByParentId,
  fetchAllReactionsByParentId,
  fetchAllCommentsByParentId,
  fetchAllReactionsByParentIds,
  fetchCommentsByParentIds,
  fetchAllModerationsByParentIds,
  fetchAllModerationsByParentId,
  fetchAndAddCommentsToEvent,
  fetchAndAddCommentsRecursively,
  buildTreeDown
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

    expect((await fetchAllSpasmEventsV2ByIds(
      [
        validDmpEventSignedClosedConvertedToSpasmV2.ids[0].value,
        moderateDeleteValidDmpReplyConvertedToSpasmEventV2.ids[0].value
      ], poolTest
    ))[1].content).toStrictEqual("delete")

    // Short IDs
    expect((await fetchAllSpasmEventsV2ByShortId(
      // Full
      moderateDeleteValidDmpReplyConvertedToSpasmEventV2.ids[0].value,
      poolTest
    ))[0].content).toStrictEqual("delete")

    expect((await fetchAllSpasmEventsV2ByShortId(
      // Full
      moderateDeleteValidDmpReplyConvertedToSpasmEventV2.ids[1].value,
      poolTest
    ))[0].content).toStrictEqual("delete")

    expect((await fetchAllSpasmEventsV2ByShortId(
      // Short
      moderateDeleteValidDmpReplyConvertedToSpasmEventV2.ids[0].value.toString().slice(0,20),
      poolTest
    ))[0].content).toStrictEqual("delete")

    expect((await fetchAllSpasmEventsV2ByShortId(
      // Short
      moderateDeleteValidDmpReplyConvertedToSpasmEventV2.ids[1].value.toString().slice(0,20),
      poolTest
    ))[0].content).toStrictEqual("delete")

    expect((await fetchAllSpasmEventsV2ByShortId(
      // Invalid
      moderateDeleteValidDmpReplyConvertedToSpasmEventV2.ids[0].value.toString().slice(0,19) + 'a',
      poolTest
    ))).toStrictEqual([])

    expect((await fetchAllSpasmEventsV2ByShortId(
      // Too short
      moderateDeleteValidDmpReplyConvertedToSpasmEventV2.ids[1].value.toString().slice(0,14),
      poolTest
    ))).toStrictEqual(null)

    expect((await fetchSpasmEventV2ByShortId(
      validDmpEventSignedClosedConvertedToSpasmV2.ids[0].value.toString().slice(0,20),
      poolTest
    )).title).toStrictEqual("genesis")

    expect((await fetchSpasmEventV2ByShortId(
      moderateDeleteValidDmpReplyConvertedToSpasmEventV2.ids[1].value.toString().slice(0,20),
      poolTest
    )).content).toStrictEqual("delete")

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
// fetchAllSpasmEventsV2ByParentIds()
describe("fetchAllSpasmEventsV2ByParentId() and fetchAllSpasmEventsV2ByParentIds() tests", () => {
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

    // Single parent ID
    expect((await fetchAllSpasmEventsV2ByParentId(
      validDmpEventSignedClosed.signature, poolTest
    ))[0].content).toStrictEqual("upvote")

    expect((await fetchAllSpasmEventsV2ByParentId(
      null, poolTest
    ))).toStrictEqual(null)

    // action: "any"
    expect((await fetchAllSpasmEventsV2ByParentId(
      validDmpEventSignedClosed.signature, poolTest, "any"
    ))[0].content).toStrictEqual("upvote")

    // action: "react"
    expect((await fetchAllSpasmEventsV2ByParentId(
      validDmpEventSignedClosed.signature, poolTest, "react"
    ))[0].content).toStrictEqual("upvote")

    // alias
    expect((await fetchAllReactionsByParentId(
      validDmpEventSignedClosed.signature, poolTest
    ))[0].content).toStrictEqual("upvote")

    // action: "reply"
    expect((await fetchAllSpasmEventsV2ByParentId(
      validDmpEventSignedClosed.signature, poolTest, "reply"
    )).length).toStrictEqual(0)

    // alias
    expect((await fetchCommentsByParentId(
      validDmpEventSignedClosed.signature, poolTest
    )).length).toStrictEqual(0)

    expect(await insertSpasmEventV2(
      validDmpReactionDownvoteSignedClosed, poolTest
    )).toStrictEqual(true)

    expect((await fetchAllSpasmEventsV2ByParentId(
      validDmpEventSignedClosed.signature, poolTest
    ))[1].content).toStrictEqual("downvote")

    // Multiple parent IDs
    expect((await fetchAllSpasmEventsV2ByParentIds(
      [validDmpEventSignedClosed.signature], poolTest
    ))[0].authors[0].addresses[0].value).not.toEqual(null)

    expect((await fetchAllSpasmEventsV2ByParentIds(
      [validDmpEventSignedClosed.signature], poolTest
    ))[0].authors[0].addresses[0].value).toStrictEqual(
      validDmpReactionUpvoteSignedClosedConvertedToSpasmEventV2
        .authors[0].addresses[0].value
    )

    expect((await fetchAllSpasmEventsV2ByParentIds(
      [validDmpEventSignedClosed.signature], poolTest
    ))[1].authors[0].addresses[0].value).toStrictEqual(
      spasm.convertToSpasm(
        validDmpReactionDownvoteSignedClosed
      ).authors[0].addresses[0].value
    )

    expect(await insertSpasmEventV2(
      validDmpReplySignedClosed, poolTest
    )).toStrictEqual(true)

    expect((await fetchAllCommentsByParentId(
      validDmpEventSignedClosed.signature, poolTest
    ))[0].content).toStrictEqual("new comment")

    expect((await fetchAllSpasmEventsV2ByParentIds(
      [validDmpEventSignedClosed.signature], poolTest
    ))[2].authors[0].addresses[0].value).toStrictEqual(
      spasm.convertToSpasm(validDmpReplySignedClosed)
        .authors[0].addresses[0].value
    )

    // Simply inserting moderation event doesn't delete any event
    expect(await insertSpasmEventV2(
      moderateDeleteValidDmpReply, poolTest
    )).toStrictEqual(true)

    expect((await fetchAllSpasmEventsV2ByParentIds(
      [
        validDmpEventSignedClosed.signature,
        validDmpReplySignedClosed.signature
      ], poolTest
    ))[3].authors[0].addresses[0].value).toStrictEqual(
      spasm.convertToSpasm(moderateDeleteValidDmpReply)
        .authors[0].addresses[0].value
    )

    // action: "any"
    expect((await fetchAllSpasmEventsV2ByParentIds(
      [
        validDmpEventSignedClosed.signature,
        validDmpReplySignedClosed.signature
      ], poolTest, "any"
    ))[3].authors[0].addresses[0].value).toStrictEqual(
      spasm.convertToSpasm(moderateDeleteValidDmpReply)
        .authors[0].addresses[0].value
    )

    expect((await fetchAllSpasmEventsV2ByParentIds(
      [
        validDmpEventSignedClosed.signature,
        validDmpReplySignedClosed.signature
      ], poolTest
    )).length).toStrictEqual(4)

    expect((await fetchAllSpasmEventsV2ByParentIds(
      [
        validDmpEventSignedClosed.signature,
        validDmpReplySignedClosed.signature
      ], poolTest, "any"
    )).length).toStrictEqual(4)

    // action: "react"
    expect((await fetchAllSpasmEventsV2ByParentIds(
      [
        validDmpEventSignedClosed.signature,
        validDmpReplySignedClosed.signature
      ], poolTest, "react"
    )).length).toStrictEqual(2)

    // alias
    expect((await fetchAllReactionsByParentIds(
      [
        validDmpEventSignedClosed.signature,
        validDmpReplySignedClosed.signature
      ], poolTest
    )).length).toStrictEqual(2)

    // action: "reply"
    expect((await fetchAllSpasmEventsV2ByParentIds(
      [
        validDmpEventSignedClosed.signature,
        validDmpReplySignedClosed.signature
      ], poolTest, "reply"
    )).length).toStrictEqual(1)

    // alias
    expect((await fetchCommentsByParentIds(
      [
        validDmpEventSignedClosed.signature,
        validDmpReplySignedClosed.signature
      ], poolTest
    )).length).toStrictEqual(1)

    // action: "moderate"
    expect((await fetchAllSpasmEventsV2ByParentIds(
      [
        validDmpEventSignedClosed.signature,
        validDmpReplySignedClosed.signature
      ], poolTest, "moderate"
    )).length).toStrictEqual(1)

    expect((await fetchAllSpasmEventsV2ByParentIds(
      [
        validDmpEventSignedClosed.signature,
        validDmpReplySignedClosed.signature
      ], poolTest, "moderate"
    ))[0].content).toStrictEqual("delete")

    // alias
    expect((await fetchAllModerationsByParentId(
      validDmpReplySignedClosed.signature, poolTest
    ))[0].content).toStrictEqual("delete")

    expect((await fetchAllModerationsByParentIds(
      [
        validDmpEventSignedClosed.signature,
        validDmpReplySignedClosed.signature
      ], poolTest
    ))[0].content).toStrictEqual("delete")

    expect((await fetchAllSpasmEventsV2ByParentIds(
      [
        validDmpEventSignedClosed.signature,
        validDmpReplySignedClosed.signature
      ], poolTest, "moderate"
    ))[0].authors[0].addresses[0].value).toStrictEqual(
      spasm.convertToSpasm(moderateDeleteValidDmpReply)
        .authors[0].addresses[0].value
    )

    // action: "admin"
    expect((await fetchAllSpasmEventsV2ByParentIds(
      [
        validDmpEventSignedClosed.signature,
        validDmpReplySignedClosed.signature
      ], poolTest, "admin"
    )).length).toStrictEqual(0)

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

// Tree
describe("Tests for different tree-related functions", () => {
  test("Tests for comments", async () => {
    // Clean up db table before testing.
    expect(await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);

    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)

    expect(await insertSpasmEventV2(
      copyOf(validDmpEventSignedClosed), poolTest
    )).toStrictEqual(true)

    expect(await insertSpasmEventV2(
      copyOf(validPostWithNostrReplyToDmpEventConvertedToSpasmV2), poolTest
    )).toStrictEqual(true)

    expect(await insertSpasmEventV2(
      copyOf(validSpasmWithDmpReplyToDmpEventV0ConvertedToSpasmEventV2), poolTest
    )).toStrictEqual(true)

    expect(await howManyEntriesInTable(
      "spasm_events", poolTest
    )).toStrictEqual(3)

    // Cannot compare with the whole event because of
    // different db and stats values.
    const eventWithComments = await fetchAndAddCommentsToEvent(
      copyOf(validDmpEventSignedClosedConvertedToSpasmV2),
      poolTest
    )
    eventWithComments.db = {}
    eventWithComments.stats = []
    eventWithComments.children[0].event.db = {}
    eventWithComments.children[0].event.stats = []
    eventWithComments.children[1].event.db = {}
    eventWithComments.children[1].event.stats = []
    const outputWithoutDb = copyOf(
      validDmpEventSignedClosedConvertedToSpasmV2WithTwoChildren
    )
    outputWithoutDb.db = {}
    outputWithoutDb.stats = []
    outputWithoutDb.children[0].event.db = {}
    outputWithoutDb.children[0].event.stats = []
    outputWithoutDb.children[1].event.db = {}
    outputWithoutDb.children[1].event.stats = []
    expect(eventWithComments).toStrictEqual(outputWithoutDb)

    // Clean up db table after testing.
    expect(await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);

    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)
  });

  test("Tests for comments", async () => {
    // Clean up db table before testing.
    expect(await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);

    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)

    expect(await insertSpasmEventV2(
      copyOf(childOfGenesisDepth1Branch1Author1ReplySpasmEventV2),
      poolTest)).toStrictEqual(true)

    expect(await insertSpasmEventV2(
      copyOf(childOfGenesisDepth2Branch1Author2ReplySpasmEventV2),
      poolTest)).toStrictEqual(true)

    expect(await insertSpasmEventV2(
      copyOf(childOfGenesisDepth3Branch1Author1ReplySpasmEventV2),
      poolTest)).toStrictEqual(true)

    expect(await insertSpasmEventV2(
      copyOf(childOfGenesisDepth4Branch1Author2ReplySpasmEventV2),
      poolTest)).toStrictEqual(true)

    expect(await insertSpasmEventV2(
      copyOf(childOfGenesisDepth5Branch1Author1ReplySpasmEventV2),
      poolTest)).toStrictEqual(true)

    expect(await insertSpasmEventV2(
      copyOf(childOfGenesisDepth6Branch1Author2ReplySpasmEventV2),
      poolTest)).toStrictEqual(true)

    expect(await insertSpasmEventV2(
      copyOf(childOfGenesisDepth7Branch1Author1ReplySpasmEventV2),
      poolTest)).toStrictEqual(true)

    expect(await insertSpasmEventV2(
      copyOf(childOfGenesisDepth8Branch1Author2ReplySpasmEventV2),
      poolTest)).toStrictEqual(true)

    expect(await insertSpasmEventV2(
      copyOf(childOfGenesisDepth9Branch1Author1ReplySpasmEventV2),
      poolTest)).toStrictEqual(true)

    expect(await insertSpasmEventV2(
      copyOf(childOfGenesisDepth10Branch1Author2ReplySpasmEventV2),
      poolTest)).toStrictEqual(true)

    expect(await insertSpasmEventV2(
      copyOf(childOfGenesisDepth11Branch1Author1ReplySpasmEventV2),
      poolTest)).toStrictEqual(true)

    expect(await insertSpasmEventV2(
      copyOf(childOfGenesisDepth12Branch1Author2ReplySpasmEventV2),
      poolTest)).toStrictEqual(true)

    const genesisWithCommentsMaxDepthDefault =
      await fetchAndAddCommentsRecursively(
      copyOf(validDmpEventSignedClosedConvertedToSpasmV2),
      poolTest
    )
    
    // Default recursion max depth is 10
    const genesisChildReplyDepth10 = 
      genesisWithCommentsMaxDepthDefault
       .children[0].event.children[0].event
       .children[0].event.children[0].event
       .children[0].event.children[0].event
       .children[0].event.children[0].event
       .children[0].event.children[0].event

    expect(isObjectWithValues(genesisChildReplyDepth10)
    ).toStrictEqual(true)

    expect(copyOf(genesisChildReplyDepth10).type
    ).toStrictEqual("SpasmEventV2")

    expect(copyOf(genesisChildReplyDepth10).content
    ).toStrictEqual(
      "reply to genesis depth 10, branch 1, author 2"
    )

    expect(copyOf(genesisChildReplyDepth10).children
    ).toStrictEqual(undefined)

    expect(copyOf(genesisChildReplyDepth10).children
    ).toStrictEqual(undefined)

    expect(copyWithoutDbStats(genesisChildReplyDepth10)
    ).toStrictEqual(copyWithoutDbStats(
      childOfGenesisDepth10Branch1Author2ReplySpasmEventV2
    ))

    // convertToSpasm should not remove any children
    const genesisWithCommentsMaxDepthDefaultConvertedToSpasmEventV2 =
      spasm.convertToSpasm(genesisWithCommentsMaxDepthDefault)

    const genesisChildReplyDepth10OfConvertedToSpasmEventV2 = 
      genesisWithCommentsMaxDepthDefaultConvertedToSpasmEventV2
       .children[0].event.children[0].event
       .children[0].event.children[0].event
       .children[0].event.children[0].event
       .children[0].event.children[0].event
       .children[0].event.children[0].event

    expect(copyOf(genesisChildReplyDepth10OfConvertedToSpasmEventV2).type
    ).toStrictEqual("SpasmEventV2")

    expect(copyOf(genesisChildReplyDepth10OfConvertedToSpasmEventV2).content
    ).toStrictEqual(
      "reply to genesis depth 10, branch 1, author 2"
    )

    expect(copyWithoutDbStats(genesisChildReplyDepth10OfConvertedToSpasmEventV2)
    ).toStrictEqual(copyWithoutDbStats(
      childOfGenesisDepth10Branch1Author2ReplySpasmEventV2
    ))

    const genesisWithCommentsMaxDepthDefaultConvertedToSpasmEventEnvelopeV2 =
      spasm.convertToSpasmEventEnvelope(
        genesisWithCommentsMaxDepthDefault, "2.0.0"
    )
    expect(copyOf(genesisWithCommentsMaxDepthDefaultConvertedToSpasmEventEnvelopeV2).type
    ).toStrictEqual("SpasmEventEnvelopeV2")
    // Event doesn't have attached comments because all relatives
    // are dropped when converting to Envelope without tree.
    expect("children" in (copyOf(
      genesisWithCommentsMaxDepthDefaultConvertedToSpasmEventEnvelopeV2)
    )).toStrictEqual(false)

    const genesisWithCommentsMaxDepthDefaultConvertedToSpasmEventEnvelopeWithTreeV2 =
      spasm.convertToSpasmEventEnvelopeWithTree(
        genesisWithCommentsMaxDepthDefault, "2.0.0"
    )
    expect("children" in (copyOf(
      genesisWithCommentsMaxDepthDefaultConvertedToSpasmEventEnvelopeWithTreeV2)
    )).toStrictEqual(true)
    expect(copyOf(
      genesisWithCommentsMaxDepthDefaultConvertedToSpasmEventEnvelopeWithTreeV2
    )
      .children[0].event.children[0].event
      .children[0].event.children[0].event
      .children[0].event.children[0].event
      .children[0].event.children[0].event
      .children[0].event.children[0].event.type
    ).toStrictEqual("SpasmEventEnvelopeWithTreeV2")
    expect(copyOf(
      genesisWithCommentsMaxDepthDefaultConvertedToSpasmEventEnvelopeWithTreeV2
    )
      .children[0].event.children[0].event
      .children[0].event.children[0].event
      .children[0].event.children[0].event
      .children[0].event.children[0].event
      .children[0].event.children[0].event.content
    ).toStrictEqual(undefined)
    expect(copyOf(
      genesisWithCommentsMaxDepthDefaultConvertedToSpasmEventEnvelopeWithTreeV2
    )
      .children[0].event.children[0].event
      .children[0].event.children[0].event
      .children[0].event.children[0].event
      .children[0].event.children[0].event
      .children[0].event.children[0].event.ids
    ).toStrictEqual(copyOf(
      childOfGenesisDepth10Branch1Author2ReplySpasmEventV2.ids
    ))

    expect(copyOf(genesisWithCommentsMaxDepthDefaultConvertedToSpasmEventEnvelopeV2).type
    ).toStrictEqual("SpasmEventEnvelopeV2")
    // Event doesn't have attached comments because all relatives
    // are dropped when converting to Envelope without tree.
    expect("children" in (copyOf(
      genesisWithCommentsMaxDepthDefaultConvertedToSpasmEventEnvelopeV2)
    )).toStrictEqual(false)

    const genesisChildReplyDepth10OfConvertedToSpasmEventEnvelopeWithTreeV2 = 
      genesisWithCommentsMaxDepthDefaultConvertedToSpasmEventEnvelopeWithTreeV2
       .children[0].event.children[0].event
       .children[0].event.children[0].event
       .children[0].event.children[0].event
       .children[0].event.children[0].event
       .children[0].event.children[0].event

    expect(copyOf(genesisChildReplyDepth10OfConvertedToSpasmEventEnvelopeWithTreeV2).type
    ).toStrictEqual("SpasmEventEnvelopeWithTreeV2")
    // Event with depth 10 doesn't have any attached comments
    // because it was the last fetched event of default maxDepth.
    expect("children" in (copyOf(
      genesisChildReplyDepth10OfConvertedToSpasmEventEnvelopeWithTreeV2)
    )).toStrictEqual(false)


    // buildTreeDown()
    const childOfGenesisDepth2WithCommentsMaxDepthDefault =
      await buildTreeDown(
      copyOf(childOfGenesisDepth2Branch1Author2ReplySpasmEventV2),
      poolTest
    )

    const genesisChildReplyDepth12 = 
      childOfGenesisDepth2WithCommentsMaxDepthDefault
       .children[0].event.children[0].event
       .children[0].event.children[0].event
       .children[0].event.children[0].event
       .children[0].event.children[0].event
       .children[0].event.children[0].event

    expect(copyOf(genesisChildReplyDepth12).content
    ).toStrictEqual(
      "reply to genesis depth 12, branch 1, author 2"
    )

    const genesisWithCommentsMaxDepth1 =
      await buildTreeDown(
      copyOf(validDmpEventSignedClosedConvertedToSpasmV2),
      poolTest, 1
    )

    expect(copyOf(genesisWithCommentsMaxDepth1)
     .children[0].event.content
    ).toStrictEqual(
      "reply to genesis depth 1, branch 1, author 1"
    )

    expect(copyOf(genesisWithCommentsMaxDepth1)
     .children[0].event.children
    ).toStrictEqual(undefined)

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
