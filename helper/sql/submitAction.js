const DOMPurify = require('isomorphic-dompurify');
const ethers = require("ethers");
const pool = require("../../db");
const enableNewWeb3ActionsAll = process.env.ENABLE_NEW_WEB3_ACTIONS_ALL === 'false' ? false : true;
const enableNewWeb3ActionsPost = process.env.ENABLE_NEW_WEB3_ACTIONS_POST === 'false' ? false : true;
const enableNewWeb3ActionsReact = process.env.ENABLE_NEW_WEB3_ACTIONS_REACT === 'false' ? false : true;
const enableNewWeb3ActionsReply = process.env.ENABLE_NEW_WEB3_ACTIONS_REPLY === 'false' ? false : true;
const enableNewWeb3ActionsModerate = process.env.ENABLE_NEW_WEB3_ACTIONS_MODERATE === 'false' ? false : true;

// Override console.log for production
if (process.env.NODE_ENV !== "dev") {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

const submitAction = async (body) => {
  console.log("submitAction.js was called")
  try {
    let { signedString, signature, signer } = body
    const signedObject = JSON.parse(signedString)
    let { target, action, title, text } = signedObject
    let signedDate = signedObject.time
    const time = new Date(Date.now()).toISOString();
    // const time = new Date().toISOString().slice(0, 19).replace('T', ' ');
    // console.log(time)
    // output: 2012-06-22 05:40:06

    // Test dirty HTML
    // text = "<img src=x onerror=alert(1)//>"

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

    if (!verifySignature( signedString, signature, signer )) return "ERROR: invalid signature"
    
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

const verifySignature = (signedString, signature, signer) => {
  console.log('verifySignature was called')
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

module.exports = submitAction;
