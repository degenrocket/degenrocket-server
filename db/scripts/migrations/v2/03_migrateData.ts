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

// const fetchAllWeb3Events = async () => {
//   const searchLimit = 20000
//   const searchQuery = `
//     SELECT * FROM actions
//     ORDER BY added_time DESC
//     LIMIT COALESCE($1, 20)`
//   const allEvents = await pool.query(searchQuery, [searchLimit]);
//   return allEvents.rows
// }

const fetchWeb3EventsByBatch = async (
  firstId: number,
  lastId: number
) => {
  const searchQuery = `
    SELECT * FROM actions
    WHERE id >= $1 AND id < $2
    ORDER BY id ASC
    `
  const allEvents = await pool.query(searchQuery, [firstId, lastId]);
  return allEvents.rows
}

// const fetchAllWeb2Events = async () => {
//   const searchLimit = 20000
//   const searchQuery = `
//     SELECT * FROM posts
//     ORDER BY pubdate DESC
//     LIMIT COALESCE($1, 20)`
//   const allEvents = await pool.query(searchQuery, [searchLimit]);
//   return allEvents.rows
// }

const fetchWeb2EventsByBatch = async (
  firstId: number,
  lastId: number
) => {
  const searchQuery = `
    SELECT * FROM posts
    WHERE id >= $1 AND id < $2
    ORDER BY id ASC
    `
  const allEvents = await pool.query(searchQuery, [firstId, lastId]);
  return allEvents.rows
}

const idsOfEventsInsertedIntoDb: string[] = []

const saveEventsIntoDb = async (
  events: SpasmEventDatabaseV2[]
): Promise<boolean> => {
  const results: boolean[] = await Promise.all(
    events.map((event) => {
      return saveEventIntoDb(event)
    })
  )
  return results.every(result => result)
}

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

const incrementStatsFromEvents = async (
  events: SpasmEventDatabaseV2[]
): Promise<boolean> => {
  const results = []
  // Execute sequentially one by one
  for (const event of events) {
    const result = await incrementStats(event)
    results.push(result)
  }

  return results.every(result => result)
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

const processWeb2BatchToInsert = async (
  firstId: number,
  lastId: number
) => {
  console.log(`Processing web2 IDs: ${firstId} - ${lastId}`)
  const postsWeb2: any[] =
    await fetchWeb2EventsByBatch(firstId, lastId)

  const result = await saveEventsIntoDb(postsWeb2)

  return result
}

const processWeb3BatchToInsert = async (
  firstId: number,
  lastId: number
) => {
  console.log(`Processing web3 IDs: ${firstId} - ${lastId}`)
  const postsWeb3: any[] =
    await fetchWeb3EventsByBatch(firstId, lastId)

  const result = await saveEventsIntoDb(postsWeb3)

  return result
}

const processWeb3BatchToIncrement = async (
  firstId: number,
  lastId: number
) => {
  console.log(`Processing web3 IDs: ${firstId} - ${lastId}`)
  const postsWeb3: any[] =
    await fetchWeb3EventsByBatch(firstId, lastId)

  const result = await incrementStatsFromEvents(postsWeb3)

  return result
}

const findTotalIdsWeb2 = async () => {
  const searchQuery = `
    SELECT id FROM posts
    ORDER BY id DESC
    LIMIT 1`
  const totalIds = await pool.query(searchQuery);
  if (
    totalIds &&
    Array.isArray(totalIds.rows) &&
    totalIds?.rows?.[0] &&
    totalIds?.rows?.[0].id
  ) {
    return totalIds.rows[0].id
  } else {
    return 0
  }
}

const findTotalIdsWeb3 = async () => {
  const searchQuery = `
    SELECT id FROM actions
    ORDER BY id DESC
    LIMIT 1`
  const totalIds = await pool.query(searchQuery);
  if (
    totalIds &&
    Array.isArray(totalIds.rows) &&
    totalIds?.rows?.[0] &&
    totalIds?.rows?.[0].id
  ) {
    return totalIds.rows[0].id
  } else {
    return 0
  }
}

const startMigration = async () => {
  try {
    console.log("----------------")
    console.log("Migration is done in batches to make sure that Node.js doesn't run out of memory.")

    // save web2
    console.log("Migrating web2 events:")
    const batchSizeWeb2 = 200
    let offsetWeb2 = 0
    const web2HighestId = await findTotalIdsWeb2()
    const numberOfBatchesWeb2 =
      Math.ceil(web2HighestId / batchSizeWeb2)

    console.log("web2 post highest ID:", web2HighestId)
    console.log("web2 number of batches:", numberOfBatchesWeb2)

    for (let i = 0; i < numberOfBatchesWeb2; i++) {
      await processWeb2BatchToInsert(
        offsetWeb2, offsetWeb2 + batchSizeWeb2
      ) 
      offsetWeb2 += batchSizeWeb2
    }

    // save web3
    console.log("----------------")
    console.log("Migrating web3 events:")
    const batchSizeWeb3 = 200
    let offsetWeb3 = 0
    const web3HighestId = await findTotalIdsWeb3()
    const numberOfBatchesWeb3 =
      Math.ceil(web3HighestId / batchSizeWeb3)

    console.log("web3 event highest ID:", web3HighestId)
    console.log("web3 number of batches:", numberOfBatchesWeb3)

    for (let i = 0; i < numberOfBatchesWeb3; i++) {
      await processWeb3BatchToInsert(
        offsetWeb3, offsetWeb3 + batchSizeWeb3
      ) 
      offsetWeb3 += batchSizeWeb3
    }

    // Only web3 posts are used to increment stats
    // increment reactions from web3 events
    console.log("----------------")
    console.log("Incrementing reactions from web3 events:")
    // reset web3 index to 0
    offsetWeb3 = 0
    for (let i = 0; i < numberOfBatchesWeb3; i++) {
      await processWeb3BatchToIncrement(
        offsetWeb3, offsetWeb3 + batchSizeWeb3
      ) 
      offsetWeb3 += batchSizeWeb3
    }
    console.log("----------------")
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
