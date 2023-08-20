const DOMPurify = require('isomorphic-dompurify');
const pool = require("../../db");

// Override console.log for production
if (process.env.NODE_ENV !== "dev") {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

const fetchPostById = async (dirtyId) => {
  const id = DOMPurify.sanitize(dirtyId)
  console.log("fetchPostById called for id:", id)

  try {
    // TODO: delete unnecessary fields from query (target, latest_reaction_added_date?) 
    // TODO: think whether to change id column in the db from int to bigint 
    let data
    let postsTable, actionsCountTable, joinId, idColumn, date

    // web2.
    // Firstly, search id in a web2 table (posts) if id is an integer or a URL

    // check if value is an integer, then it's probably a db ID
    const isInteger = (value) => { return /^\d+$/.test(value); }
    if (isInteger(id)) { idColumn = 'id' }

    // check if value has a dot (period), then it's probably a URL
    const isURL = (value) => { return /\.+/.test(value); }
    if (isURL(id)) { idColumn = 'url' }
    
    // if id is an integer or a URL, then search in a web2 table called 'posts'
    if (idColumn) {
      console.log('id in fetchPostById.js is int or url, idColumn is:', idColumn)
      postsTable = 'posts'
      actionsCountTable = 'actions_count'
      joinId = 'url'
      idColumn = idColumn
      date = 'pubdate'
      console.log('searching web2 in db in column:', idColumn)
      data = await fetchPost(postsTable, actionsCountTable, joinId, idColumn, date, id)

      if (data) { return data }
      console.log('web2 id has not been found in fetchPostById.js, id:', id)
      
      // if a URL is not found, try adding '/' at the end
      if (idColumn === 'url' && typeof(id) === 'string') {
        newId = id + '/'
        console.log(`Adding '/' to id and searching again. newId:`, newId)
        data = await fetchPost(postsTable, actionsCountTable, joinId, idColumn, date, newId)

        if (data) { return data }
      }

      console.log('web2 int or url has not been found in db')

      // TODO: if a URL string ends with '/', then try to search without '/'
    }

    console.log(`id in fetchPostById.js isn't in db or it's not INT/URL, continue...`)
    
    // web2. More advanced options to check if string is a URL
    //
    // another regex for url:
    // ^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$
    //
    // more advanced regex for url:
    // /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i

    
    // web3. If web2 search didn't return anything, then try web3
    postsTable = 'actions'
    actionsCountTable = 'actions_count'
    joinId = 'signature'
    idColumn = 'signature'
    date = 'added_time'
    
    console.log('searching web3 in db in column:', idColumn)
    data = await fetchPost(postsTable, actionsCountTable, joinId, idColumn, date, id)

    return data
  } catch (err) {
    console.error('fetchPostById failed:', err.message);
  }
}

// 'id' is passed in a parameterized query to prevent SQL injections
const fetchPost = async (postsTable, actionsCountTable, joinId, idColumn, date, id) => {
  try {
    // It's important to exclude ${actionsCountTable}.target column from SELECT
    // because otherwise it will overwrite ${postsTable}.target column
    // Another solution is to rename ${actionsCountTable}.target column in db
    const post = await pool.query(`
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
      WHERE ${idColumn} = $1
      ORDER BY ${date} DESC
      LIMIT 1`
    , [id] );
    console.log('post.rows[0] at fetchPostById in fetchPostById.js:', post.rows[0])
    return post.rows[0]
  } catch (err) {
    console.error(err);
  }
}

module.exports = fetchPostById;
