import { pool } from "../../db";
import { FeedFilters } from "../../types/interfaces";

// Override console.log for production
if (process.env.NODE_ENV !== "dev") {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

export const fetchLatestComments = async (filters: FeedFilters) => {
  const searchLimitDefault = 40
  const searchLimitMax = 250

  let searchLimit = searchLimitDefault 

  if (filters?.limitWeb3) {
    // Convert filters.limitWeb3 to a number if it's not already
    searchLimit = Number(filters.limitWeb3)

    // Handle NaN if conversion above has failed, e.g., if
    // filter limits have letters like '123abc'.
    if (isNaN(searchLimit)) {
     searchLimit = searchLimitDefault; // Fallback to default
    }
  }

  // Ensure searchLimit does not exceed max value
  searchLimit = Math.min(searchLimit, searchLimitMax);

  try {
    // TODO: delete unnecessary fields from query (target, latest_reaction_added_date?) 
    let data
    let postsTable, actionsCountTable, joinId, signerColumn, date

    // web3
    postsTable = 'actions'
    actionsCountTable = 'actions_count'
    joinId = 'signature'
    date = 'added_time'
    
    data = await fetchPosts(postsTable, actionsCountTable, joinId, date, searchLimit)

    return data
  } catch (err) {
    console.error('fetchLatestComments failed:', err.message);
  }
}

const fetchPosts = async (postsTable, actionsCountTable, joinId, date, searchLimit) => {
  try {
    // It's important to exclude ${actionsCountTable}.target column from SELECT
    // because otherwise it will overwrite ${postsTable}.target column
    // Another solution is to rename ${actionsCountTable}.target column in db
    const posts = await pool.query(`
      SELECT ${postsTable}.*,
      ${actionsCountTable}.upvote,
      ${actionsCountTable}.downvote,
      ${actionsCountTable}.bullish,
      ${actionsCountTable}.bearish,
      ${actionsCountTable}.important,
      ${actionsCountTable}.scam,
      ${actionsCountTable}.comments_count,
      ${actionsCountTable}.latest_action_added_time
      FROM ${postsTable}
      LEFT JOIN ${actionsCountTable}
      ON ${postsTable}.${joinId} = ${actionsCountTable}.target
      WHERE action='reply'
      ORDER BY ${date} DESC
      LIMIT $1`
    , [searchLimit] );
    // console.log('posts.rows[0] at fetchPosts in fetchLatestComments.js:', posts.rows[0])
    return posts.rows
  } catch (err) {
    console.error(err);
  }
}
