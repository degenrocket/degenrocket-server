const DOMPurify = require('isomorphic-dompurify');
// const pool = require("../../db");
import { pool } from "../../db";

// Override console.log for production
if (process.env.NODE_ENV !== "dev") {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

export const fetchPostsByAuthor = async (dirtySigner) => {
  const signer = DOMPurify.sanitize(dirtySigner)
  console.log("fetchPostsByAuthor called for signer:", signer)
  console.log("signer length:", signer.length)
  if (typeof(signer) !== "string") { return []}
  if (signer.length > 63) { return []}

  try {
    // TODO: delete unnecessary fields from query (target, latest_reaction_added_date?) 
    let data
    let postsTable, actionsCountTable, joinId, signerColumn, date

    // web3
    postsTable = 'actions'
    actionsCountTable = 'actions_count'
    joinId = 'signature'
    signerColumn = 'signer'
    date = 'added_time'
    
    data = await fetchPosts(postsTable, actionsCountTable, joinId, signerColumn, date, signer)

    return data
  } catch (err) {
    console.error('fetchPostsByAuthor failed:', err.message);
  }
}

// 'signer' is passed in a parameterized query to prevent SQL injections
const fetchPosts = async (postsTable, actionsCountTable, joinId, signerColumn, date, signer) => {
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
      WHERE ${signerColumn} = $1
      ORDER BY ${date} DESC
      LIMIT 30`
    , [signer] );
    console.log('posts.rows[0] at fetchPosts in fetchPostsByAuthor.js:', posts.rows[0])
    return posts.rows
  } catch (err) {
    console.error(err);
  }
}
