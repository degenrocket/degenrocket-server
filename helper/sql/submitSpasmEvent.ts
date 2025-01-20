import {poolDefault} from "../../db";
import {
  UnknownEventV2,
  SpasmEventV2,
  CustomConfigForSubmitSpasmEvent,
  ConfigForSubmitSpasmEvent
} from "../../types/interfaces";
import {
  hasValue,
  ifEventContainsHtmlTags,
  isObjectWithValues,
  mergeConfigsForSubmitSpasmEvent,
} from "../utils/utils";
import {
  fetchEventWithSameSpasmIdFromDbV2,
  insertSpasmEventV2,
  isEventBanned,
  isReactionDuplicate,
  deleteSpasmEventsV2FromDbByIds,
  incrementSpasmEventActionV2,
  fetchEventWithSameUrlIdFromDbV2
} from "./sqlUtils";
import {
  updateAppConfig
} from "./../../appConfig"
const { spasm } = require('spasm.js');

// Override console.log for production
if (process.env.NODE_ENV !== "dev") {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

/**
 * There are different ways to submit events to the local db.
 * - Option 1. Sign a message via UI.
 *   The client usually sends SpasmEventEnvelope.
 *   However, it can also send DMP and NostrSpasm events, as
 *   well as pure Nostr events and some other unknown events.
 * - Option 2. Get an event from other instances.
 *   If the Spasm module is activated, the backend fetches events
 *   from other instances and tries to submit them to the local
 *   database.
 *   It's usually SpasmEventEnvelope, but can be anything.
 * These are the steps to take before submitting the event.
 * - Convert event to SpasmEvent (signatures are verified)
 * - Convert SpasmEvent to SpasmEventDatabase
 * - DOMPurify
 * - Get rid of HTML tags
 * - Check whether authors are whitelisted or banned
 */

export const submitSpasmEvent = async (
  unknownEvent: UnknownEventV2,
  pool = poolDefault,
  customConfig?: CustomConfigForSubmitSpasmEvent,
  // ignoreWhitelistFor = new IgnoreWhitelistFor()
): Promise<string> => {
  let isAppConfig = false
  let isAdminEvent = false
  let dbTable = ""
  const defaultConfig = new ConfigForSubmitSpasmEvent()
  const config: ConfigForSubmitSpasmEvent =
    mergeConfigsForSubmitSpasmEvent(
    defaultConfig, customConfig || {}
  )
  // const ignoreWhitelistFor = new IgnoreWhitelistFor()

  if (!isObjectWithValues(unknownEvent)) {
    return "ERROR: Unknown event is empty"
  }

  try {
    const customConfigForConvertToSpasm = {
      // Sanitization is enabled by default
      to: { spasm: { version: "2.0.0" } }
    }

    const spasmEvent: SpasmEventV2 | null =
      spasm.convertToSpasm(
        unknownEvent, customConfigForConvertToSpasm
    )

    if (!spasmEvent || !isObjectWithValues(spasmEvent)) {
      return "ERROR: Cannot convert to Spasm event"
    }

    if (
      'action' in spasmEvent && spasmEvent.action &&
      typeof(spasmEvent.action) === "string"
    ) {
      // App config events
      if (spasmEvent.action.startsWith('app-config')) {
        if (!config.appConfig.changes.allowed) {
          return "ERROR: changing app config is not allowed"
        }
        if (!config.appConfig.changes.allowedByAdmin) {
          return "ERROR: changing app config by admins is not allowed"
        }
        if (!config.admin.enabled) {
          return "ERROR: admin is disabled"
        }
        if (
          !Array.isArray(config.admin.list) ||
          !hasValue(config.admin.list)
        ) { return "ERROR: admins are not set" }
        const isAnySignerAdmin =
          spasm.isAnySignerListedIn(spasmEvent, config.admin.list)
        if (!isAnySignerAdmin) {
          return "ERROR: you're not an admin"
        }

        isAdminEvent = true
        isAppConfig = true
        dbTable = "app_configs"

      // Admin events
      } else if (spasmEvent.action.startsWith('admin')) {
        if (!config.admin.enabled) {
          return "ERROR: admin is disabled"
        }
        if (
          !Array.isArray(config.admin.list) ||
          !hasValue(config.admin.list)
        ) { return "ERROR: admins are not set" }
        const isAnySignerAdmin =
          spasm.isAnySignerListedIn(spasmEvent, config.admin.list)
        if (!isAnySignerAdmin) {
          return "ERROR: you're not an admin"
        }
        isAdminEvent = true
        dbTable = "admin_events"

      // Other events
      } else {
        dbTable = "spasm_events"
      }
    }

    if (
      (!('sig' in spasmEvent) || !hasValue(spasmEvent.sig)) &&
      (!('signature' in spasmEvent) || !hasValue(spasmEvent.signature)) &&
      (!('signatures' in spasmEvent) || !hasValue(spasmEvent.signatures)) &&
      !config.eventsWithoutSignature.allowed
    ) {
      return "ERROR: events without signatures are not allowed on this instance."
    }

    // Apparently, using DOMPurify is not enough because
    // Tor users can bypass tags sanitization with nos2x-fox
    // Nostr extension. Thus, it's better to separately check
    // whether any of event values have any HTML tags.
    // The only downside is that developers won't be able to
    // share code snippets with HTML tags.
    // Note: deletion of HTML tags doesn't affect markdown.
    if (
      !config.htmlTags.allowed &&
      ifEventContainsHtmlTags(spasmEvent)
    ) {
      console.log("ERROR: HTML tags were detected")
      return "ERROR: HTML tags are not allowed. You may consider using markdown instead if this instance supports markdown."
    }

    // Environment variables
    if (
      !config.web3.action.all.enabled &&
      !isAdminEvent &&
      !isAppConfig
    ) {
      return "ERROR: submitting all new web3 actions is currently disabled"
    }

    if (
      // Nostr disabled
      !config.web3.signature.nostr.enabled &&
      // Has at least one Nostr signature
      spasm.hasSignatureNostr(spasmEvent) &&
      // Has no Ethereum signatures
      !spasm.hasSignatureEthereum(spasmEvent) &&
      !isAdminEvent &&
      !isAppConfig
    ) {
      return "ERROR: submitting all new Nostr actions is currently disabled"
    }

    if (
      // Ethereum disabled
      !config.web3.signature.ethereum.enabled &&
      // Has at least one Ethereum signature
      spasm.hasSignatureEthereum(spasmEvent) &&
      // Has no Nostr signatures
      !spasm.hasSignatureNostr(spasmEvent) &&
      !isAdminEvent &&
      !isAppConfig
    ) {
      return "ERROR: submitting all new Ethereum actions is currently disabled"
    }

    if (
      !config.web3.action.post.enabled &&
      spasmEvent.action === 'post' &&
      !isAdminEvent
    ) {
      return "ERROR: submitting new posts is currently disabled"
    }

    if (
      !config.web3.action.react.enabled &&
      spasmEvent.action === 'react' &&
      !isAdminEvent
    ) {
      return "ERROR: submitting new reactions is currently disabled"
    }

    if (
      !config.web3.action.reply.enabled &&
      spasmEvent.action === 'reply' &&
      !isAdminEvent
    ) {
      return "ERROR: submitting new replies is currently disabled"
    }

    if (
      !config.web3.action.moderate.enabled &&
      spasmEvent.action === 'moderate' &&
      !isAdminEvent
    ) {
      return "ERROR: submitting new moderation actions is currently disabled"
    }

    // Abort the function if the signer is not whitelisted to
    // submit new post actions, but only if a white list is
    // enabled and ignoreWhitelist is set to false.
    // Flag ignoreWhitelist is used when e.g. posts are received
    // from other instances of the network via the SPASM module.
    if (
      spasmEvent.action === 'post' &&
      config.whitelist.action.post.enabled
    ) {
      const isAnySignerWhitelistedForActionPost =
        spasm.isAnySignerListedIn(
        spasmEvent, config.whitelist.action.post.list
      )
      if (
        !isAnySignerWhitelistedForActionPost && !isAdminEvent
      ) {
        return "ERROR: this address is not whitelisted to submit new posts"
      }
    }
    // Same for reply
    if (
      spasmEvent.action === 'reply' &&
      config.whitelist.action.reply.enabled
    ) {
      const isAnySignerWhitelistedForActionReply =
        spasm.isAnySignerListedIn(
        spasmEvent, config.whitelist.action.reply.list
      )
      if (
        !isAnySignerWhitelistedForActionReply && !isAdminEvent
      ) {
        return "ERROR: this address is not whitelisted to submit new replies"
      }
    }
    // Same for react
    if (
      spasmEvent.action === 'react' &&
      config.whitelist.action.react.enabled
    ) {
      const isAnySignerWhitelistedForActionReact =
        spasm.isAnySignerListedIn(
        spasmEvent, config.whitelist.action.react.list
      )
      if (
        !isAnySignerWhitelistedForActionReact && !isAdminEvent
      ) {
        return "ERROR: this address is not whitelisted to submit new reactions"
      }
    }

    if (await isEventBanned(spasmEvent, pool)) {
      return "ERROR: this event ID is banned"
    }

    // Increment stats if a user didn't submit the same
    // reaction before. Uniqueness of the reaction is checked
    // before the insertion but the actual incrementation of
    // stats is done after the insertion to avoid wrong
    // incrementation if insertion has failed.
    let isEventAlreadyInDb: boolean = false

    // web3 events are checked against Spasm ID
    if (
      spasm.hasSignatureNostr(spasmEvent) ||
      spasm.hasSignatureEthereum(spasmEvent)
    ) {
      isEventAlreadyInDb = !!(
        await fetchEventWithSameSpasmIdFromDbV2(spasmEvent, pool)
      )
    // web2 events without signatures are checked against URL ID
    // because Spasm ID might be different e.g. if an RSS item
    // has a slightly different value in pubdate or other fields.
    } else {
      isEventAlreadyInDb = !!(
        await fetchEventWithSameUrlIdFromDbV2(spasmEvent, pool)
      )
    }

    if (isEventAlreadyInDb) {
      return "An event with the same Spasm ID is already in database."
      // TODO
      // if all signatures in both events are the same, return
      // if signatures are different, merge
      // merge spasmEvent into eventWithSameSpasmidFromDb
      // spasm.mergeEvents(
      //   eventWithSameSpasmidFromDb, spasmEvent
      // )
      // pass mergedEvent to replaceSpasmEventInDb()
      // return "An event with the same Spasm ID is already in database. Merged two events together."
    }

    let isToBeIncrementedLater: boolean = false
    // duplicate web3 events should not increment stats
    if (
      spasm.hasSignatureNostr(spasmEvent) ||
      spasm.hasSignatureEthereum(spasmEvent)
    ) {
      isToBeIncrementedLater =
        !(await isReactionDuplicate(spasmEvent, pool))
    // web2 events (without signature) should be safe
    // since they should not be of action 'react' or 'reply'.
    } else {
      isToBeIncrementedLater = true
    }

    // const isToBeIncrementedLater =
    //   !(await isReactionDuplicate(spasmEvent, pool))
    // console.log('isToBeIncrementedLater:', isToBeIncrementedLater)

    // const time = new Date(Date.now()).toISOString();

    // AppConfig
    if (
      spasmEvent.action?.startsWith('app-config') && isAppConfig
    ) {
      // Checking against config again for extra security
      if (!config.appConfig.changes.allowed) {
        return "ERROR: changing app config is not allowed"
      }
      if (!config.appConfig.changes.allowedByAdmin) {
        return "ERROR: changing app config by admins is not allowed"
      }
      if (!config.admin.enabled) {
        return "ERROR: admin is disabled"
      }
      if (
        !Array.isArray(config.admin.list) ||
        !hasValue(config.admin.list)
      ) { return "ERROR: admins are not set" }
      const isAnySignerAdmin =
        spasm.isAnySignerListedIn(spasmEvent, config.admin.list)
      if (!isAnySignerAdmin) {
        return "ERROR: you're not an admin"
      }
      const insertSuccess = await insertSpasmEventV2(
        spasmEvent, pool, dbTable
      )

      if (!!insertSuccess) {
        const res = await updateAppConfig()
        if (res && typeof(res) === "string") {
          return res
        } else {
          return "ERROR: config saved, but not updated. Try again."
        }
      } else {
        return "ERROR: event was not saved into database"
      }

    // Moderation
    } else if (
      spasmEvent.action === "moderate" &&
      spasmEvent.content === "delete"
    ) {
      if (!config.moderation.enabled) {
        return "ERROR: the moderation is disabled"
      }
      if (
        !Array.isArray(config.moderation.list) ||
        !hasValue(config.moderation.list)
      ) { return "ERROR: moderators are not set" }

      const isAnySignerModerator =
        spasm.isAnySignerListedIn(
          spasmEvent, config.moderation.list
      )
      console.log("isAnySignerModerator:", isAnySignerModerator)
      if (!isAnySignerModerator) {
        return "ERROR: you're not a moderator"
      }

      const insertSuccess = await insertSpasmEventV2(
        spasmEvent, pool, dbTable
      )

      if (!insertSuccess) {
        return "ERROR: event was not saved into database"
      }

      const deleteSuccess = await deleteSpasmEventsV2FromDbByIds(
        spasm.getAllParentIds(spasmEvent), pool
      )
        console.log("deleteSuccess:", deleteSuccess)

      return deleteSuccess
        ? "Success. Action saved and target deleted"
        : "Action saved, but target not deleted"

    // Reaction, reply, vote (duplicate)
    } else if (
      !isToBeIncrementedLater &&
      (
        spasmEvent.action === "react" ||
        spasmEvent.action === "reply" ||
        spasmEvent.action === "vote"
      )
    ) {
      // Inserting duplicate actions is currently not allowed
      return "Sorry, but you've already submitted the same action"

    // Reaction, reply, vote (unique)
    } else if (
      isToBeIncrementedLater &&
      (
        spasmEvent.action === "react" ||
        spasmEvent.action === "reply" ||
        spasmEvent.action === "vote"
      )
    ) {
      const insertSuccess = await insertSpasmEventV2(
        spasmEvent, pool, dbTable
      )

      if (!insertSuccess) return "ERROR: event was not saved into database"

      // console.log("Action was unique, time to increment it now")
      const incrementSuccess = await incrementSpasmEventActionV2(
        spasmEvent, pool
      )

      // console.log("++++++++++++++++++++++++++++++++++++++++++++")
      return incrementSuccess
        ? "Success. Action has been saved and incremented"
        : "Action has been saved, but count was not incremented"

    // Catch all (e.g., 'moderate' event, but not 'delete')
    // post
    // reaction, reply, vote (duplicate)
    } else {
      // Insert reaction event into db even if this signer has
      // already submitted the same reaction for this target,
      // but as a different event with different ID/signature.
      const insertSuccess = await insertSpasmEventV2(
        spasmEvent, pool, dbTable
      )
      
      if (insertSuccess) {
        if (
          spasmEvent.action === "reply" ||
          spasmEvent.action === "react" ||
          spasmEvent.action === "vote"
        ) {
          // return "Success. Action has been saved and incremented"
          return "Sorry, but you've already submitted the same action"
        } else {
          return "Success. The event was saved into database"
        }
      } else {
        return "ERROR: event was not saved into database"
      }
    }

    // console.log("--------------------------------------------")
    // return "Sorry, but you've already submitted the same action"
  } catch (err) {
    console.error('submitSpasmEvent failed', unknownEvent, err);
    return "ERROR: submitting new Spasm event failed"
  }
}
