import {poolTest} from "../../db";
import {
  howManyEntriesInTable,
} from "../../db/dbUtils";
import {ConfigForSubmitSpasmEvent} from "../../types/interfaces";
import {
  moderateDeleteValidDmpReply,
  moderateDeleteValidDmpReplyConvertedToSpasmEventV2,
  validDmpActionPostWithMaliciousHtmlTagsSignedClosed,
  validDmpActionPostWithValidHtmlTagsSignedClosed,
  validDmpActionPostWithValidMarkdownSignedClosed,
  validDmpEventSignedClosed,
  validDmpReactionDownvoteSignedClosed,
  validDmpReactionUpvoteDiffSignerSignedClosed,
  validDmpReactionUpvoteDiffSignerSignedClosedConvertedToSpasmEventV2,
  validDmpReactionUpvoteSignedClosed,
  validDmpReactionUpvoteSignedClosedConvertedToSpasmEventV2,
  validDmpReactionUpvoteSignedClosedDuplicate,
  validDmpReplySignedClosed,
  validNostrSpasmModerateEvent,
  validPostWithRssItem,
  validRssItemWithEmoji,
} from "../_tests/_events-data";
import {
  cleanDbTable,
  deleteSpasmEventV2FromDbById,
  fetchEventWithSameSpasmIdFromDbV2,
  fetchSpasmEventV2ById,
} from "./sqlUtils";
import {
  submitSpasmEvent,
} from "./submitSpasmEvent";

const configEverythingDisabled: ConfigForSubmitSpasmEvent = {
  htmlTags: { allowed: false },
  eventsWithoutSignature: { allowed: false },
  web3: {
    signature: {
      ethereum: { enabled: false },
      nostr: { enabled: false }
    },
    action: {
      all: { enabled: false },
      post: { enabled: false },
      react: { enabled: false },
      reply: { enabled: false },
      moderate: { enabled: false }
    }
  },
  whitelist: {
    action: {
      post: { enabled: false, list: [] },
      react: { enabled: false, list: [] },
      reply: { enabled: false, list: [] },
    }
  },
  moderation: {
    enabled: false,
    list: []
  },
  admin: {
    enabled: false,
    list: []
  },
  appConfig: {
    changes: {
      allowed: false,
      allowedByAdmin: false
    }
  }
}

