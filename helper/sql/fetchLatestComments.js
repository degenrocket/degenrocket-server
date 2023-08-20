const pool = require("../../db");

// Override console.log for production
if (process.env.NODE_ENV !== "dev") {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

const fetchLatestComments = async () => {

  try {
    // TODO: delete unnecessary fields from query (target, latest_reaction_added_date?) 
    let data
    let postsTable, actionsCountTable, joinId, signerColumn, date

    // web3
    postsTable = 'actions'
    actionsCountTable = 'actions_count'
    joinId = 'signature'
    date = 'added_time'
    
    data = await fetchPosts(postsTable, actionsCountTable, joinId, date)

    return data
  } catch (err) {
    console.error('fetchLatestComments failed:', err.message);
  }
}

const fetchPosts = async (postsTable, actionsCountTable, joinId, date) => {
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
      LIMIT 20`
    , [] );
    // console.log('posts.rows[0] at fetchPosts in fetchLatestComments.js:', posts.rows[0])
    return posts.rows
  } catch (err) {
    console.error(err);
  }
}

module.exports = fetchLatestComments;
