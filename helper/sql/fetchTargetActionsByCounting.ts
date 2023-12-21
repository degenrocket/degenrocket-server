const DOMPurify = require('isomorphic-dompurify');
// const pool = require("../../db");
import { pool } from "../../db";

// Override console.log for production
if (process.env.NODE_ENV !== "dev") {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

/* Version: one_v2.1.2
 * Select how many actions this target has from unique signers
 * e.g. target:xyz, bullish:3, bearish:null, important:1, comments: 3, date:2021 */
// 'id' is passed in a parameterized query to prevent SQL injections
export const fetchTargetActionsByCounting = async (dirtyId) => {
  const id = DOMPurify.sanitize(dirtyId)
  console.log('fetchTargetActionsByCounting called with id:', id)
  const actionTypes = [ 'upvote', 'downvote', 'bullish', 'bearish', 'important', 'scam' ]
  const tableName = 'actions'

  const queryString = `
    WITH unique_targets AS (SELECT DISTINCT target FROM ${tableName}
                            WHERE target = $1)
      , unique_up AS (SELECT DISTINCT target, signer FROM ${tableName} WHERE text = $2
                        AND target = $1)
      , unique_down AS (SELECT DISTINCT target, signer FROM ${tableName} WHERE text = $3
                        AND target = $1)
      , unique_bull AS (SELECT DISTINCT target, signer FROM ${tableName} WHERE text = $4
                        AND target = $1)
      , unique_bear AS (SELECT DISTINCT target, signer FROM ${tableName} WHERE text = $5
                        AND target = $1)
      , unique_imp AS (SELECT DISTINCT target, signer FROM ${tableName} WHERE text = $6
                        AND target = $1)
      , unique_scam AS (SELECT DISTINCT target, signer FROM ${tableName} WHERE text = $7
                        AND target = $1)
      , unique_comm AS (SELECT DISTINCT target, text, signer FROM ${tableName}
               WHERE target = $1 AND action = 'reply')
      , count_up AS (SELECT target, count(*) AS upvote FROM unique_up GROUP BY target)
      , count_down AS (SELECT target, count(*) AS downvote FROM unique_down GROUP BY target)
      , count_bull AS (SELECT target, count(*) AS bullish FROM unique_bull GROUP BY target)
      , count_bear AS (SELECT target, count(*) AS bearish FROM unique_bear GROUP BY target)
      , count_imp AS (SELECT target, count(*) AS important FROM unique_imp GROUP BY target)
      , count_scam AS (SELECT target, count(*) AS scam FROM unique_scam GROUP BY target)
      , count_comm AS (SELECT target, count(*) AS comments_count FROM unique_comm GROUP BY target)
      , latest_reaction_added_time AS (SELECT DISTINCT target, MAX(added_time) FROM ${tableName} 
                       WHERE target = $1 GROUP BY target)
      SELECT unique_targets.target
      , upvote
      , downvote
      , bullish
      , bearish
      , important
      , scam
      , comments_count
      , max AS latest_reaction_added_time
      FROM unique_targets
      LEFT JOIN count_up
      ON unique_targets.target = count_up.target
      LEFT JOIN count_down
      ON unique_targets.target = count_down.target
      LEFT JOIN count_bull
      ON unique_targets.target = count_bull.target
      LEFT JOIN count_bear
      ON unique_targets.target = count_bear.target
      LEFT JOIN count_imp
      ON unique_targets.target = count_imp.target
      LEFT JOIN count_scam
      ON unique_targets.target = count_scam.target
      LEFT JOIN count_comm
      ON unique_targets.target = count_comm.target
      LEFT JOIN latest_reaction_added_time
      ON unique_targets.target = latest_reaction_added_time.target`
  
  try {
    const allActionsCountedForThisId = await pool.query(
      queryString, [
        id,
        actionTypes[0],
        actionTypes[1],
        actionTypes[2],
        actionTypes[3],
        actionTypes[4],
        actionTypes[5]
      ]
    )
    return allActionsCountedForThisId.rows 
  } catch (err) {
    console.error('fetchTargetActionsByCounting failed', err);
  }
}