// many tests
describe("multiple tests for submitSpasmEvent", () => {
  test("multiple tests", async () => {
    // Clean up db table before testing.
    expect(await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);

    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)

    // const customConfigEthereumDisabled = {
    //   web3: { signature: { ethereum: { enabled: false } } }
    // }
    // Making a deep copy to avoid changing the original config
    const customConfig: ConfigForSubmitSpasmEvent =
      JSON.parse(JSON.stringify(configEverythingDisabled));

    // env variable ENABLE_NEW_WEB3_ACTIONS_ALL
    expect(await submitSpasmEvent(
      validDmpEventSignedClosed,
      poolTest,
      customConfig
    )).toStrictEqual("ERROR: submitting all new web3 actions is currently disabled")

    customConfig.web3.action.all.enabled = true

    // Actual tests start here
    // env variable ENABLE_NEW_ETHEREUM_ACTIONS_ALL
    expect(await submitSpasmEvent(
      validDmpEventSignedClosed,
      poolTest,
      customConfig
    )).toStrictEqual("ERROR: submitting all new Ethereum actions is currently disabled")

    // env variable ENABLE_NEW_NOSTR_ACTIONS_ALL
    expect(await submitSpasmEvent(
      validNostrSpasmModerateEvent,
      poolTest,
      customConfig
    )).toStrictEqual("ERROR: submitting all new Nostr actions is currently disabled")

    customConfig.web3.signature.ethereum.enabled = true

    // env variable ENABLE_NEW_WEB3_ACTIONS_POST
    expect(await submitSpasmEvent(
      validDmpEventSignedClosed,
      poolTest,
      customConfig
    )).toStrictEqual("ERROR: submitting new posts is currently disabled")

    // env variable ENABLE_NEW_WEB3_ACTIONS_REACT
    expect(await submitSpasmEvent(
      validDmpReactionUpvoteSignedClosed,
      poolTest,
      customConfig
    )).toStrictEqual("ERROR: submitting new reactions is currently disabled")

    // env variable ENABLE_NEW_WEB3_ACTIONS_REPLY
    expect(await submitSpasmEvent(
      validDmpReplySignedClosed,
      poolTest,
      customConfig
    )).toStrictEqual("ERROR: submitting new replies is currently disabled")

    expect(await submitSpasmEvent(
      validNostrSpasmModerateEvent,
      poolTest,
      customConfig
    )).toStrictEqual("ERROR: submitting all new Nostr actions is currently disabled")

    customConfig.web3.signature.nostr.enabled = true

    // env variable ENABLE_NEW_WEB3_ACTIONS_MODERATE
    expect(await submitSpasmEvent(
      validNostrSpasmModerateEvent,
      poolTest,
      customConfig
    )).toStrictEqual("ERROR: submitting new moderation actions is currently disabled")

    customConfig.web3.action.post.enabled = true

    expect(await submitSpasmEvent(
      validDmpEventSignedClosed,
      poolTest,
      customConfig
    )).toStrictEqual("Success. The event was saved into database")

    // Check if the event is in the database
    expect((await fetchEventWithSameSpasmIdFromDbV2(
        validDmpEventSignedClosed, poolTest)
      ).title
    ).toStrictEqual("genesis")
    expect(
      await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(1)

    // Check for a duplicate
    // Submitting the same event twice is not allowed
    expect(await submitSpasmEvent(
      validDmpEventSignedClosed,
      poolTest,
      customConfig
    )).toStrictEqual("An event with the same Spasm ID is already in database.")
    expect(
      await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(1)

    // Clean up db table before the next step
    expect(
      await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);

    expect(
      await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)

    customConfig.whitelist.action.post.enabled = true

    // env variable ENABLE_WHITELIST_FOR_ACTION_POST
    expect(await submitSpasmEvent(
      validDmpEventSignedClosed,
      poolTest,
      customConfig
    )).toStrictEqual("ERROR: this address is not whitelisted to submit new posts")
    expect(
      await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)

    // wrong signers
    customConfig.whitelist.action.post.list = [
      "0x655d7f8ac24d85a759f627d9cd32013c246ddac9",
      "0xee2bc0d6df269f58b77a41ebf6c6d968b9c92ebd",
      "b3a706bcceb39f193da553ce76255dd6ba5b097001c8ef85ff1b92e994894c81"
    ]

    expect(await submitSpasmEvent(
      validDmpEventSignedClosed,
      poolTest,
      customConfig
    )).toStrictEqual("ERROR: this address is not whitelisted to submit new posts")
    expect(
      await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)

    // wrong and right signers
    customConfig.whitelist.action.post.list = [
      "0x655d7f8ac24d85a759f627d9cd32013c246ddac9",
      "0xee2bc0d6df269f58b77a41ebf6c6d968b9c92ebd",
      "b3a706bcceb39f193da553ce76255dd6ba5b097001c8ef85ff1b92e994894c81",
      "0xf8553015220a857eda377a1e903c9e5afb3ac2fa"
    ]

    // env variable WHITELISTED_FOR_ACTION_POST
    expect(await submitSpasmEvent(
      validDmpEventSignedClosed,
      poolTest,
      customConfig
    )).toStrictEqual("Success. The event was saved into database")
    expect(
      await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(1)

    // Try to add one upvote
    expect(await submitSpasmEvent(
      validDmpReactionUpvoteSignedClosed,
      poolTest,
      customConfig
    )).toStrictEqual("ERROR: submitting new reactions is currently disabled")
    expect(
      await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(1)

    // Add one upvote
    customConfig.web3.action.react.enabled = true
    expect(await submitSpasmEvent(
      validDmpReactionUpvoteSignedClosed,
      poolTest,
      customConfig
    )).toStrictEqual("Success. Action has been saved and incremented")
    expect(
      await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(2)
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

    // Add one upvote duplicate
    // The duplicate event has the same action, content, and
    // signer, but different signature, because it's technically
    // a different event.
    // Stats should not change when a duplicate is submitted.
    // Duplicate events (reply, react, vote) are currently
    // not being saved into the database.
    customConfig.web3.action.react.enabled = true
    expect(await submitSpasmEvent(
      validDmpReactionUpvoteSignedClosedDuplicate,
      poolTest,
      customConfig
    )).toStrictEqual("Sorry, but you've already submitted the same action")
    expect(
      await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(2)
    const genesisAfterUpvoteAndDuplicate = await fetchSpasmEventV2ById(
      validDmpEventSignedClosed.signature, poolTest
    )
    expect(
      genesisAfterUpvoteAndDuplicate?.stats?.length
    ).toStrictEqual(1)
    expect(
      genesisAfterUpvoteAndDuplicate?.stats?.[0].action
    ).toStrictEqual("react")
    expect(
      genesisAfterUpvoteAndDuplicate?.stats?.[0].total
    ).toStrictEqual(1)
    expect(
      typeof(genesisAfterUpvoteAndDuplicate?.stats?.[0].latestTimestamp)
    ).toStrictEqual("number")
    expect(
      genesisAfterUpvoteAndDuplicate?.stats?.[0].latestTimestamp
    ).toStrictEqual(
      validDmpReactionUpvoteSignedClosedConvertedToSpasmEventV2
        .timestamp
    )
    // expect(
    //   typeof(genesisAfterUpvote?.stats?.[0].latestDbTimestamp)
    // ).toStrictEqual("number")
    expect(
      genesisAfterUpvoteAndDuplicate?.stats?.[0].contents?.length
    ).toStrictEqual(1)
    expect(
      genesisAfterUpvoteAndDuplicate?.stats?.[0].contents?.[0].value
    ).toStrictEqual("upvote")
    expect(
      genesisAfterUpvoteAndDuplicate?.stats?.[0].contents?.[0].total
    ).toStrictEqual(1)

    // Add one more upvote
    expect(await submitSpasmEvent(
      validDmpReactionUpvoteDiffSignerSignedClosed,
      poolTest,
      customConfig
    )).toStrictEqual("Success. Action has been saved and incremented")
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
    expect(await submitSpasmEvent(
      validDmpReactionDownvoteSignedClosed,
      poolTest,
      customConfig
    )).toStrictEqual("Success. Action has been saved and incremented")
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

    // Try to submit the same downvote event again
    expect(await submitSpasmEvent(
      validDmpReactionDownvoteSignedClosed,
      poolTest,
      customConfig
    )).toStrictEqual("An event with the same Spasm ID is already in database.")
    const genesisAfterUpUpDownAndDuplicateDownvote = await fetchSpasmEventV2ById(
      validDmpEventSignedClosed.signature, poolTest
    )
    expect(
      genesisAfterUpUpDownAndDuplicateDownvote?.stats?.length
    ).toStrictEqual(1)
    expect(
      genesisAfterUpUpDownAndDuplicateDownvote?.stats?.[0].action
    ).toStrictEqual("react")
    expect(
      genesisAfterUpUpDownAndDuplicateDownvote?.stats?.[0].total
    ).toStrictEqual(3)
    expect(
      genesisAfterUpUpDownAndDuplicateDownvote?.stats?.[0].contents?.length
    ).toStrictEqual(2)
    expect(
      genesisAfterUpUpDownAndDuplicateDownvote?.stats?.[0].contents?.[0].value
    ).toStrictEqual("upvote")
    expect(
      genesisAfterUpUpDownAndDuplicateDownvote?.stats?.[0].contents?.[0].total
    ).toStrictEqual(2)
    expect(
      genesisAfterUpUpDownAndDuplicateDownvote?.stats?.[0].contents?.[1].value
    ).toStrictEqual("downvote")
    expect(
      genesisAfterUpUpDownAndDuplicateDownvote?.stats?.[0].contents?.[1].total
    ).toStrictEqual(1)

    // Try to add one reply
    expect(await submitSpasmEvent(
      validDmpReplySignedClosed,
      poolTest,
      customConfig
    )).toStrictEqual("ERROR: submitting new replies is currently disabled")

    // Add one reply
    customConfig.web3.action.reply.enabled = true
    expect(await submitSpasmEvent(
      validDmpReplySignedClosed,
      poolTest,
      customConfig
    )).toStrictEqual("Success. Action has been saved and incremented")
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

    // Clean up db table after testing.
    expect(
      await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);

    expect(
      await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)
  });
});

// moderation
describe("multiple moderation tests for submitSpasmEvent", () => {
  test("multiple moderation tests", async () => {
    // Clean up db table before testing.
    expect(await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);
    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)

    const customConfig: ConfigForSubmitSpasmEvent =
      JSON.parse(JSON.stringify(configEverythingDisabled));

    // Actual tests here
    // Insert reply
    customConfig.web3.action.all.enabled = true
    customConfig.web3.signature.ethereum.enabled = true
    customConfig.web3.action.post.enabled = true
    customConfig.web3.action.reply.enabled = true
    expect(await submitSpasmEvent(
      validDmpReplySignedClosed,
      poolTest,
      customConfig)
    ).toStrictEqual("Success. Action has been saved and incremented")
    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(1)
    expect((await fetchSpasmEventV2ById(
      validDmpReplySignedClosed.signature, poolTest
    )).content).toStrictEqual("new comment")

    // Enable nostr signatures, but keep moderation disabled
    customConfig.web3.signature.nostr.enabled = true
    expect(await submitSpasmEvent(
      moderateDeleteValidDmpReply,
      poolTest,
      customConfig)
    ).toStrictEqual("ERROR: submitting new moderation actions is currently disabled")

    // Enable submitting new moderation actions,
    // but still keep moderation disabled
    customConfig.web3.action.moderate.enabled = true
    expect(await submitSpasmEvent(
      moderateDeleteValidDmpReply,
      poolTest,
      customConfig)
    ).toStrictEqual("ERROR: the moderation is disabled")

    // Enable moderation, but don't add any moderators
    customConfig.moderation.enabled = true
    expect(await submitSpasmEvent(
      moderateDeleteValidDmpReply,
      poolTest,
      customConfig)
    ).toStrictEqual("ERROR: moderators are not set")

    // Add wrong signers into the list of moderators
    customConfig.moderation.list = [
      "0x655d7f8ac24d85a759f627d9cd32013c246ddac9",
      "0xee2bc0d6df269f58b77a41ebf6c6d968b9c92ebd",
      "0xf8553015220a857eda377a1e903c9e5afb3ac2fa"
    ]
    expect(await submitSpasmEvent(
      moderateDeleteValidDmpReply,
      poolTest,
      customConfig)
    ).toStrictEqual("ERROR: you're not a moderator")

    // Add this signer into the list of moderators
    customConfig.moderation.list.push(
      "b3a706bcceb39f193da553ce76255dd6ba5b097001c8ef85ff1b92e994894c81"
    )
    // console.log("customConfig.moderation.list:", customConfig.moderation.list)
    expect(await submitSpasmEvent(
      moderateDeleteValidDmpReply,
      poolTest,
      customConfig)
    ).toStrictEqual("Success. Action saved and target deleted")

    // Make sure the reply event was deleted
    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(1)
    expect(await fetchSpasmEventV2ById(
      validDmpReplySignedClosed.signature, poolTest
    )).toStrictEqual(null)

    // Try to re-submit the same banned reply event
    expect(await submitSpasmEvent(
      validDmpReplySignedClosed,
      poolTest,
      customConfig)
    ).toStrictEqual("ERROR: this event ID is banned")

    // Delete the moderation event which banned the reply above,
    // i.e., unban the previously banned reply event
    expect(
      await deleteSpasmEventV2FromDbById(
        moderateDeleteValidDmpReplyConvertedToSpasmEventV2.ids[0].value,
        poolTest,
        "spasm_events"
      )
    ).toStrictEqual(true);
    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)

    // Re-submit the unbanned reply event
    expect(await submitSpasmEvent(
      validDmpReplySignedClosed,
      poolTest,
      customConfig)
    ).toStrictEqual("Success. Action has been saved and incremented")
    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(1)
    expect((await fetchSpasmEventV2ById(
      validDmpReplySignedClosed.signature, poolTest
    )).content).toStrictEqual("new comment")

    // Clean up db table after testing.
    expect(await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);
    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)
  });
});

// sanitization
describe("multiple sanitization tests for submitSpasmEvent", () => {
  test("should return true if passed true", async () => {
    // Clean up db table before testing.
    expect(await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);
    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)

    const customConfig: ConfigForSubmitSpasmEvent =
      JSON.parse(JSON.stringify(configEverythingDisabled));

    // Actual tests here
    customConfig.web3.action.all.enabled = true
    customConfig.web3.signature.ethereum.enabled = true
    customConfig.web3.action.post.enabled = true

    // Try to submit a new post with malicious HTML tags.
    // This test only checks for a proper error message, while
    // other sanitization tests can be found in spasm.js library
    // currently located at spasm.js/src.ts/_tests/utils.test.ts
    expect(await submitSpasmEvent(
      validDmpActionPostWithMaliciousHtmlTagsSignedClosed,
      poolTest,
      customConfig)
    ).toStrictEqual("ERROR: Cannot convert to Spasm event")
    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)
    expect(await fetchSpasmEventV2ById(
      validDmpActionPostWithMaliciousHtmlTagsSignedClosed.signature,
      poolTest
    )).toStrictEqual(null)

    // Try to submit a new post with valid HTML tags
    // when HTML tags are not allowed.
    // This test only checks for a proper error message, while
    // HTML detection is done by ifEventContainsHtmlTags() and
    // containsHtmlTags() functions with tests currently located
    // at ./helper/utils/utils.ts
    expect(await submitSpasmEvent(
      validDmpActionPostWithValidHtmlTagsSignedClosed,
      poolTest,
      customConfig)
    ).toStrictEqual("ERROR: HTML tags are not allowed. You may consider using markdown instead if this instance supports markdown.")
    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)
    expect(await fetchSpasmEventV2ById(
      validDmpActionPostWithMaliciousHtmlTagsSignedClosed.signature,
      poolTest
    )).toStrictEqual(null)

    customConfig.htmlTags.allowed = true
    expect(await submitSpasmEvent(
      validDmpActionPostWithValidMarkdownSignedClosed,
      poolTest,
      customConfig)
    ).toStrictEqual("Success. The event was saved into database")
    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(1)
    expect((await fetchSpasmEventV2ById(
      validDmpActionPostWithValidMarkdownSignedClosed.signature,
      poolTest
    )).title).toStrictEqual("Post with valid markdown")

    // Submit a new post with valid HTML tags
    // when HTML tags are allowed
    customConfig.htmlTags.allowed = true
    expect(await submitSpasmEvent(
      validDmpActionPostWithValidHtmlTagsSignedClosed,
      poolTest,
      customConfig)
    ).toStrictEqual("Success. The event was saved into database")
    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(2)
    expect((await fetchSpasmEventV2ById(
      validDmpActionPostWithValidHtmlTagsSignedClosed.signature,
      poolTest
    )).title).toStrictEqual("Post with valid HTML tags")

    // Clean up db table after testing.
    expect(await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);
    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)
  });
});

