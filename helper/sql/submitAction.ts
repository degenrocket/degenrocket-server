import { pool } from "../../db";
import {
  UnknownPostOrEvent, NostrEvent,
  StandardizedEvent, IgnoreWhitelistFor
} from "../../types/interfaces";
import { identifyPostOrEvent, standartizePostOrEvent } from "../spasm/identifyEvent";
import { isObjectWithValues } from "../spasm/utils";
const ethers = require("ethers");
const nostrTools = require('nostr-tools');
const DOMPurify = require('isomorphic-dompurify');
const enableNewWeb3ActionsAll = process.env.ENABLE_NEW_WEB3_ACTIONS_ALL === 'false' ? false : true;
const enableNewWeb3ActionsPost = process.env.ENABLE_NEW_WEB3_ACTIONS_POST === 'false' ? false : true;
const enableNewWeb3ActionsReact = process.env.ENABLE_NEW_WEB3_ACTIONS_REACT === 'false' ? false : true;
const enableNewWeb3ActionsReply = process.env.ENABLE_NEW_WEB3_ACTIONS_REPLY === 'false' ? false : true;
const enableNewWeb3ActionsModerate = process.env.ENABLE_NEW_WEB3_ACTIONS_MODERATE === 'false' ? false : true;
const enableNewNostrActionsAll = process.env.ENABLE_NEW_NOSTR_ACTIONS_ALL === 'false' ? false : true;
const enableNewEthereumActionsAll = process.env.ENABLE_NEW_ETHEREUM_ACTIONS_ALL === 'false' ? false : true;
const env = process?.env
const enableModeration = env.ENABLE_MODERATION === 'false' ? false : true;
const moderators: string[] =
  typeof(env?.MODERATORS) === "string"
  ? env?.MODERATORS.toLowerCase().split(',')
  : [];
const enableWhitelistForActionPost: boolean =
  env?.ENABLE_WHITELIST_FOR_ACTION_POST === 'true' ? true : false;
const whitelistedForActionPost: string[] =
  typeof(env?.WHITELISTED_FOR_ACTION_POST) === 'string'
  ? env?.WHITELISTED_FOR_ACTION_POST.toLowerCase().split(',')
  : [];

