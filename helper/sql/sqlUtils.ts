import { poolDefault, poolTest } from "../../db";
import {
  // SpasmEventV2,
  SpasmEventDatabaseV2,
  SpasmEventIdFormatNameV2,
  SpasmEventV2,
  UnknownEventV2,
  SpasmEventStatV2,
  FeedFiltersV2
} from "../../types/interfaces";
import {
  hasValue,
  isArrayWithValues,
  isObjectWithValues,
  isStringOrNumber,
  removeDuplicatesFromArray,
  toBeString,
  toBeTimestamp
} from "../utils/utils";
import {
  toBeHex
} from "../utils/nostrUtils";
import { env } from "./../../appConfig";
const DOMPurify = require('isomorphic-dompurify');
const { spasm } = require('spasm.js');

// Override console.log for production
if (process.env.NODE_ENV !== "dev") {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

export const insertSpasmEventV2 = async (
  unknownEvent: UnknownEventV2,
  pool = poolDefault,
  dirtyDbTable = "spasm_events"
): Promise<boolean> => {
  if (!isObjectWithValues(unknownEvent)) return false

  const dbTable = DOMPurify.sanitize(dirtyDbTable)

  // SpasmEventDatabaseV2
  let spasmEventDatabaseV2: SpasmEventDatabaseV2 | null = null

  if (
    'type' in unknownEvent &&
    unknownEvent.type === "SpasmEventDatabaseV2"
  ) {
    spasmEventDatabaseV2 = unknownEvent
  } else {
    spasmEventDatabaseV2 =
      spasm.convertToSpasmEventDatabase(unknownEvent)
  }

  if (!spasmEventDatabaseV2) return false
  if (!isObjectWithValues(spasmEventDatabaseV2)) return false

  const timestamp = toBeTimestamp(
    new Date(Date.now()).toISOString()
  )

  try {
    // Variables are passed in a parameterized query using
    // $1, $2, etc. to prevent SQL injections.
    await pool.query(
      `INSERT INTO ${dbTable}
      (spasm_event, db_added_timestamp, db_updated_timestamp)
        VALUES ($1, $2, $3)`
      // RETURNING *`
      , [spasmEventDatabaseV2, timestamp, timestamp]
    );
    // console.log("Spasm event has beed inserted")
    return true
  } catch (err) {
    console.error('insertSpasmEventV2 failed', err, spasmEventDatabaseV2);
  }
  return false
}

interface EventFromDb {
  spasm_event: any,
  db_key: number | string,
  db_added_timestamp: number | string,
  db_updated_timestamp: number | string,
  stats: any
}

export const joinDbInfo = (
  eventFromDb: EventFromDb,
  dbTable: string | number
): SpasmEventV2 | null => {
  if (!isObjectWithValues(eventFromDb)) return null

  const {
    spasm_event,
    db_key,
    db_added_timestamp,
    db_updated_timestamp,
    stats
  } = eventFromDb

  const spasmEvent: SpasmEventV2 = spasm_event

  if (db_key) {
    // Create db if it's null or undefined
    spasmEvent.db ??= {};
    if (typeof(db_key) === "number") {
      spasmEvent.db.key =
        db_key
    } else if (typeof(db_key) === "string") {
      spasmEvent.db.key =
        Number(db_key)
    }
  }
  if (db_added_timestamp) {
    // Create db if it's null or undefined
    spasmEvent.db ??= {};
    if (typeof(db_added_timestamp) === "number") {
      spasmEvent.db.addedTimestamp =
        db_added_timestamp
    } else if (typeof(db_added_timestamp) === "string") {
      spasmEvent.db.addedTimestamp =
        Number(db_added_timestamp)
    }
  }
  if (db_updated_timestamp) {
    // Create db if it's null or undefined
    spasmEvent.db ??= {};
    if (typeof(db_updated_timestamp) === "number") {
      spasmEvent.db.updatedTimestamp =
        db_updated_timestamp
    } else if (typeof(db_updated_timestamp) === "string") {
      spasmEvent.db.updatedTimestamp =
        Number(db_updated_timestamp)
    }
  }
  if (dbTable) {
    // Create db if it's null or undefined
    spasmEvent.db ??= {};
    if (
      typeof(db_updated_timestamp) === "number" ||
      typeof(db_updated_timestamp) === "string"
    ) {
      spasmEvent.db.table = dbTable
    }
  }

  if (stats && Array.isArray(stats) && hasValue(stats)) {
    spasmEvent.stats = stats
  }
  return spasmEvent
}

export const fetchAllSpasmEventsV2ById = async (
  dirtyId: string | number,
  pool = poolDefault,
  dirtyDbTable = "spasm_events"
): Promise<SpasmEventV2[] | null> => {
  if (
    !dirtyId ||
    (
      typeof(dirtyId) !== "string" &&
      typeof(dirtyId) !== "number"
    )
  ) return null

  const id = DOMPurify.sanitize(toBeString(dirtyId))
  const dbTable = DOMPurify.sanitize(dirtyDbTable)

  try {
      // EXPLAIN ANALYZE
    const res = await pool.query(`
      SELECT *
      FROM ${dbTable}
      WHERE spasm_event @> $1::jsonb
      `,
      [
        {
          "ids": [
            {
              "value": id
            }
          ]
        }
      ]
    );

    // Log 'query plan' if using `EXPLAIN ANALYZE`
    // in the query to check indices
    // console.log("res:", res.rows)
    
   /**
    * -> operator gets a JSON object field as JSON (or JSONB),
    * ->> operator gets a JSON object field as text
    */
    // Another approach using jsonb_array_elements:
    // const res = await pool.query(`
    //   SELECT *
    //   FROM ${dbTable}
    //   WHERE EXISTS (
    //       SELECT 1
    //       FROM jsonb_array_elements(spasm_event->'ids') AS id_object
    //       WHERE id_object->>'value' = $1
    //   )
    // `, [id]);

    const spasmEvents: SpasmEventV2[] = []
    
    if (res?.rows && Array.isArray(res.rows)) {
      res.rows.forEach((row: any) => {
        if (
          row && typeof(row) === "object" &&
          'spasm_event' in row &&
          row.spasm_event &&
          typeof(row.spasm_event) === "object"
        ) {
          const spasmEvent: SpasmEventV2 = joinDbInfo(
            row, dbTable
          )
          spasmEvent.type = "SpasmEventV2"
          spasmEvents.push(spasmEvent)
        }
      })
    }
    return spasmEvents
  } catch (err) {
    console.error(err);
    return null
  }
}

export const fetchAllSpasmEventsV2ByShortId = async (
  dirtyId: string | number,
  pool = poolDefault,
  dirtyDbTable = "spasm_events"
): Promise<SpasmEventV2[] | null> => {
  if (
    !dirtyId ||
    (
      typeof(dirtyId) !== "string" &&
      typeof(dirtyId) !== "number"
    )
  ) return null

  const id = DOMPurify.sanitize(toBeString(dirtyId))
  const dbTable = DOMPurify.sanitize(dirtyDbTable)

  // Extra safeguard against collision attacks
  if (id.length < 15) { return null }

  try {
    // Log 'query plan' if using `EXPLAIN ANALYZE`
    // in the query to check indices
    // console.log("res:", res.rows)
    
    // EXPLAIN ANALYZE
    const res = await pool.query(`
      SELECT *
      FROM ${dbTable}
      WHERE EXISTS (
          SELECT 1
          FROM jsonb_array_elements(spasm_event->'ids') AS id_object
          WHERE id_object->>'value' LIKE $1
      )
    `, [id+'%']);

    const spasmEvents: SpasmEventV2[] = []
    
    if (res?.rows && Array.isArray(res.rows)) {
      res.rows.forEach((row: any) => {
        if (
          row && typeof(row) === "object" &&
          'spasm_event' in row &&
          row.spasm_event &&
          typeof(row.spasm_event) === "object"
        ) {
          const spasmEvent: SpasmEventV2 = joinDbInfo(
            row, dbTable
          )
          spasmEvent.type = "SpasmEventV2"
          spasmEvents.push(spasmEvent)
        }
      })
    }
    return spasmEvents
  } catch (err) {
    console.error(err);
    return null
  }
}

export const fetchSpasmEventV2ByShortId = async (
  dirtyId: string | number,
  pool = poolDefault,
  dirtyDbTable = "spasm_events"
): Promise<SpasmEventV2 | null> => {
  const events = await fetchAllSpasmEventsV2ByShortId(
    dirtyId,
    pool,
    dirtyDbTable
  )
  if (
    events && Array.isArray(events) &&
    events[0] && isObjectWithValues(events[0])
  ) {
    return events[0]
  } else {
    return null
  }
}

export const fetchAllSpasmEventsV2ByIds = async (
  dirtyIds: (string | number)[],
  pool = poolDefault,
  dirtyDbTable = "spasm_events"
): Promise<(SpasmEventV2 | null)[] | null> => {
  if (!dirtyIds || !Array.isArray(dirtyIds)) return null
  // spasm.sanitizeEvent() can also sanitize an array
  spasm.sanitizeEvent(dirtyIds)
  const ids = removeDuplicatesFromArray(dirtyIds)
  const dbTable = DOMPurify.sanitize(dirtyDbTable)
  if (!ids || !dbTable) { return null }

  const idsQueryObjects = ids.map(id => {
    if (
      id && typeof(id) === "string" || typeof(id) === "number"
    ) {
      return {
        "ids": [
          {
            "value": id
          }
        ]
      }
    }
  })
  try {
    const res = await pool.query(`
      SELECT *
      FROM ${dbTable}
      WHERE spasm_event @> ANY($1::jsonb[])
      `,
      [idsQueryObjects]
    );
    const spasmEvents: SpasmEventV2[] = []

    if (res?.rows && Array.isArray(res.rows)) {
      res.rows.forEach((row: any) => {
        if (
          row && typeof(row) === "object" &&
          'spasm_event' in row &&
          row.spasm_event &&
          typeof(row.spasm_event) === "object"
        ) {
          const spasmEvent: SpasmEventV2 = joinDbInfo(
            row, dbTable
          )
          spasmEvent.type = "SpasmEventV2"
          spasmEvents.push(spasmEvent)
        }
      })
    }
    return spasmEvents
  } catch (err) {
    console.error(err);
    return null
  }
}

export const fetchSpasmEventV2ById = async (
  dirtyId: string | number,
  pool = poolDefault,
  dirtyDbTable = "spasm_events"
): Promise<SpasmEventV2 | null> => {
  const events = await fetchAllSpasmEventsV2ById(
    dirtyId,
    pool,
    dirtyDbTable
  )
  if (
    events && Array.isArray(events) &&
    events[0] && isObjectWithValues(events[0])
  ) {
    return events[0]
  } else {
    return null
  }
}

export const fetchAllSpasmEventsV2ByParentId = async (
  dirtyParentId: (string | number),
  pool = poolDefault,
  dirtyAction: string | number = "any",
  dirtyDbTable = "spasm_events"
): Promise<SpasmEventV2[] | null> => {
  if (
    !dirtyParentId || !pool || !dirtyAction ||
    !isStringOrNumber(dirtyParentId)
  ) {
    return null
  }

  const parentId = DOMPurify.sanitize(toBeString(dirtyParentId))
  const action = DOMPurify.sanitize(dirtyAction)
  const dbTable = DOMPurify.sanitize(dirtyDbTable)
  if (!parentId || !action || !dbTable) { return null }

  try {
    let queryArray = null
    if (action && action === "any") {
      queryArray = [
        {
          "parent": {
            "ids": [
              {
                "value": parentId
              }
            ]
          }
        }
      ]
    } else if (
      action &&
      typeof(action) === "string" &&
      action !== "any"
    ) {
      queryArray = [
        {
          "action": action,
          "parent": {
            "ids": [
              {
                "value": parentId
              }
            ]
          }
        }
      ]
    }

    if (!queryArray) return null

    const res = await pool.query(`
      SELECT *
      FROM ${dbTable}
      WHERE spasm_event @> $1::jsonb
      `, queryArray
    )

    const spasmEvents: SpasmEventV2[] = []

    if (res?.rows && Array.isArray(res.rows)) {
      res.rows.forEach((row: any) => {
        if (
          row && typeof(row) === "object" &&
          'spasm_event' in row &&
          row.spasm_event &&
          typeof(row.spasm_event) === "object"
        ) {
          const spasmEvent: SpasmEventV2 = joinDbInfo(
            row, dbTable
          )
          spasmEvent.type = "SpasmEventV2"
          spasmEvents.push(spasmEvent)
        }
      })
    }
    return spasmEvents
  } catch (err) {
    console.error(err);
    return null
  }
}

export const fetchAllSpasmEventsV2ByTarget =
  fetchAllSpasmEventsV2ByParentId

export const fetchAllChildrenByParentId =
  fetchAllSpasmEventsV2ByParentId

export const fetchAllChildrenByTarget =
  fetchAllSpasmEventsV2ByParentId

export const fetchAllCommentsByParentId = async (
  dirtyParentId: (string | number),
  pool = poolDefault,
  dirtyDbTable = "spasm_events"
): Promise<SpasmEventV2[] | null> => {
  return fetchAllSpasmEventsV2ByParentId(
    dirtyParentId, pool, "reply", dirtyDbTable
  )
}

export const fetchCommentsByParentId =
  fetchAllCommentsByParentId

export const fetchAllReactionsByParentId = async (
  dirtyParentId: (string | number),
  pool = poolDefault,
  dirtyDbTable = "spasm_events"
): Promise<SpasmEventV2[] | null> => {
  return fetchAllSpasmEventsV2ByParentId(
    dirtyParentId, pool, "react", dirtyDbTable
  )
}

export const fetchReactionsByParentId =
  fetchAllReactionsByParentId

export const fetchAllModerationsByParentId = async (
  dirtyParentId: (string | number),
  pool = poolDefault,
  dirtyDbTable = "spasm_events"
): Promise<SpasmEventV2[] | null> => {
  return fetchAllSpasmEventsV2ByParentId(
    dirtyParentId, pool, "moderate", dirtyDbTable
  )
}

export const fetchModerationsByParentId =
  fetchAllModerationsByParentId

export const fetchAllSpasmEventsV2ByParentIds = async (
  dirtyParentIds: (string | number)[],
  pool = poolDefault,
  dirtyAction: string | number = "any",
  dirtyDbTable = "spasm_events",
): Promise<SpasmEventV2[] | null> => {
  if (
    !dirtyParentIds || !isArrayWithValues(dirtyParentIds) ||
    !pool || !dirtyAction || !dirtyDbTable
  ) return null
  // spasm.sanitizeEvent() can also sanitize an array
  spasm.sanitizeEvent(dirtyParentIds)
  const parentIds = removeDuplicatesFromArray(dirtyParentIds)
  const action = DOMPurify.sanitize(dirtyAction)
  const dbTable = DOMPurify.sanitize(dirtyDbTable)
  if (
    !parentIds || !isArrayWithValues(parentIds) ||
    !action || !dbTable
  ) { return null }

  const parentIdsQueryObjects = parentIds.map(parentId => {
    if (
      parentId && (
        typeof(parentId) === "string" ||
        typeof(parentId) === "number"
      )
    ) {
      if (action && action === "any") {
        return {
          "parent": {
            "ids": [
              {
                "value": parentId
              }
            ]
          }
        }
      } else if (
        action &&
        typeof(action) === "string" &&
        action !== "any"
      ) {
        return {
          "action": action,
          "parent": {
            "ids": [
              {
                "value": parentId
              }
            ]
          }
        }
      }
    }
  })
  try {
    const res = await pool.query(`
      SELECT *
      FROM ${dbTable}
      WHERE spasm_event @> ANY($1::jsonb[])
      `,
      [parentIdsQueryObjects]
    );
    const spasmEvents: SpasmEventV2[] = []

    if (res?.rows && Array.isArray(res.rows)) {
      res.rows.forEach((row: any) => {
        if (
          row && typeof(row) === "object" &&
          'spasm_event' in row &&
          row.spasm_event &&
          typeof(row.spasm_event) === "object"
        ) {
          const spasmEvent: SpasmEventV2 = joinDbInfo(
            row, dbTable
          )
          spasmEvent.type = "SpasmEventV2"
          spasmEvents.push(spasmEvent)
        }
      })
    }
    return spasmEvents
  } catch (err) {
    console.error(err);
    return null
  }
}

export const fetchAllSpasmEventsV2ByTargets =
  fetchAllSpasmEventsV2ByParentIds

export const fetchAllChildrenByTargets =
  fetchAllSpasmEventsV2ByParentIds

export const fetchAllChildrenByParentIds =
  fetchAllSpasmEventsV2ByParentIds

export const fetchAllCommentsByParentIds = async (
  dirtyParentIds: (string | number)[],
  pool = poolDefault,
  dirtyDbTable = "spasm_events",
): Promise<SpasmEventV2[] | null> => {
  return fetchAllSpasmEventsV2ByParentIds(
    dirtyParentIds, pool, "reply", dirtyDbTable
  )
}

export const fetchCommentsByParentIds =
  fetchAllCommentsByParentIds

export const fetchAllReactionsByParentIds = async (
  dirtyParentIds: (string | number)[],
  pool = poolDefault,
  dirtyDbTable = "spasm_events",
): Promise<SpasmEventV2[] | null> => {
  return fetchAllSpasmEventsV2ByParentIds(
    dirtyParentIds, pool, "react", dirtyDbTable
  )
}

export const fetchReactionsByParentIds =
  fetchAllReactionsByParentIds

export const fetchAllModerationsByParentIds = async (
  dirtyParentIds: (string | number)[],
  pool = poolDefault,
  dirtyDbTable = "spasm_events",
): Promise<SpasmEventV2[] | null> => {
  return fetchAllSpasmEventsV2ByParentIds(
    dirtyParentIds, pool, "moderate", dirtyDbTable
  )
}

export const fetchModerationsByParentIds =
  fetchAllModerationsByParentIds

export const fetchAllChildrenOfEvent = async (
  unknownEvent: UnknownEventV2,
  pool = poolDefault,
  dirtyAction: string | number = "any",
  dirtyDbTable = "spasm_events"
): Promise<SpasmEventV2[] | null> => {
  if (
    !unknownEvent || !pool ||
    !dirtyAction || !dirtyDbTable
  ) return null

  const action = DOMPurify.sanitize(dirtyAction)
  const dbTable = DOMPurify.sanitize(toBeString(dirtyDbTable))
  const spasmEventV2: SpasmEventV2 =
    spasm.toBeSpasmEventV2(unknownEvent)
  if (!spasmEventV2 || !action || !dbTable) return null

  const eventIds: (string | number)[] | null =
    spasm.getAllEventIds(spasmEventV2)
  if (!eventIds) return null

  const fetchedChildren = await fetchAllSpasmEventsV2ByParentIds(
    eventIds, pool, action, dbTable
  )
  if (fetchedChildren) {
    return fetchedChildren
  } else {
    return null
  }
}

export const fetchAndAddAllChildrenToEvent = async (
  unknownEvent: UnknownEventV2,
  pool = poolDefault,
  dirtyAction: string | number = "any",
  depth = 0,
  maxDepth = 10,
  dirtyDbTable = "spasm_events"
): Promise<SpasmEventV2 | null> => {
  if (
    !unknownEvent || !pool ||
    !dirtyAction || !dirtyDbTable
  ) return null

  const spasmEventV2: SpasmEventV2 =
    spasm.toBeSpasmEventV2(unknownEvent)
  if (!spasmEventV2) return null

  const action = DOMPurify.sanitize(dirtyAction)
  const dbTable = DOMPurify.sanitize(toBeString(dirtyDbTable))
  if (!action || !dbTable) return spasmEventV2

  // Maximum recursion depth to prevent stack overflow
  if (
    typeof(depth) !== "number" ||
    typeof(maxDepth) !== "number"
  ) { return spasmEventV2 }
  const maxRecursionDepth = maxDepth ?? 10
  if (depth >= maxRecursionDepth) {
    return spasmEventV2
  }

  const fetchedChildren = await fetchAllChildrenOfEvent(
    spasmEventV2, pool, action, dirtyDbTable
  )

  if (
    !fetchedChildren || !isArrayWithValues(fetchedChildren)
  ) { return spasmEventV2 }

  const eventWithAddedChildren: SpasmEventV2 | null =
    spasm.addEventsToTree(spasmEventV2, fetchedChildren)

  if (eventWithAddedChildren) {
    return eventWithAddedChildren
  } else { return null }
}

export const fetchAndAddCommentsToEvent = async (
  unknownEvent: UnknownEventV2,
  pool = poolDefault,
  depth = 0,
  maxDepth = 10,
  dirtyDbTable = "spasm_events"
): Promise<SpasmEventV2 | null> => {
  return await fetchAndAddAllChildrenToEvent(
    unknownEvent, pool, "reply", depth, maxDepth, dirtyDbTable
  )
}

export const fetchAndAddCommentsRecursively = async (
  unknownEvent: UnknownEventV2,
  pool = poolDefault,
  depth = 0,
  maxDepth = 10,
  dirtyDbTable = "spasm_events"
): Promise<SpasmEventV2 | null> => {
  const eventWithComments: SpasmEventV2 | null =
    await fetchAndAddAllChildrenToEvent(
    unknownEvent, pool, "reply", depth, maxDepth, dirtyDbTable
  )
  if (!eventWithComments) return null

  // Maximum recursion depth to prevent stack overflow
  if (
    typeof(depth) !== "number" ||
    typeof(maxDepth) !== "number"
  ) { return eventWithComments }
  const maxRecursionDepth = maxDepth ?? 10
  if (depth >= maxRecursionDepth) {
    return eventWithComments
  }
  // Limit max custom depth to maximum of 20
  if (maxDepth > 20) { maxDepth = 20 }
  
  if (
    !("children" in eventWithComments) ||
    !eventWithComments.children ||
    !isArrayWithValues(eventWithComments.children) ||
    !eventWithComments.children.length
  ) { return eventWithComments }
  
  for (let i = 0; i < eventWithComments.children.length; i++) {
    if (eventWithComments.children[i]?.event) {
      const childEventWithComments: SpasmEventV2 | null =
        await fetchAndAddCommentsRecursively(
        eventWithComments.children[i].event,
        pool, depth + 1, maxDepth, dirtyDbTable
      )
      if (
        childEventWithComments &&
        isObjectWithValues(childEventWithComments)
      ) {
        eventWithComments.children[i].event =
          childEventWithComments
      }
    }
  }
  if (
    eventWithComments &&
    isObjectWithValues(eventWithComments)
  ) {
    return eventWithComments
  } else { return null }
}

export const buildTreeDown = async (
  unknownEvent: UnknownEventV2,
  pool = poolDefault,
  maxDepth = 10,
  dirtyDbTable = "spasm_events"
): Promise<SpasmEventV2 | null> => {
  return await fetchAndAddCommentsRecursively(
    unknownEvent, pool, 0, maxDepth, dirtyDbTable
  )
}

export const fetchAllSpasmEventsV2BySigner = async (
  dirtySigner: string,
  pool = poolDefault,
  dirtyDbTable = "spasm_events"
): Promise<SpasmEventV2[] | null> => {
  if (!dirtySigner || typeof(dirtySigner) !== "string") {
    return null
  }
  if (!dirtyDbTable || typeof(dirtyDbTable) !== "string") {
    return null
  }

  const dbTable = DOMPurify.sanitize(dirtyDbTable)
  if (!dbTable) return null
  let signer = DOMPurify.sanitize(dirtySigner)
  if (!signer) return null
  if (
    typeof(signer) === "string" &&
    signer.length === 63 &&
    signer.startsWith("npub")
  ) { signer = toBeHex(signer) }

  try {
    // Works
    const res = await pool.query(`
      SELECT *
      FROM ${dbTable}
      WHERE spasm_event @> $1::jsonb
      ORDER BY db_added_timestamp DESC
      `,
      [
        // TODO add filter by action
        // $1 signer
        {
          "authors": [
            {
              "addresses": [
                {
                  "value": signer
                }
              ]
            }
          ]
        }
      ]
    )

    const spasmEvents: SpasmEventV2[] = []

    if (res?.rows && Array.isArray(res.rows)) {
      res.rows.forEach((row: any) => {
        if (
          row && typeof(row) === "object" &&
          'spasm_event' in row &&
          row.spasm_event &&
          typeof(row.spasm_event) === "object"
        ) {
          const spasmEvent: SpasmEventV2 = joinDbInfo(
            row, dbTable
          )
          spasmEvent.type = "SpasmEventV2"
          spasmEvents.push(spasmEvent)
        }
      })
    }
    return spasmEvents
  } catch (err) {
    console.error(err);
    return null
  }
}

export const fetchAllSpasmEventsV2ByPubkey =
  fetchAllSpasmEventsV2BySigner

export const fetchAllSpasmEventsV2ByAuthorAddress =
  fetchAllSpasmEventsV2BySigner

export const cleanDbTable = async (
  dirtyDbTable: string,
  // poolTest is set by default to reduces chances of
  // cleaning up the main database by mistake.
  pool = poolTest
): Promise<boolean> => {
  const dbTable = DOMPurify.sanitize(dirtyDbTable)

  try {
    await pool.query(`DELETE FROM ${dbTable}`);
    return true
  } catch (err) {
    console.error(err);
  }
  return false
}

// TODO make sure that we only increment reactions
// if a react event has signature and verified signer
// to avoid exploiting reactions with react web2 posts.
// isAnyIdAlreadyInDbV2
// - false, insertSpasmEvent
// - true, areAllSignaturesForThisIdAlreadyInDbV2
//   - true, return
//   - false, mergeSpasmEvents
// what if ID is url/guid?
// there might be multiple events with the same url ID
// e.g. rss web2 posts vs sharing?
// No, because sharing URLs is a separete event with unique ID.
export const fetchAllEventsWithSameIdFromDbV2 = async (
  unknownEvent: UnknownEventV2,
  pool = poolDefault,
  dirtyIdFormatName: SpasmEventIdFormatNameV2 = "spasmid",
  dirtyIdFormatVersion: string = "",
  dirtyDbTable = "spasm_events"
): Promise<SpasmEventV2[] | null> => {
  try {
    const dbTable = DOMPurify.sanitize(toBeString(dirtyDbTable))
    const idFormatName =
      DOMPurify.sanitize(toBeString(dirtyIdFormatName))
    const idFormatVersion =
      DOMPurify.sanitize(toBeString(dirtyIdFormatVersion))
    const spasmEventV2: SpasmEventV2 =
      spasm.toBeSpasmEventV2(unknownEvent)
    if (!spasmEventV2) return null

    const id = spasm.extractIdByFormat(
      spasmEventV2, {
        name: idFormatName,
        version: idFormatVersion
      }
    )

    const fetchedEvents = await fetchAllSpasmEventsV2ById(
      id, pool, dbTable
    )

    if (fetchedEvents && Array.isArray(fetchedEvents)) {
      return fetchedEvents
    } else {
      return null
    }
  } catch (error) {
    console.log(error)
    return null
  }
}

export const fetchAllEventsWithSameSpasmIdFromDbV2 = async (
  unknownEvent: UnknownEventV2,
  pool = poolDefault,
  idFormatName: SpasmEventIdFormatNameV2 = "spasmid",
  idFormatVersion: string = "",
  dirtyDbTable = "spasm_events"
) => {
  return await fetchAllEventsWithSameIdFromDbV2(
    unknownEvent,
    pool,
    idFormatName,
    idFormatVersion,
    dirtyDbTable
  )
}

export const fetchEventWithSameIdFromDbV2 = async (
  unknownEvent: UnknownEventV2,
  pool = poolDefault,
  idFormatName: SpasmEventIdFormatNameV2 = "spasmid",
  idFormatVersion: string = "",
  dirtyDbTable = "spasm_events"
): Promise<SpasmEventV2 | null> => {
  const events = await fetchAllEventsWithSameIdFromDbV2(
    unknownEvent,
    pool,
    idFormatName,
    idFormatVersion,
    dirtyDbTable
  )
  // return events?.[0] ?? null
  if (
    events && Array.isArray(events) &&
    events[0] && isObjectWithValues(events[0])
  ) {
    return events[0]
  } else {
    return null
  }
}

export const fetchEventWithSameSpasmIdFromDbV2 = async (
  unknownEvent: UnknownEventV2,
  pool = poolDefault,
  idFormatName: SpasmEventIdFormatNameV2 = "spasmid",
  idFormatVersion: string = "",
  dirtyDbTable = "spasm_events"
) => {
  return await fetchEventWithSameIdFromDbV2(
    unknownEvent,
    pool,
    idFormatName,
    idFormatVersion,
    dirtyDbTable
  )
}

export const fetchEventWithSameUrlIdFromDbV2 = async (
  unknownEvent: UnknownEventV2,
  pool = poolDefault,
  idFormatName: SpasmEventIdFormatNameV2 = "url",
  idFormatVersion: string = "",
  dirtyDbTable = "spasm_events"
) => {
  return await fetchEventWithSameIdFromDbV2(
    unknownEvent,
    pool,
    idFormatName,
    idFormatVersion,
    dirtyDbTable
  )
}

export const isReactionDuplicate = async (
  unknownEvent: UnknownEventV2,
  pool = poolDefault,
  dirtyDbTable = "spasm_events"
): Promise<boolean> => {
  try {
    const dbTable = DOMPurify.sanitize(toBeString(dirtyDbTable))
    const spasmEventV2: SpasmEventV2 =
      spasm.toBeSpasmEventV2(unknownEvent)
    if (!spasmEventV2) return false

    const verifiedSigners: (string | number)[] =
      spasm.getVerifiedSigners(spasmEventV2)
      console.log("verifiedSigners:", verifiedSigners)

    if (
      !verifiedSigners ||
      !Array.isArray(verifiedSigners) ||
      !hasValue(verifiedSigners)
    ) {
      // return as duplicate to avoid exploits
      // with invalid signers
      return true
    }

    const parentIds: (string | number)[] =
      spasm.getAllParentIds(spasmEventV2)

   /**
    * isReactionDuplicate() is used upon submitting of a new
    * event to determine whether an action count should be
    * incremented, e.g., when a user submits a new reaction
    * (like/dislike). Thus, if there are no parent IDs, the
    * event should be considered not a duplicate.
    * However, the same event might already be in the database,
    * e.g., if the event is of action 'post'.
    * Thus, we should always check whether the event with the
    * same Spasm ID is already in database before calling the
    * isReactionDuplicate function.
    */
    if (
      !parentIds ||
      !Array.isArray(parentIds) ||
      !hasValue(parentIds)
    ) {
      return false
    }

    const { action, content } = spasmEventV2

    if (!action || typeof(action) !== "string") {
      return false
    }

    if (!content || typeof(content) !== "string") {
      return false
    }

    // Promise.all and map are used because
    // await doesn't work with array.forEach
    const results = await Promise.all(
      verifiedSigners.map((signer) => {
        return isReactionDuplicateForThisSigner(
          signer, parentIds, action, content, pool, dbTable
        )
      })
    )

    // Return true is at least one result is true
    if (results.some(result => result)) {
      return true
    }
  } catch (err) {
    console.error(err);
    return false
  }
  return false
}

// Aliases
export const isReactDuplicate = isReactionDuplicate
export const isActionReactDuplicate = isReactionDuplicate

export const isActionVoteDuplicate = isReactionDuplicate
export const isVoteDuplicate = isReactionDuplicate

export const isActionEditDuplicate = isReactionDuplicate
export const isEditDuplicate = isReactionDuplicate
export const isEditionDuplicate = isReactionDuplicate

const isReactionDuplicateForThisSigner = async (
  signer: string | number,
  parentIds: (string | number)[],
  action: string,
  content: string,
  pool = poolDefault,
  dirtyDbTable = "spasm_events"
): Promise<boolean> => {
  const dbTable = DOMPurify.sanitize(dirtyDbTable)
  try {
    // Promise.all and map are used because
    // await doesn't work with array.forEach
    const results = await Promise.all(
      parentIds.map((parentId) => {
        return isReactionDuplicateForThisSignerAndThisParentId(
          signer, parentId, action, content, pool, dbTable
        )
      })
    )
    // Return true is at least one result is true
    if (results.some(result => result)) {
      return true
    }
  } catch (err) {
    console.error(err);
    return false
  }
  return false
}

const isReactionDuplicateForThisSignerAndThisParentId = async (
  signer: string | number,
  parentId: string | number,
  action: string,
  content: string,
  pool = poolDefault,
  dirtyDbTable = "spasm_events"
): Promise<boolean> => {
  if (!signer) { return null }
  if (!parentId) { return null }
  if (!isStringOrNumber(signer)) { return false }
  if (!isStringOrNumber(parentId)) { return false }
  if (typeof(signer) === "string") {
    signer = signer.toLowerCase()
  }
  if (typeof(parentId) === "string") {
    parentId = parentId.toLowerCase()
  }

  try {
    const dbTable = DOMPurify.sanitize(dirtyDbTable)
    if (
      signer &&
      (
        typeof(signer) === "string" ||
        typeof(signer) === "number"
      )
    ) {
      const checkAction = await pool.query(`
        SELECT *
        FROM ${dbTable}
        WHERE spasm_event @> $1::jsonb
        `,
        [
          {
            "action": action,
            "content": content,
            "parent": {
              "ids": [
                {
                  "value": parentId
                }
              ]
            },
            "authors": [
              {
                "addresses": [
                  {
                    "value": signer
                  }
                ]
              }
            ]
          }
        ]
      )

      if (checkAction.rows.length > 0) return true
    // No signer or signer is not a string/number
    } else {
      return false
    }
  } catch (err) {
    console.error(err);
    return false
  }
  return false
}

/**
 * deleteSpasmEventsV2FromDbByIds() returns true only if two
 * conditions are met:
 * - at least one event was deleted,
 * - there are no events with specified IDs in db
 */
export const deleteSpasmEventsV2FromDbByIds = async (
  dirtyIds: (string | number)[],
  pool = poolDefault,
  dirtyDbTable = "spasm_events"
): Promise<boolean | null> => {
  if (!dirtyIds || !isArrayWithValues(dirtyIds)) return null
  // sanitizeEvent() can also sanitize an array
  spasm.sanitizeEvent(dirtyIds)
  if (!dirtyIds || !isArrayWithValues(dirtyIds)) return null
  const ids = removeDuplicatesFromArray(dirtyIds)
  if (!ids || !isArrayWithValues(ids)) return null
  const dbTable = DOMPurify.sanitize(dirtyDbTable)
  if (!dbTable) return null

  const idsQueryObjects = ids.map(id => (
    {
      "ids": [
        {
          "value": id
        }
      ]
    }
  ))

  try {
    const res = await pool.query(`
      DELETE
      FROM ${dbTable}
      WHERE spasm_event @> ANY($1::jsonb[])
      `,
      [idsQueryObjects]
    );

    // return res.rowCount > 0

    if (res.rowCount > 0) {
      // If some events were deleted, then let's check whether
      // any events are still present in the db to figure out
      // whether to return 'true' or 'false'. 
      if (!hasValue(await fetchAllSpasmEventsV2ByIds(
        ids, pool, dbTable
      ))) {
        // No events were found in db
        return true
      } else {
        // Some events are still in db
        return false
      }
    } else {
      // Return false if no events were deleted
      return false
    }
  } catch (err) {
    console.error(err);
    return null
  }
}

export const deleteSpasmEventV2FromDbById = async (
  dirtyId: string | number,
  pool = poolDefault,
  dirtyDbTable = "spasm_events"
): Promise<boolean | null> => {
  return deleteSpasmEventsV2FromDbByIds(
    [dirtyId],
    pool,
    dirtyDbTable
  )
}

// export const deleteSpasmEventV2FromDbById = async (
//   dirtyId: string | number,
//   pool = poolDefault,
//   dirtyDbTable = "spasm_events"
// ): Promise<boolean | null> => {
//   if (
//     !dirtyId ||
//     (
//       typeof(dirtyId) !== "string" &&
//       typeof(dirtyId) !== "number"
//     )
//   ) return null
//
//   const id = DOMPurify.sanitize(toBeString(dirtyId))
//   const dbTable = DOMPurify.sanitize(dirtyDbTable)
//
//   try {
//     const res = await pool.query(`
//       DELETE
//       FROM ${dbTable}
//       WHERE spasm_event @> $1::jsonb
//       `,
//       [
//         {
//           "ids": [
//             {
//               "value": id
//             }
//           ]
//         }
//       ]
//     );
//
//     return res.rowCount > 0
//   } catch (err) {
//     console.error(err);
//     return null
//   }
// }

/**
 * The action can be banned via different moderation events,
 * e.g. via the 'delete' event. It's important to prevent
 * banned events from being re-inserted into the database.
 * For example, post 123 was fetched by instance ABC from
 * instance XYZ via the SPASM module. The post got deleted
 * by the moderator of the ABC instance. After a few minutes,
 * instance ABC is fetching posts from instance XYZ again,
 * but it should not insert post 123 into the database since
 * it has been previously deleted by the moderator. Banned
 * posts should also be rejected in they come from multiple
 * other instances.
 */
export const isEventBanned = async (
  unknownEvent: UnknownEventV2,
  pool = poolDefault,
  dirtyDbTable = "spasm_events"
): Promise<boolean> => {
  try {
    const dbTable = DOMPurify.sanitize(toBeString(dirtyDbTable))
    const spasmEventV2: SpasmEventV2 =
      spasm.toBeSpasmEventV2(unknownEvent)
    if (!spasmEventV2) return false

    // const spasmId = spasm.getIdByFormat(spasmEventV2, {
    //   name: "spasmid", version: "01"
    // })
    //
    // if (!spasmId) return false

    // TODO? Allow post if signer is not a moderator anymore?
    // Get array of signers from each 'delete' moderate event,
    // check if any of the signers is a valid moderator,
    // return true if at least one signer is a valid moderator.
    // E.g., if a moderator became malicious, banned many posts,
    // but then got removed from the moderators list.
    // Although, in that situation an admin can manually delete
    // all actions of that moderator from the database after
    // the timestamp when the moderator became malicious.
    // Thus, posts banned by the malicious moderator won't be
    // banned anymore.
    // However, checking whether a signer of a moderation event
    // is a moderator at this instance still makes sense in case
    // if an instance administrator enabled syncing of moderation
    // events by accident.
    const ids = spasm.getAllEventIds(spasmEventV2)
    if (ids && Array.isArray(ids)) {
      return areIdsBanned(ids, pool, dbTable)
    } else {
      return false
    }
  } catch (err) {
    console.error(err);
    return false
  }
}

export const isSpasmIdBanned = async (
  dirtyId: string | number,
  pool = poolDefault,
  dirtyDbTable = "spasm_events"
): Promise<boolean | null> => {
  if (
    !dirtyId ||
    (
      typeof(dirtyId) !== "string" &&
      typeof(dirtyId) !== "number"
    )
  ) return null

  const id = DOMPurify.sanitize(toBeString(dirtyId))
  const dbTable = DOMPurify.sanitize(dirtyDbTable)

  try {
    const res = await pool.query(`
      SELECT 1
      FROM ${dbTable}
      WHERE spasm_event @> $1::jsonb
      `,
      [
        {
          "parent": {
            "ids": [
              {
                "value": id
              }
            ]
          },
          "action": "moderate",
          "content": "delete"
        },
      ]
    );

    return res.rowCount > 0
  } catch (err) {
    console.error(err);
    return null
  }
}

export const areIdsBanned = async (
  dirtyIds: (string | number)[],
  pool = poolDefault,
  dirtyDbTable = "spasm_events"
): Promise<boolean | null> => {
  if (
    !dirtyIds ||
    !Array.isArray(dirtyIds) ||
    !hasValue(dirtyIds)
  ) return null

  // sanitizeEvent() can also sanitize an array
  spasm.sanitizeEvent(dirtyIds)
  const ids = removeDuplicatesFromArray(dirtyIds)
  const dbTable = DOMPurify.sanitize(dirtyDbTable)

  const idsQueryObjects = ids.map(id => (
    {
      "parent": {
        "ids": [
          {
            "value": id
          }
        ]
      },
      "action": "moderate",
      "content": "delete"
    }
  ))

  try {
    const res = await pool.query(`
      SELECT 1
      FROM ${dbTable}
      WHERE spasm_event @> ANY($1::jsonb[])
      `,
      [idsQueryObjects]
    );

    return res.rowCount > 0
  } catch (err) {
    console.error(err);
    return null
  }
}

export const incrementSpasmEventActionV2 = async (
  unknownEvent: UnknownEventV2,
  pool = poolDefault,
  dirtyDbTable = "spasm_events"
): Promise<boolean | null> => {
  const spasmEventV2: SpasmEventV2 =
    spasm.toBeSpasmEventV2(unknownEvent)
  if (!spasmEventV2) return false
  if (
    spasmEventV2.action !== "react" &&
    spasmEventV2.action !== "reply" &&
    spasmEventV2.action !== "share" &&
    spasmEventV2.action !== "vote"
  ) return false
  if (!spasmEventV2.action || (
    typeof(spasmEventV2.action) !== "string" &&
    typeof(spasmEventV2.action) !== "number"
  )) return false
  if (!spasmEventV2.content || (
    typeof(spasmEventV2.content) !== "string" &&
    typeof(spasmEventV2.content) !== "number"
  )) return false
  if (
    !spasmEventV2.signatures ||
    !hasValue(spasmEventV2.signatures)
  ) return false

  const action: string | number = spasmEventV2.action
  const content: string | number = spasmEventV2.content
  const latestTimestamp: number = spasmEventV2.timestamp
  const latestDbTimestamp: number =
    spasmEventV2.db?.addedTimestamp
  const dbTable = DOMPurify.sanitize(dirtyDbTable)
  const parentIds: (string | number)[] =
    spasm.getAllParentIds(spasmEventV2)

  return incrementSpasmEventStatsV2(
    parentIds,
    action, content,
    latestTimestamp, latestDbTimestamp,
    pool, dbTable
  )
}

/**
 * We should ideally increment stats with a query, but it's
 * very complicated, so the easier solution is to simply
 * fetch the event, extract 'stats', change 'stats' and finally
 * update the event in the database with new 'stats'.
 * That should avoid the loss of data during the concurrent
 * execution of event merges (when a new sibling is added to
 * the existent event into 'spasm_event' column), but the loss
 * of data can still occur during the concurrent execution of
 * multiple incrementations. It should not cause any significant
 * issues since most instances are designed to handle a low
 * amount of traffic. However, this might lead to not all
 * actions being properly counted during massive executions
 * like database migration.
 */
export const incrementSpasmEventStatsV2 = async (
  dirtyIds: (string | number)[],
  action: string | number,
  content: string | number,
  latestTimestamp: number,
  latestDbTimestamp: number,
  pool = poolDefault,
  dirtyDbTable = "spasm_events"
): Promise<boolean | null> => {
  if (!dirtyIds || !Array.isArray(dirtyIds)) return null
  // spasm.sanitizeEvent() can also sanitize an array
  spasm.sanitizeEvent(dirtyIds)
  const ids = removeDuplicatesFromArray(dirtyIds)
  const dbTable = DOMPurify.sanitize(dirtyDbTable)

  // Get array of spasm events from parent IDs
  const spasmEvents: SpasmEventV2[] =
    await fetchAllSpasmEventsV2ByIds(ids, pool, dbTable)

  // Filter out duplicate events based on db_key (event.db.key)
  const uniqueDbKeys = new Set<number>()
  const uniqueSpasmEvents: SpasmEventV2[] =
    spasmEvents.filter(event => {
    const key = event.db?.key
    if (key && !uniqueDbKeys.has(key)) {
      uniqueDbKeys.add(key);
      return true // Keep the event
    } else if (!key) {
      // Remove the event if it has no db key because
      // we will update stats based on db key
      return false 
    }
    return false // Remove the event
  })

  // Promise.all and map are used because
  // await doesn't work with array.forEach
  const results = await Promise.all(
    uniqueSpasmEvents.map((spasmEvent) => {
      return incrementStatsV2ForThisEvent(
        spasmEvent,
        action, content,
        latestTimestamp, latestDbTimestamp,
        pool, dbTable
      )
    })
  )

  // Return true if all results are true
  if (results.every(result => result)) {
    return true
  } else {
    return false
  }
}

export const incrementStatsV2ForThisEvent = async (
  unknownEvent: UnknownEventV2,
  dirtyAction: string | number,
  dirtyContent: string | number,
  latestTimestamp: number,
  latestDbTimestamp: number,
  pool = poolDefault,
  dirtyDbTable = "spasm_events"
): Promise<boolean | null> => {
  const spasmEventV2: SpasmEventV2 =
    spasm.toBeSpasmEventV2(unknownEvent)
  if (!spasmEventV2) return false
  const action = DOMPurify.sanitize(toBeString(dirtyAction))
  const content = DOMPurify.sanitize(toBeString(dirtyContent))
  const dbTable = DOMPurify.sanitize(dirtyDbTable)

  // Create stats if it's null or undefined
  spasmEventV2.stats ??= [];

  // Index of a target action (stat) in the array of all stats
  let actionIndex: number | null = null
  // Find if an action exists in stats
  spasmEventV2.stats.forEach((stat, index) => {
    if (stat && 'action' in stat && stat.action === action) {
      actionIndex = index
    }
  })

  // Scenario 1. Action (not 'reply') already exists in stats,
  // so we need to check whether it has a target content.
  if (
    action !== "reply" &&
    typeof(actionIndex) === "number"
  ) {
    // Create contents if it's null or undefined
    spasmEventV2.stats[actionIndex].contents ??= [];

    // Index of a target content in the array of all contents
    let contentIndex: number | null = null
    // Find if a content exists in action,
    // e.g., if content 'upvote' exists in action 'react'
    spasmEventV2.stats[actionIndex].contents.forEach(
      (statContent, index) => {
      if (
        statContent && 'value' in statContent &&
        statContent.value === content
      ) {
        contentIndex = index
      }
    })

    // Scenario 1.1. Content already exists
    if (typeof(contentIndex) === "number") {
      if (
        typeof(spasmEventV2.stats[actionIndex].contents[contentIndex].total) === "number" &&
        Number(spasmEventV2.stats[actionIndex].contents[contentIndex].total) > -1
      ) {
        let oldTotal = Number(spasmEventV2.stats[actionIndex].contents[contentIndex].total)
        const newValue = oldTotal ? oldTotal + 1 : 1
        spasmEventV2.stats[actionIndex].contents[contentIndex].total = newValue
      }
    // Scenario 1.2. Content doesn't exist yet
    } else {
      const newContent = {
        value: content,
        total: 1,
        latestTimestamp: latestTimestamp,
        latestDbTimestamp: latestDbTimestamp
      }
      spasmEventV2.stats[actionIndex].contents.push(newContent)
    }
  }

  // Scenario 2. Action (not 'reply') doesn't exist in stats yet,
  // so we simply create the whole object with action & contents.
  if (
    action !== "reply" &&
    actionIndex === null
  ) {
    const newStat: SpasmEventStatV2 = {
      action: action,
      total: 1,
      latestTimestamp: latestTimestamp,
      latestDbTimestamp: latestDbTimestamp,
      contents: [
        {
          value: content,
          total: 1
        }
      ]
    }
    spasmEventV2.stats.push(newStat)
  }

  // Scenario 3. Action is 'reply' and it already exists in stats
  // so we don't have to create 'contents', because we only
  // need to count the total amount of replies.
  if (
    action === "reply" &&
    typeof(actionIndex) === "number"
  ) {
    // Do nothing.
    // The total for action will be incremented later.
  }

  // Scenario 4. Action is 'reply' and it doesn't exist in stats
  if (
    action === "reply" &&
    actionIndex === null
  ) {
    const newStat: SpasmEventStatV2 = {
      action: action,
      total: 1,
      latestTimestamp: latestTimestamp,
      latestDbTimestamp: latestDbTimestamp,
    }
    spasmEventV2.stats.push(newStat)
  }

  // Finally, increment the total for action
  if (typeof(actionIndex) === "number") {
    const oldTotal =
      Number(spasmEventV2.stats?.[actionIndex].total)
    const newTotal = oldTotal ? oldTotal + 1 : 1
    spasmEventV2.stats[actionIndex].total = newTotal
    spasmEventV2.stats[actionIndex].latestTimestamp =
      latestTimestamp
    spasmEventV2.stats[actionIndex].latestDbTimestamp =
      latestDbTimestamp
  }

  try {
    const res = await pool.query(`
      UPDATE ${dbTable}
      SET stats = $2
      WHERE db_key = $1
      `,
      [spasmEventV2.db.key, JSON.stringify(spasmEventV2.stats)]
    );

    return res.rowCount > 0
  } catch (err) {
    console.error(err);
    return null
  }

  // Construct the query dynamically based on the action
  // let query = `
  //   UPDATE "spasm_events"
  //   SET (event -> 'stats' -> #>> '{action}') = (event -> 'stats' -> #>> '{action}') + 1
  //   WHERE event @> $1::jsonb
  // `;
}

export const fetchAllSpasmEventsV2ByFilter = async (
  filters: FeedFiltersV2,
  pool = poolDefault,
  dirtyDbTable = "spasm_events"
): Promise<SpasmEventV2[] | null> => {
  console.log("filters:", filters)
  let limit = 20
  const maxLimit = 300
  // spasm.sanitizeEvent() can sanitize any object/array
  spasm.sanitizeEvent(filters)

  if (
    // Limit is a number
    typeof(filters?.limit) === "number" &&
    filters?.limit >= 0
  ) {
    limit = Number(filters.limit)
  } else if (
    // Limit is a string
    typeof(filters?.limit) === "string" &&
    Number(filters?.limit) >= 0
  ) {
    limit = Number(filters.limit)
  } else if (
    // Limit is not specified
    !filters?.limit &&
    typeof(filters?.limit) !== "number"
  ) {
    // Do nothing
  }

  if (limit > maxLimit) { limit = maxLimit }

  try {
    const dbTable = DOMPurify.sanitize(dirtyDbTable)
    const params: any[] = [limit]
    const conditions: string[] = []

    if (
      filters?.category &&
      (
        typeof(filters?.category) === "string" ||
        typeof(filters?.category) === "number"
      ) &&
      filters?.category !== "any"
    ) {
      const queryObjectForCategory = {
        "categories": [ { "name": filters?.category } ]
      }
      params.push(queryObjectForCategory)
      // Using ${params.length} instead of numbers like $1, $2
      conditions.push(`
        spasm_event @> $${params.length}::jsonb `)
    }

    if (filters?.action && (
      typeof(filters?.action) === "string" ||
      typeof(filters?.action) === "number"
    )) {
      const queryObjectForAction = {
        "action": filters?.action
      }
      params.push(queryObjectForAction)
      // Using ${params.length} instead of numbers like $1, $2
      conditions.push(`
        spasm_event @> $${params.length}::jsonb `)
    }

    if (filters?.source && (
      typeof(filters?.source) === "string" ||
      typeof(filters?.source) === "number"
    )) {
      const queryObjectForSource = {
        "source": { "name": filters?.source }
      }
      params.push(queryObjectForSource)
      // Using ${params.length} instead of numbers like $1, $2
      conditions.push(`
        spasm_event @> $${params.length}::jsonb `)
    }

    if (filters?.keyword && (
      typeof(filters?.keyword) === "string" ||
      typeof(filters?.keyword) === "number"
    )) {
      const queryArrayForKeyword = [
        { "keywords": [ filters?.keyword ] },
        { "keywords": [ filters?.keyword.toUpperCase() ] },
        { "keywords": [ filters?.keyword.toLowerCase() ] }
      ]
      params.push(queryArrayForKeyword)
      // Using ${params.length} instead of numbers like $1, $2
      conditions.push(`
        spasm_event @> ANY($${params.length}::jsonb[]) `)
    }

    // Activity filter (the amount of reactions)
    let minimumReactTotal: number | null = null
    if (filters?.activity === "hot") {
      minimumReactTotal = env.feedFiltersActivityHot
    } else if (filters?.activity === "rising") {
      minimumReactTotal = env.feedFiltersActivityRising
    }
    if (minimumReactTotal) {
      params.push(minimumReactTotal)
      conditions.push(`
        EXISTS (
          SELECT 1
          FROM jsonb_array_elements(spasm_events.stats) AS stat
          WHERE stat->>'action' = 'react'
          AND (stat->>'total')::integer >= $${params.length}
        )
      `)
    }

    // webType is added at the end because it doesn't
    // push any parameters
    if (
      filters?.webType && typeof(filters?.webType) === "string"
    ) {
      let sqlQueryHasSignature = `
        EXISTS (
          SELECT 1 FROM jsonb_array_elements(spasm_event->'signatures') AS signature
          WHERE signature->>'value' IS NOT NULL AND signature->>'value' != ''
        ) `

      if (filters?.webType === "web3") {
        conditions.push(sqlQueryHasSignature)
      } else if (filters?.webType === "web2") {
        conditions.push("NOT " + sqlQueryHasSignature)
      } else if (filters?.webType === "all") {
        // do nothing
      }
    }
    
    // Base query
    // EXPLAIN ANALYZE
    let sqlQuery = `
      SELECT *
      FROM ${dbTable} `

    // Params from filters
    // if (params.length > 1) {
    if (conditions.length > 0) {
      sqlQuery += `
      WHERE ${conditions.join(" AND ")} `
    }

    // Order
    sqlQuery += `
      ORDER BY db_added_timestamp DESC
    `

    // Base limit
    sqlQuery += `
      LIMIT COALESCE($1, 20)
    `

    console.log("sqlQuery:", sqlQuery)
    console.log("params:", params)
    // console.log("conditions:", conditions)

    const events = await pool.query(sqlQuery, params)

    // if (events.rows.length > 0) return events.rows

    const spasmEvents: SpasmEventV2[] = []
    
    if (events?.rows && Array.isArray(events.rows)) {
      events.rows.forEach((row: any) => {
        if (
          row && typeof(row) === "object" &&
          'spasm_event' in row &&
          row.spasm_event &&
          typeof(row.spasm_event) === "object"
        ) {
          const spasmEvent: SpasmEventV2 = joinDbInfo(
            row, dbTable
          )
          spasmEvent.type = "SpasmEventV2"
          spasmEvents.push(spasmEvent)
        }
      })
    }

    if (
      spasmEvents && Array.isArray(spasmEvents) &&
      hasValue(spasmEvents)
    ) {
      return spasmEvents
    } else {
      return null
    }
  } catch (err) {
    console.error(err);
  }

  return null
}

// export const fetchFullEventIdsFromShortId = async (
//   dirtyId
// ): SpasmEventV2[] => {
//   if (!env.enableShortUrlsForWeb3Actions) return []
//
//   const id = DOMPurify.sanitize(dirtyId)
//   if (typeof(id) !== "string") { return []}
//   // Exit if ID length is short to minimize DDoS attacks
//   if (id.length < 15) { return []}
//
//   try {
//     let data
//     let postsTable, idColumn, author, date
//
//     // web3
//     postsTable = 'actions'
//     idColumn = 'signature'
//     author = 'signer'
//     date = 'added_time'
//
//     data = await fetchFullIds(postsTable, idColumn, author, date, id)
//
//     return data
//   } catch (err) {
//     console.error('fetchFullIds failed:', err.message);
//   }
// }
//
// // 'id' is passed in a parameterized query to prevent SQL injections
// const fetchFullIds = async (postsTable, idColumn, author, date, id) => {
//   // '%' is added to match all values that start with id
//   const idLike = id + '%'
//   try {
//     // It's important to exclude ${actionsCountTable}.target column from SELECT
//     // because otherwise it will overwrite ${postsTable}.target column
//     // Another solution is to rename ${actionsCountTable}.target column in db
//     const fullIds = await pool.query(`
//       SELECT ${idColumn}, ${author}, ${date}
//       FROM ${postsTable}
//       WHERE ${idColumn} LIKE $1
//       ORDER BY ${date} ASC
//       LIMIT 30`
//     , [idLike] );
//     return fullIds.rows
//   } catch (err) {
//     console.error(err);
//   }
// }