// web2
describe("many tests for submitSpasmEvent with web2 posts", () => {
  test("many tests for submitting web2 posts", async () => {
    // Clean up db table before testing.
    expect(await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);
    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)

    const customConfig: ConfigForSubmitSpasmEvent =
      JSON.parse(JSON.stringify(configEverythingDisabled));

    // Actual tests here
    customConfig.web3.action.all.enabled = true
    // customConfig.web3.signature.ethereum.enabled = true
    customConfig.web3.action.post.enabled = true

    customConfig.eventsWithoutSignature.allowed = false
    expect(await submitSpasmEvent(
      validPostWithRssItem,
      poolTest,
      customConfig)
    ).toStrictEqual("ERROR: events without signatures are not allowed on this instance.")
    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)

    customConfig.eventsWithoutSignature.allowed = true
    expect(await submitSpasmEvent(
      validPostWithRssItem,
      poolTest,
      customConfig)
    ).toStrictEqual("Success. The event was saved into database")
    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(1)

    expect(await submitSpasmEvent(
      validRssItemWithEmoji,
      poolTest,
      customConfig)
    ).toStrictEqual("Success. The event was saved into database")
    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(2)

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

    // const customConfig: ConfigForSubmitSpasmEvent =
    //   JSON.parse(JSON.stringify(configEverythingDisabled));

    // Actual tests here

    // Clean up db table after testing.
    expect(await cleanDbTable("spasm_events", poolTest)
    ).toStrictEqual(true);
    expect(await howManyEntriesInTable("spasm_events", poolTest)
    ).toStrictEqual(0)
  });
});
