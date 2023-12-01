const DOMPurify = require('isomorphic-dompurify');
const pool = require("../../db");
const enableShortUrlsForWeb3Actions = process.env.ENABLE_SHORT_URLS_FOR_WEB3_ACTIONS === 'false' ? false : true;

// Override console.log for production
if (process.env.NODE_ENV !== "dev") {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

const fetchFullIdsFromShortId = async (dirtyId) => {
  if (!enableShortUrlsForWeb3Actions) return []

  const id = DOMPurify.sanitize(dirtyId)
  if (typeof(id) !== "string") { return []}
  // Exit if ID length is short to minimize DDoS attacks
  if (id.length < 15) { return []}

  try {
    let data
    let postsTable, idColumn, author, date

    // web3
    postsTable = 'actions'
    idColumn = 'signature'
    author = 'signer'
    date = 'added_time'
    
    data = await fetchFullIds(postsTable, idColumn, author, date, id)

    return data
  } catch (err) {
    console.error('fetchFullIds failed:', err.message);
  }
}

// 'id' is passed in a parameterized query to prevent SQL injections
const fetchFullIds = async (postsTable, idColumn, author, date, id) => {
  // '%' is added to match all values that start with id
  const idLike = id + '%'
  try {
    // It's important to exclude ${actionsCountTable}.target column from SELECT
    // because otherwise it will overwrite ${postsTable}.target column
    // Another solution is to rename ${actionsCountTable}.target column in db
    const fullIds = await pool.query(`
      SELECT ${idColumn}, ${author}, ${date}
      FROM ${postsTable}
      WHERE ${idColumn} LIKE $1
      ORDER BY ${date} ASC
      LIMIT 30`
    , [idLike] );
    return fullIds.rows
  } catch (err) {
    console.error(err);
  }
}
module.exports = fetchFullIdsFromShortId;
