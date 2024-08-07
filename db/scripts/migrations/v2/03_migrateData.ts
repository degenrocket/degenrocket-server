import {
  SpasmEventDatabaseV2
} from '../../../../types/interfaces';
import {
  insertSpasmEventV2,
  incrementSpasmEventActionV2,
  fetchEventWithSameSpasmIdFromDbV2,
} from '../../../../helper/sql/sqlUtils';
import { pool } from '../../../../db';
const { spasm } = require('spasm.js');

console.log("starting data migration to V2 tables")

const fetchAllWeb3Events = async () => {
  const searchLimit = 20000
  const searchQuery = `
    SELECT * FROM actions
    ORDER BY added_time DESC
    LIMIT COALESCE($1, 20)`
  const allEvents = await pool.query(searchQuery, [searchLimit]);
  return allEvents.rows
}

const fetchAllWeb2Events = async () => {
  const searchLimit = 20000
  const searchQuery = `
    SELECT * FROM posts
    ORDER BY pubdate DESC
    LIMIT COALESCE($1, 20)`
  const allEvents = await pool.query(searchQuery, [searchLimit]);
  return allEvents.rows
}

const idsOfEventsInsertedIntoDb: string[] = []

const saveEventIntoDb = async (
  event: SpasmEventDatabaseV2
): Promise<boolean> => {
  // Check if event is already in db
  const eventWithSameSpasmidFromDb =
    await fetchEventWithSameSpasmIdFromDbV2(event, pool)

  if (eventWithSameSpasmidFromDb) {
    // console.log("An event with the same Spasm ID is already in V2 tables.")
    return false
  }

  const result = await insertSpasmEventV2(event)

  if (result) {
    idsOfEventsInsertedIntoDb.push(spasm.extractSpasmId01)
    return result
  }

  return false
}

const incrementStats = async (
  event: SpasmEventDatabaseV2
) => {
  const spasmId = spasm.extractSpasmId01
  
  // Only increment if event was inserted during this migration
  if (idsOfEventsInsertedIntoDb.includes(spasmId)) {
    const result = await incrementSpasmEventActionV2(event)
    return result
  }

  return false
}

const startMigration = async () => {
  try {
      const postsWeb2: any[] = await fetchAllWeb2Events()
      const postsWeb3: any[] = await fetchAllWeb3Events()
      const postsWeb2Web3 = postsWeb2.concat(postsWeb3)
      console.log("postsWeb2.length:", postsWeb2.length)
      console.log("postsWeb3.length:", postsWeb3.length)
      console.log("postsWeb2Web3.length:", postsWeb2Web3.length)

      // Used for testing
      // let notSavingEvents = []
      // notSavingEvents.push(postsWeb3[1010])
      // console.log("postsWeb3[1010]:", postsWeb3[1010])

      const resultsSave = await Promise.all(
        postsWeb2Web3.map((event) => {
          return saveEventIntoDb(event)
        })
      )

      // Only web3 posts are used to increment stats
      const dbSpasmEventsV2 = postsWeb3.map((post) => {
        return spasm.convertToSpasm(
          post, { to: { spasm: { version: "2.0.0" } } }
        )
      })

      // Execute sequentially one by one
      for (const event of dbSpasmEventsV2) {
        await incrementStats(event)
      }
  } catch (err) {
    console.error(err);
  // }
  } finally {
    // await pool.end();
  }
}

export const migrateData = async (): Promise<boolean> => {
  console.log("migrateData start")
  await startMigration()
  
  console.log("migrateData finish")
  return true
}
