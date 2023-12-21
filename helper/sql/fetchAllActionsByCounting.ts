// const pool = require("../../db");
import { pool } from "../../db";

// Override console.log for production
if (process.env.NODE_ENV !== "dev") {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

// Do NOT delete, because this function can be used to recount
// the actions_count table.

// Fetch combined table of different reactions for all targets.
// This request requires lots of computation if targets have many reactions.
// Thus, it's better to fetch from a combined table of all reaction counts,
// which is managed separatly by incrementing count when reaction is added.

// Version:all_v3.1.4. Combined table of different reactions for all targets.
// 'unique_...' filter is needed to get rid of duplicate signers,
// e.g. if signer submitted 'Important' reactions multiple times
// with different signatures due to different timestamp.

/* To modify a query to recount all reactions
 * and save the result to actions_count table,
 * simply add these 2 lines on top of the query:
 * TRUNCATE TABLE reactions_count;
 * INSERT INTO reactions_count
 */
export const fetchAllActionsByCounting = async () => {
  const tableName = 'actions'
  const queryString = `
    WITH unique_targets AS (SELECT DISTINCT target FROM ${tableName})
    , unique_up AS (SELECT DISTINCT target, signer FROM ${tableName} WHERE text = 'upvote')
    , unique_down AS (SELECT DISTINCT target, signer FROM ${tableName} WHERE text = 'downvote')
    , unique_bull AS (SELECT DISTINCT target, signer FROM ${tableName} WHERE text = 'bullish')
    , unique_bear AS (SELECT DISTINCT target, signer FROM ${tableName} WHERE text = 'bearish')
    , unique_imp AS (SELECT DISTINCT target, signer FROM ${tableName} WHERE text = 'important')
    , unique_scam AS (SELECT DISTINCT target, signer FROM ${tableName} WHERE text = 'scam')
    , unique_comm AS (SELECT DISTINCT target, text, signer FROM ${tableName} WHERE action = 'reply')
    , count_up AS (SELECT target, count(*) AS upvote FROM unique_up GROUP BY target)
    , count_down AS (SELECT target, count(*) AS downvote FROM unique_down GROUP BY target)
    , count_bull AS (SELECT target, count(*) AS bullish FROM unique_bull GROUP BY target)
    , count_bear AS (SELECT target, count(*) AS bearish FROM unique_bear GROUP BY target)
    , count_imp AS (SELECT target, count(*) AS important FROM unique_imp GROUP BY target)
    , count_scam AS (SELECT target, count(*) AS scam FROM unique_scam GROUP BY target)
    , count_comm AS (SELECT target, count(*) AS comments_count FROM unique_comm GROUP BY target)
    , latest_reaction_added_time AS (SELECT DISTINCT target, MAX(added_time) FROM ${tableName} GROUP BY target)
    SELECT unique_targets.target, upvote, downvote, bullish, bearish, important, scam, comments_count
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
    ON unique_targets.target = latest_reaction_added_time.target;`
  try {
    const allReactions = await pool.query(queryString)
    return allReactions.rows
  } catch (err) {
    console.error(err);
  }
}
