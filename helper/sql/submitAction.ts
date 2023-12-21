const nostrTools = require('nostr-tools');
const { bech32 } = require('bech32');
const DOMPurify = require('isomorphic-dompurify');
const ethers = require("ethers");
import { pool } from "../../db";
const enableNewWeb3ActionsAll = process.env.ENABLE_NEW_WEB3_ACTIONS_ALL === 'false' ? false : true;
const enableNewWeb3ActionsPost = process.env.ENABLE_NEW_WEB3_ACTIONS_POST === 'false' ? false : true;
const enableNewWeb3ActionsReact = process.env.ENABLE_NEW_WEB3_ACTIONS_REACT === 'false' ? false : true;
const enableNewWeb3ActionsReply = process.env.ENABLE_NEW_WEB3_ACTIONS_REPLY === 'false' ? false : true;
const enableNewWeb3ActionsModerate = process.env.ENABLE_NEW_WEB3_ACTIONS_MODERATE === 'false' ? false : true;
const enableNewNostrActionsAll = process.env.ENABLE_NEW_NOSTR_ACTIONS_ALL === 'false' ? false : true;
const enableNewEthereumActionsAll = process.env.ENABLE_NEW_ETHEREUM_ACTIONS_ALL === 'false' ? false : true;

// Override console.log for production
if (process.env.NODE_ENV !== "dev") {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

export const submitAction = async (body) => {
  try {
    let signedString, signature, signer, target, action, title, text, signedDate

    if (body.dmpEvent) {
      let { dmpEvent } = body
      signedString = dmpEvent.signedString
      signature = dmpEvent.signature
      signer = dmpEvent.signer
      const signedObject = JSON.parse(signedString)
      target = signedObject.target
      action = signedObject.action
      title = signedObject.title
      text = signedObject.text
      signedDate = signedObject.time
    } else if (body.nostrEvent) {
      let { nostrEvent } = body
      signedString = JSON.stringify(nostrEvent)
      signature = nostrEvent.sig
      signer = convertHexToBech32(nostrEvent.pubkey)

      nostrEvent.tags.forEach(function (tag) {
        if (Array.isArray(tag) && tag[0] === "spasm_target") {
          target = tag[1]
        }

        if (Array.isArray(tag) && tag[0] === "spasm_action") {
          action = tag[1]
        }

        if (Array.isArray(tag) && tag[0] === "spasm_title") {
          title = tag[1]
        }
      });

      text = nostrEvent.content

      // Convert the Unix timestamp to a JavaScript Date object
      const date = new Date(nostrEvent.created_at * 1000);

      // Format the date in ISO format
      const timestamptz = date.toISOString();

      signedDate = timestamptz
    } else {
      return "ERROR: the action is neither Nostr, nor DMP"
    }

    const time = new Date(Date.now()).toISOString();
    // const time = new Date().toISOString().slice(0, 19).replace('T', ' ');
    // console.log(time)
    // output: 2012-06-22 05:40:06

    // Test dirty HTML
    // text = "<img src=x onerror=alert(1)//>"

    // signedString is not sanitized because otherwise
    // it wouldn't be possible to check the signature.
    signature = DOMPurify.sanitize(signature)
    signer = DOMPurify.sanitize(signer)
    target = DOMPurify.sanitize(target)
    action = DOMPurify.sanitize(action)
    title = DOMPurify.sanitize(title)
    text = DOMPurify.sanitize(text)
    signedDate = DOMPurify.sanitize(signedDate)

    console.log('POST action:', action);
    console.log('POST target:', target);
    console.log('POST title:', title);
    console.log('POST text:', text);
    console.log('POST signer:', signer);
    console.log('POST signature:', signature);

    if (!enableNewWeb3ActionsAll) return "ERROR: submitting all new web3 actions is currently disabled"

    if (!enableNewNostrActionsAll && body.nostrEvent) return "ERROR: submitting all new Nostr actions is currently disabled"

    if (!enableNewEthereumActionsAll && body.dmpEvent) return "ERROR: submitting all new Ethereum actions is currently disabled"

    if (!enableNewWeb3ActionsPost && action === 'post') {
      return "ERROR: submitting new posts is currently disabled"
    }

    if (!enableNewWeb3ActionsReact && action === 'react') {
      return "ERROR: submitting new reactions is currently disabled"
    }

    if (!enableNewWeb3ActionsReply && action === 'reply') {
      return "ERROR: submitting new replies is currently disabled"
    }

    if (!enableNewWeb3ActionsModerate && action === 'moderate') {
      return "ERROR: submitting new moderation actions is currently disabled"
    }
    
    if (!signature) return "ERROR: signature is null"

    if (body.dmpEvent) {
      if (!verifyEthereumSignature( signedString, signature, signer )) return "ERROR: invalid signature"
    } else if (body.nostrEvent) {
      if (!verifyNostrSignature( body.nostrEvent )) return "ERROR: invalid signature"
    }
    
    if (await isSignatureAlreadyInDB(signature)) {
      console.log("ERROR: action signature is already in database")
      return "ERROR: action signature is already in database"
    }

    // Increment reactions_count table if user
    // didn't have the same reaction before.
    // Uniqueness is checked before the insertion
    // but incrementation is done after the insertion
    // to avoid wrong incrementation if insertion has failed.
    const isToBeIncrementedLater = await isActionUnique(action, target, text, signer)
    console.log('isToBeIncrementedLater:', isToBeIncrementedLater)

    // Insert reaction signature into db
    // even if this signer has already submitted the same reaction
    // for this target, but with different signature 
    const insertSuccess = await insertActionSignature(
      action, target, title, text, signer, signedString, signature, signedDate, time)

    if (!insertSuccess) return "ERROR: signature was not saved into database"

    if (isToBeIncrementedLater) {
      console.log("Action was unique, time to increment it now")
      const incrementSuccess = await incrementActionsCountTable(
        action, target, text, time);

      console.log("++++++++++++++++++++++++++++++++++++++++++++")
      return incrementSuccess
        ? "Success. Action has been saved and incremented"
        : "Action has been saved, but count was not incremented"
    }

    console.log("--------------------------------------------")
    return "Sorry, but you've already submitted the same action"
  } catch (err) {
    console.error('submitReaction failed', body, err);
  }
};

const verifyEthereumSignature = (signedString, signature, signer) => {
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

const verifyNostrSignature = (nostrEvent) => {
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

const isSignatureAlreadyInDB = async (signature) => {
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

const isActionUnique = async (action, target, text, signer) => {
  const tableName = 'actions'
  console.log('tableName in isActionUnique:', tableName)

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

// Reactions_count table is needed to easily fetch all reaction counts
// instead of computing reaction counts for each target upon request.
const incrementActionsCountTable = async (action, target, text, time) => {
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
};

// Variables are passed in a parameterized query to prevent SQL injections.
// TODO: pass table name to a function depending on the action.
const insertActionSignature = async (
  action, target, title, text, signer, signedString, signature, signedDate, time) => {
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

// Utils
const convertHexToBech32 = (hexKey, prefix?) => {
  // Convert private or public key from HEX to bech32
  let bytes = new Uint8Array(hexKey.length / 2);

  for(let i = 0; i < hexKey.length; i+=2) {
      bytes[i/2] = parseInt(hexKey.substr(i, 2), 16);
  }

  const words = bech32.toWords(bytes);

  prefix = prefix ?? 'npub'

  const bech32Key = bech32.encode(prefix, words);

  return bech32Key
}
