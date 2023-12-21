// const pool = require("../../db");
import { pool } from "../../db";
import { FeedFilters, FiltersWebType, PostAction, Post } from "../../types/interfaces";

// Override console.log for production
if (process.env.NODE_ENV !== "dev") {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

export const fetchAllPosts = async (filters: FeedFilters) => {
  try {
    // Options
    let web2: Boolean = true
    let web3: Boolean = true
    // const ipfs = false
    
    let data = []
    let web2Posts = []
    let web3Posts = []
    let ipfsPosts = []

    // web2
    if (filters?.webType === 'web2') {
      web2 = true
      web3 = false
    // web3
    } else if (filters?.webType === 'web3') {
      web2 = false
      web3 = true
    // all
    } else if (
      !filters?.webType ||
      filters?.webType === 'any' ||
      filters?.webType === 'all'
    ) {
      web2 = true
      web3 = true
    // default (e.g. 'web1')
    } else {
      web2 = false
      web3 = false
    }

    if (web2) {
      web2Posts = await fetchPosts('web2', filters)
    }

    if (web3) {
      web3Posts = await fetchPosts('web3', filters)
    }

    // ipfs

    let res = data.concat(web2Posts).concat(web3Posts).concat(ipfsPosts)
    
    res = sortPosts(res)

    return res
  } catch (err) {
    console.error(err.message);
  }
}

const fetchPosts = async (webType: FiltersWebType, filters: FeedFilters) => {
  
  // web2 | web3
  type TableName = 'posts' | 'actions'
  type ActionsCountTable = 'actions_count'
  type JoinIdColumn = 'url' | 'signature'
  type DateColumn = 'pubdate' | 'added_time' 

  let tableName: TableName
  let actionsCountTable: ActionsCountTable
  let joinId: JoinIdColumn
  let date: DateColumn
  let action: PostAction = null

  switch (webType) {
    case 'web2':
      tableName = 'posts'
      actionsCountTable = 'actions_count'
      joinId = 'url'
      date = 'pubdate'
      break
    case 'web3':
      tableName = 'actions'
      actionsCountTable = 'actions_count'
      joinId = 'signature'
      date = 'added_time'
      action = 'post'
      break
    default:
      tableName = 'actions'
      actionsCountTable = 'actions_count'
      joinId = 'signature'
      date = 'added_time'
      action = 'post'
  }

  try {
    // console.log('======================================')
    // console.log('Data in fetchPosts in fetchAllposts.js')
    // console.log('webType:', webType)
    // console.log('tableName:', tableName)
    // console.log('filters:', filters)

    // TODO: delete unnecessary fields from query (target, latest_reaction_added_date?) 
    
    // It's important to exclude ${actionsCountTable}.target column from SELECT
    // because otherwise it will overwrite ${tableName}.target column
    // Another solution is to select target as c.target
    // Another solution is to rename ${actionsCountTable}.target column in db
    let searchQuery = `
      SELECT ${tableName}.*,
      ${actionsCountTable}.upvote,
      ${actionsCountTable}.downvote,
      ${actionsCountTable}.bullish,
      ${actionsCountTable}.bearish,
      ${actionsCountTable}.important,
      ${actionsCountTable}.scam,
      ${actionsCountTable}.comments_count,
      ${actionsCountTable}.latest_action_added_time
      FROM ${tableName}
      LEFT JOIN ${actionsCountTable}
      ON ${tableName}.${joinId} = ${actionsCountTable}.target
      WHERE id = id`

    // AND (
    //   ('${filters.category}' != 'null'
    //     AND category = '${filters.category}')
    //   OR
    //   ('${filters.category}' = 'null'
    //     AND (category = category OR category is null))
    // )

    if (filters.category && filters.category !== 'any') {
      // AND (category = '${filters.category}')`
      // Refactored: filters.category is passed as a parameter
      // in a parameterized query to prevent SQL injections.
      searchQuery += `
      AND (category = $1)`
    }

    // Action (post, react, reply) is needed for web3 only
    if (action) { searchQuery += `
      AND (action = '${action}')` }

    let filtersActivityCount = 0 
    // let activityQuery = ''

    switch (filters.activity) {
      case 'hot':
        filtersActivityCount = 2
        break
      case 'rising':
        filtersActivityCount = 1
        break
      default:
        filtersActivityCount = 0
    }

    if (filtersActivityCount > 0) {
      searchQuery += `
        AND (
          ${actionsCountTable}.bullish >= COALESCE(${filtersActivityCount}, 0)
          OR ${actionsCountTable}.bearish >= COALESCE(${filtersActivityCount}, 0)
          OR ${actionsCountTable}.important >= COALESCE(${filtersActivityCount}, 0)
          OR ${actionsCountTable}.scam >= COALESCE(${filtersActivityCount}, 0)
          OR ${actionsCountTable}.upvote >= COALESCE(${filtersActivityCount}, 0)
          OR ${actionsCountTable}.downvote >= COALESCE(${filtersActivityCount}, 0)
          OR ${actionsCountTable}.comments_count >= COALESCE(${filtersActivityCount}, 0)
        )`
    } 

    let searchLimit = 20 

    switch (webType) {
      case 'web3':
        searchLimit = filters.limitWeb3
        break
      case 'web2':
        searchLimit = filters.limitWeb2
        break
      default:
        searchLimit = 20
    }

    searchQuery += `
      ORDER BY ${date} DESC
      LIMIT COALESCE(${searchLimit}, 20)`

      // filters.category is passed as a parameter to a parameterized query
      // to prevent SQL injections.
      let allPosts
      if (!filters.category || filters.category === 'any') {
        // When category is null or 'any', we don't add a parameter to a query
        allPosts = await pool.query(searchQuery);
      } else {
        allPosts = await pool.query(searchQuery, [filters.category]);
      }

      return allPosts.rows

  } catch (err) {
    console.error(err.message);
  }
}

// web2 posts have .pubdate, while web3 posts have .added_time
// thus, we can either normalize data or use this solution
const sortPosts = (array: Post[]) => {
 array.sort(function (a, b) {
   // Typescript only allows arithmetic operations with values of type
   // 'any', 'number', 'bigint', or 'enum', so we have to firstly
   // convert 'pubdate' and 'added_time' to Date objects with new Date()
   // and then to numbers with getTime().
   const aPubdate = a.pubdate ? new Date(a.pubdate).getTime() : 0;
   const bPubdate = b.pubdate ? new Date(b.pubdate).getTime() : 0;
   const aAddedTime = a.added_time ? new Date(a.added_time).getTime() : 0;
   const bAddedTime = b.added_time ? new Date(b.added_time).getTime() : 0;

   if (aPubdate && bPubdate) {
     return bPubdate - aPubdate;
   } else if (aPubdate && bAddedTime) {
     return bAddedTime - aPubdate;
   } else if (aAddedTime && bAddedTime) {
     return bAddedTime - aAddedTime;
   } else if (aAddedTime && bPubdate) {
     return bPubdate - aAddedTime;
   }
 });
 return array;
}

// An approach below throws TS error since 'pubdate' and 'added_time'
// are not of type 'any', 'number', 'biging', or 'enum'.
// const sortPosts = (array: Post[]) => {
//   array.sort(function (a, b) {
//     if (a.pubdate && b.pubdate) {
//       return b.pubdate - a.pubdate
//     } else if (a.pubdate && b.added_time) {
//       return b.added_time - a.pubdate
//     } else if (a.added_time && b.added_time) {
//       return b.added_time - a.added_time
//     } else if (a.added_time && b.pubdate) {
//       return b.pubdate - a.added_time
//     }
//   })
//   return array
// }