// Override console.log for production
if (process.env.NODE_ENV !== "dev") {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

/**
 * There are different ways to submit events to the local db.
 * - Option 1. Sign a message via UI.
 *   Frontend will usually send a structured DMP or NostrSpasm
 *   event, because it knows which protocol (JSON object) is
 *   signed before sending it to a server.
 *   Occasionally, frontend can send an unknown event, which most
 *   likely be either a DMP or NostrSpasm event.
 * - Option 2. Get a message from another instance.
 *   Backend, when the SPASM module is activated, fetches posts
 *   from other instances and tries to submit them to the local
 *   database, so it will usually send an unknown post, which has
 *   to be converted/unwrapped into a DMP or NostrSpasm event.
 * These are the steps to take before submitting the event.
 * - Check if event is specified as DMP or NostrSpasm event.
 * - If unknown event, check if it's DMP or NostrSpasm event.
 * - If not DMP/NostrSpasm event, check if it's a post.
 * - If a post, check if it's a web3 post.
 * - If a web3 post, unwrap the signed object.
 * - Check if signed object is DMP or NostrSpasm object. 
 */

interface unknownEnvelope {
  unknownEvent: UnknownPostOrEvent
}

export const submitAction = async (
  unknownEnvelope: unknownEnvelope,
  ignoreWhitelistFor = new IgnoreWhitelistFor()
) => {
  console.log("unknownEnvelope:", unknownEnvelope)
  if (!('unknownEvent' in unknownEnvelope)) return "No unknownEvent found to submit"
  if (!isObjectWithValues(unknownEnvelope.unknownEvent)) return "Unknown event is empty"

  try {

    // Deep copy
    const unknownPostOrEvent = JSON.parse(JSON.stringify(unknownEnvelope.unknownEvent));
    const info = identifyPostOrEvent(unknownPostOrEvent)

    if (!isObjectWithValues(info)) return "Cannot identify an event or post"

    if (!info.webType) return "Cannot identify an event or post webType"

    if (!info.eventInfo) return "Cannot identify eventInfo"

    if (!info.eventInfo.type) return "Cannot identify an event type"

    const standartizedEvent: StandardizedEvent | false = standartizePostOrEvent(unknownPostOrEvent, info)

    if (!standartizedEvent) return "Cannot standartize event"

    // Since signedString is also sanitized, it wouldn't be possible
    // to check the signature and submit a dirty event.
    const signedString = DOMPurify.sanitize(standartizedEvent.signedString)
    const signature = DOMPurify.sanitize(standartizedEvent.signature)
    const signer = DOMPurify.sanitize(standartizedEvent.signer)
    const target = DOMPurify.sanitize(standartizedEvent.target)
    const action = DOMPurify.sanitize(standartizedEvent.action)
    const title = DOMPurify.sanitize(standartizedEvent.title)
    const text = DOMPurify.sanitize(standartizedEvent.text)
    const signedDate = DOMPurify.sanitize(standartizedEvent.signedDate)

    // Environment variables
    if (!enableNewWeb3ActionsAll) {
      return "ERROR: submitting all new web3 actions is currently disabled"
    }

    if (
      !enableNewNostrActionsAll &&
      info.eventInfo.privateKey === "nostr"
    ) {
      return "ERROR: submitting all new Nostr actions is currently disabled"
    }

    if (
      !enableNewEthereumActionsAll &&
      info.eventInfo.privateKey === "ethereum"
    ) {
      return "ERROR: submitting all new Ethereum actions is currently disabled"
    }

    if (
      !enableNewWeb3ActionsPost &&
      action === 'post'
    ) {
      return "ERROR: submitting new posts is currently disabled"
    }

    if (
      !enableNewWeb3ActionsReact &&
      action === 'react'
    ) {
      return "ERROR: submitting new reactions is currently disabled"
    }

    if (
      !enableNewWeb3ActionsReply &&
      action === 'reply'
    ) {
      return "ERROR: submitting new replies is currently disabled"
    }

    if (
      !enableNewWeb3ActionsModerate &&
      action === 'moderate'
    ) {
      return "ERROR: submitting new moderation actions is currently disabled"
    }

    // Abort the function if the signer is not whitelisted to
    // submit new post actions, but only if a white list is
    // enabled and ignoreWhitelist is set to false.
    // Flag ignoreWhitelist is used when e.g. posts are received
    // from other instances of the network via the SPASM module.
    if (
      action === 'post' &&
      enableWhitelistForActionPost &&
      signer &&
      typeof(signer) === 'string' &&
      !whitelistedForActionPost.includes(signer.toLowerCase()) &&
      !ignoreWhitelistFor?.action?.post
    ) {
      console.log("ERROR: this address is not whitelisted to submit new posts")
      return "ERROR: this address is not whitelisted to submit new posts"
    }

    // Check if signature is valid
    if (!signature) return "ERROR: signature is null"

    if (info.eventInfo.privateKey === "ethereum") {
      if (!verifyEthereumSignature(signedString, signature, signer)) {
        return "ERROR: invalid Ethereum signature"
      }

    } else if (info.eventInfo.privateKey === "nostr") {

      let nostrEvent: NostrEvent

      // Unsealed Nostr event
      if (
        !info.eventIsSealed &&
        !info.eventIsSealedUnderKeyName
      ) {
        nostrEvent = JSON.parse(JSON.stringify(unknownPostOrEvent));

      // Post with sealed Nostr event
      } else if (
        info.eventIsSealed &&
        typeof(info.eventIsSealedUnderKeyName) === "string"
      ) {
        nostrEvent = JSON.parse(
          unknownPostOrEvent[info.eventIsSealedUnderKeyName]
        );
      }

      if (!verifyNostrSignature(nostrEvent)) {
        return "ERROR: invalid Nostr signature"
      }
    }

    if (await isSignatureAlreadyInDB(signature)) {
      console.log("ERROR: action signature is already in database")
      return "ERROR: action signature is already in database"
    }

    if (await isActionBanned(signature)) {
      console.log("ERROR: action signature is banned")
      return "ERROR: action signature is banned"
    }

    // Increment reactions_count table if user
    // didn't have the same reaction before.
    // Uniqueness is checked before the insertion
    // but incrementation is done after the insertion
    // to avoid wrong incrementation if insertion has failed.
    const isToBeIncrementedLater = await isActionUnique(action, target, text, signer)
    console.log('isToBeIncrementedLater:', isToBeIncrementedLater)

    const time = new Date(Date.now()).toISOString();

    // Moderation
    if (
      action === "moderate" &&
      text === "delete"
    ) {
      if (!enableModeration) return "The moderation is disabled"
      if (!signer) return "There is no signer"
      if (typeof(signer) !== "string") return "Signer is invalid"
      if (!Array.isArray(moderators)) return "Moderators are not set"
      if (!moderators.includes(signer)) return "You're not a moderator"

      const insertSuccess = await insertActionSignature(
        action, target, title, text, signer, signedString, signature, signedDate, time)

      if (!insertSuccess) return "ERROR: signature was not saved into database"

      const deleteSuccess = await deleteAction(
        action, target, text, time);

        return deleteSuccess
          ? "Success. Action saved and target deleted"
          : "Action saved, but target not deleted"

    // Reaction, reply, post
    } else if (
      isToBeIncrementedLater &&
      action !== "moderate"
    ) {
      // Insert reaction signature into db
      // even if this signer has already submitted the same reaction
      // for this target, but with different signature
      const insertSuccess = await insertActionSignature(
        action, target, title, text, signer, signedString, signature, signedDate, time)

      if (!insertSuccess) return "ERROR: signature was not saved into database"

      console.log("Action was unique, time to increment it now")
      const incrementSuccess = await incrementActionsCountTable(
        action, target, text, time);

      console.log("++++++++++++++++++++++++++++++++++++++++++++")
      return incrementSuccess
        ? "Success. Action has been saved and incremented"
        : "Action has been saved, but count was not incremented"

    // Catch all (e.g., 'moderate' event, but not 'delete')
    } else {
      const insertSuccess = await insertActionSignature(
        action, target, title, text, signer, signedString, signature, signedDate, time)

      if (!insertSuccess) return "ERROR: signature was not saved into database"
    }

    console.log("--------------------------------------------")
    return "Sorry, but you've already submitted the same action"
  } catch (err) {
    console.error('submitReaction failed', unknownEnvelope, err);
  }
}

const verifyEthereumSignature = (signedString: string, signature: string, signer: string) => {
  console.log("verifyEthereumSignature called")
  console.log('signedString:', signedString)
  console.log('signature:', signature)
  console.log('signer:', signer)

  if (signature && typeof (signature) === 'string') {
    console.log('signature is type of string, next')

    // ethers v5
    // const recoveredAddress = ethers.utils.verifyMessage(signedString, signature).toLowerCase()
    // ethers v6
    const recoveredAddress = ethers.verifyMessage(signedString, signature).toLowerCase()
    console.log('verifySignature:', recoveredAddress === signer)
    return recoveredAddress === signer
  }
  console.log('signature is null or not a string')
  return false
}

const verifyNostrSignature = (nostrEvent: NostrEvent) => {
  console.log("verifyNostrSignature called")

  if (!nostrTools.validateEvent(nostrEvent)) {
    console.log("validateEvent is false")
    return false
  }

  if (nostrTools.verifySignature(nostrEvent)) {
    console.log("verifySignature is true")
    return true
  }

  console.log('signature is null or not a string')
  return false
}

const isSignatureAlreadyInDB = async (signature: string) => {
  const tableName = 'actions'
  try {
    const checkSignature = await pool.query(`
      SELECT * FROM ${tableName}
      WHERE signature = $1`
      , [signature])
    return checkSignature.rowCount > 0 ? true : false
  } catch (err) {
    console.error('isSignatureAlreadyInDB failed', signature, err);
  }
};

const isActionUnique = async (
  action: string,
  target: string,
  text: string,
  signer: string
) => {
  const tableName = 'actions'
  console.log('tableName in isActionUnique:', tableName)

  // TODO: why action itself is not checked?
  try {
    const checkAction = await pool.query(`
      SELECT * FROM ${tableName}
      WHERE target = $1
      AND text = $2
      AND signer = $3`
      , [target, text, signer])
    return checkAction.rowCount > 0 ? false : true
  } catch (err) {
    console.error('isActionUnique failed', target, err);
  }
};

const deleteAction = async (
  action: string,
  target: string,
  text: string,
  time: string
): Promise<boolean> => {
  const tableNameWeb2 = 'posts'
  const tableNameWeb3 = 'actions'
  try {
    // web2 posts (e.g. RSS)
    if (action === 'moderate' && text === 'delete') {
      const updateString = `
      DELETE FROM ${tableNameWeb2}
      WHERE url = $1`
      const updateValues = [target]
      await pool.query(updateString, updateValues)
    }

    // web3 posts (e.g. DMP, Nostr)
    if (action === 'moderate' && text === 'delete') {
      const updateString = `
      DELETE FROM ${tableNameWeb3}
      WHERE signature = $1`
      const updateValues = [target]
      await pool.query(updateString, updateValues)
    }

    return true
  } catch (err) {
    console.error('moderation failed', target, err);
  }
  console.log("The end of moderation function. It should show up only on error");
  return false
};

/**
 * The action can be banned via different moderation events,
 * e.g. via the 'delete' event. It's important to prevent
 * banned events from being re-inserted into the database.
 * For example, post 123 was fetched by instance ABC from
 * instance XYZ via the SPASM module. The post got deleted
 * by the moderator of the ABC instance. After a few minutes,
 * instance ABC is fetching posts from instance XYZ again,
 * but it should not insert post 123 into the database since
 * it has been previously deleted by the moderator. Banned
 * posts should also be rejected in they come from multiple
 * other instances.
 */
const isActionBanned = async (
  signature: string
): Promise<boolean> => {
  if (!signature) return false

  const tableName = 'actions'
  const deleteAction = 'moderate'
  const deleteText = 'delete'

  try {
    const checkSignature = await pool.query(`
      SELECT * FROM ${tableName}
      WHERE target = $1
      AND action = $2
      AND text = $3`
      , [signature, deleteAction, deleteText])
    // TODO? Allow post if signer is not a moderator anymore?
    // Get array of signers from each 'delete' moderate event,
    // check if any of the signers is a valid moderator,
    // return true if at least one signer is a valid moderator.
    // E.g., if a moderator became malicious, banned many posts,
    // but then got removed from the moderators list.
    // Although, in that situation an admin can manually delete
    // all actions of that moderator from the database after
    // the timestamp when the moderator became malicious.
    // Thus, posts banned by the malicious moderator won't be
    // banned anymore.
    return checkSignature.rowCount > 0 ? true : false
  } catch (err) {
    console.error('isActionBanned failed', signature, err);
    return false
  }
};

// Reactions_count table is needed to easily fetch all reaction counts
// instead of computing reaction counts for each target upon request.
const incrementActionsCountTable = async (
  action: string,
  target: string,
  text: string,
  time: string
): Promise<boolean> => {
  console.log("increment action:", action);
  console.log("increment target:", target);
  console.log("increment text:", text);
  const tableName = 'actions_count'
  try {
    const isTargetAlreadyInTable = await pool.query(`
      SELECT FROM ${tableName}
      WHERE target = $1`
      , [target])

    // Add target to count table if it doesn't have any actions yet
    if (isTargetAlreadyInTable.rowCount < 1) {
      console.log(`${target} is not in ${tableName}. Adding...`)
      await pool.query(`
        INSERT INTO ${tableName} (target)
        VALUES ($1)`
        , [target])
    }
    
    // Increment total comments count if the action is reply
    if (action === 'reply') {
      const columnToIncremenet = 'comments_count';
      // "val = Coalese(val, 0)" + 1 increments even if val is null
      const updateString = `
      UPDATE ${tableName}
      SET ${columnToIncremenet} = Coalesce(${columnToIncremenet}, 0) + 1,
      latest_action_added_time = $2
        WHERE target = $1`
      const updateValues = [target, time]
      await pool.query(updateString, updateValues)
      return true

    // Increment certain reaction count if the action is react
    } else if (action === 'react') {
      const reaction = text;
      // "val = Coalese(val, 0)" + 1 increments even if val is null
      const updateString = `
      UPDATE ${tableName}
      SET ${reaction} = Coalesce(${reaction}, 0) + 1,
      latest_action_added_time = $2
        WHERE target = $1`
      const updateValues = [target, time]
      await pool.query(updateString, updateValues)
      return true
    }

    return false
  } catch (err) {
    console.error('incrementActionsCountTable failed', target, err);
  }
  console.log("The end of incrementing function. It should show up only on error");
  return false
};

// Variables are passed in a parameterized query to prevent SQL injections.
// TODO: pass table name to a function depending on the action.
const insertActionSignature = async (
  action: string,
  target: string,
  title: string,
  text: string,
  signer: string,
  signedString: string,
  signature: string,
  signedDate: string,
  time: string
) => {
  console.log("inserting target:", target)
  const tableName = 'actions'
  try {
    const newAction = await pool.query(
      `INSERT INTO ${tableName}
      (action, target, title, text, signer, signed_message, signature, signed_time, added_time)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
      // RETURNING *`
      , [action, target, title, text, signer, signedString, signature, signedDate, time]
    );
    console.log("Action has beed inserted")
    return true
  } catch (err) {
    console.error('insertActionSignature failed', target, err);
  }
};
