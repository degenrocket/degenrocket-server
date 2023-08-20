const DOMPurify = require('isomorphic-dompurify');
const pool = require("../../db");

// Override console.log for production
if (process.env.NODE_ENV !== "dev") {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

/* Version: one_v2.1.
 * Select how many actions this target has from unique signers
 * e.g. target:xyz, bullish:3, bearish:null, important:1, comments: 3, date:2021 */
// 'id' is passed in a parameterized query to prevent SQL injections
const fetchTargetComments = async (dirtyId) => {
  const id = DOMPurify.sanitize(dirtyId)
  console.log('========================================');
  console.log('fetchTargetComments called with id:', id);
  try {
    let result;
    result = await fetchChildren(id)
    result = sortComments(result)

    const recursiveFetch = async (result) => {
      for (let index = 0; index < result.length; index++) {
        console.log('========= recursiveFetch - start. index:', index, ' =============')
        const item = result[index]
        const target = item.signature
        let children = await fetchChildren(target)
        result[index].children = children
        // console.log('result['+index+'].children:', result[index].children)
        if (result[index].children) { await recursiveFetch(result[index].children) }
        result = sortComments(result)
      }
      return result
    }

    result = await recursiveFetch(result)

    console.log('Done')
    return result

  } catch (err) {
    console.error(err);
  }
}

const sortComments = (array) => {
  array.sort(function (a, b) {
    return b.upvote - a.upvote
  })
  return array
}

const fetchChildren = async (id) => {
  console.log('fetchChildren called with id:', id);
  const targetTable = 'actions'
  const actionsTable = 'actions_count'

  try {
    // Old simple version, but without reactions_count
    // const queryString = `
    //   SELECT * FROM ${targetTable} WHERE action = 'reply' AND target = $1`

    // count_reactions_for_one_comment_v.0.1
    // More expensive query, but with reactions_count for upvote/downvote
    const queryString = `
      WITH replies AS (SELECT * FROM ${targetTable}
                        WHERE action ='reply' AND target = $1)
      SELECT replies.target
      , replies.action
      , replies.title
      , replies.text
      , replies.signer
      , replies.signed_message
      , replies.signature
      , replies.signed_time
      , replies.added_time
      , actions_count.upvote
      , actions_count.downvote
      , actions_count.comments_count
      , actions_count.latest_action_added_time
      FROM replies
      LEFT JOIN ${actionsTable}
      ON replies.signature = actions_count.target`

    const allCommentsForThisId = await pool.query(
      queryString, [id]
    )
    return allCommentsForThisId.rows 
  } catch (err) {
    console.error('fetchTargetComments failed', err);
  }
}

module.exports = fetchTargetComments;
