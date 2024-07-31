import fs from 'fs';
import path from 'path';
// import { fetchPostById } from "../../../../helper/sql/fetchPostById";
import { fetchAllPosts } from "../../../../helper/sql/fetchAllPosts";
// import { pool } from "../../../../db";
import {FeedFilters} from '../../../../types/interfaces';
import {insertSpasmEventV2} from '../../../../helper/sql/sqlUtils';
const { spasm } = require('spasm.js');

console.log("starting migration to v2")
console.log("starting creating new database tables")

// const absolutePath = path.resolve(__dirname, '../../database.sql')
const absolutePath = path.resolve(__dirname, '../../databaseV2.sql')

// Check if a file with database queries exists
if (fs.existsSync(absolutePath)) {
  const sql = fs.readFileSync(absolutePath, 'utf8');
  // console.log("sql:", sql)
}

// const getItem = async () => {
//   try {
//     const result = await pool.query(
//       `SELECT id, title FROM posts WHERE id=$1`
//       // `SELECT id, title FROM posts WHERE id=10;`
//       , [10]
//     );
//     const item = result.rows[0]
//     console.log("item:", item)
//     return item
//   } catch (err) {
//     console.error('getItem failed', err);
//   } finally {
//     await pool.end();
//   }
// }

// getItem()
const id = 123;


const startMigration = async () => {
  const filters: FeedFilters = {
    webType: null,
    category: null,
    platform: null,
    source: null,
    activity: null,
    keyword: null,
    ticker: null,
    limitWeb2: 1,
    limitWeb3: 1
  }

  try {
      const posts = await fetchAllPosts(filters)

      const dbPosts = posts.map((post) => {
        return spasm.convertToSpasmEventDatabase(post)
      })

      // console.log("dbPosts:", dbPosts)
      
      dbPosts.forEach(post => {
        console.log("--------")
        if (post.ids && Array.isArray(post.ids)) {
          post.ids.forEach(id => {
            console.log(id.value)
          })
        }

        // insert
        insertSpasmEventV2(post)

      })

      // save Spasm events into database
      // use promise.all instead of forEach for database insertion
      // res.json(posts);
  } catch (err) {
    console.error(err);
  // }
  } finally {
    // await pool.end();
  }

  // const itemById = await fetchPostById(id);
  //
  // console.log("------------------")
  //
  // console.log("itemById:", itemById)

}

export const migrateData = async (): Promise<boolean> => {
  console.log("migrateData start")
   await startMigration()
  
  // TODO convertToSpasmEventDatabase
   // - try export status to frontend
   // - delete spasm.js v1

  // console.log("spasm:", spasm)
  console.log("migrateData finish")
  // spasm.utilsStatus()
  // console.log("spasm.utilsStatus:", spasm.utilsStatus)
  return true
}
