import { poolDefault, poolTest } from "../../db";
import {
  // SpasmEventV2,
  SpasmEventDatabaseV2,
  SpasmEventIdFormatNameV2,
  SpasmEventV2,
  UnknownEventV2
} from "../../types/interfaces";
import {
  hasValue,
  isObjectWithValues,
  toBeString,
  toBeTimestamp
} from "../utils/utils";
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
    db_updated_timestamp
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
  return spasmEvent
}

// TODO convert SpasmEventDatabaseV2 to Envelope
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

 /**
  * -> operator gets a JSON object field as JSON (or JSONB),
  * ->> operator gets a JSON object field as text
  */
  try {
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

export const fetchAllSpasmEventsV2ByIds = async (
  dirtyIds: (string | number)[],
  pool = poolDefault,
  dirtyDbTable = "spasm_events"
): Promise<SpasmEventV2[] | null> => {
  if (!dirtyIds || !Array.isArray(dirtyIds)) return null
  spasm.sanitizeEvent(dirtyIds)
  const ids = dirtyIds
  const dbTable = DOMPurify.sanitize(dirtyDbTable)

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

// TODO
// fetchSpasmEventsV2ByParentId()
export const fetchAllSpasmEventsV2BySigner = async (
  dirtySigner: string,
  pool = poolDefault,
  dirtyDbTable = "spasm_events"
): Promise<SpasmEventV2[] | null> => {
  if (!dirtySigner || typeof(dirtySigner) !== "string") {
    return null
  }

  const signer = DOMPurify.sanitize(dirtySigner)
  const dbTable = DOMPurify.sanitize(dirtyDbTable)

  try {
    // Works
    const res = await pool.query(`
      SELECT *
      FROM ${dbTable}
      WHERE spasm_event @> $1::jsonb
      `,
      [
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

export const fetchAllSpasmEventsV2ByPubkey = fetchAllSpasmEventsV2BySigner

export const fetchAllSpasmEventsV2ByAuthorAddress = fetchAllSpasmEventsV2BySigner

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
    const dbTable = DOMPurify.sanitize(dirtyDbTable)
    const idFormatName = DOMPurify.sanitize(dirtyIdFormatName)
    const idFormatVersion =
      DOMPurify.sanitize(dirtyIdFormatVersion)

    const spasmEventV2 = spasm.toBeSpasmEventV2(unknownEvent)

    if (!spasmEventV2) return []

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

export const isReactionDuplicate = async (
  unknownEvent: UnknownEventV2,
  pool = poolDefault,
  dirtyDbTable = "spasm_events"
): Promise<boolean> => {
  try {
    const dbTable = DOMPurify.sanitize(dirtyDbTable)

    const spasmEventV2 = spasm.toBeSpasmEventV2(unknownEvent)

    if (!spasmEventV2) return false

    const verifiedSigners: (string | number)[] =
      spasm.getVerifiedSigners(spasmEventV2)

    if (
      !verifiedSigners ||
      !Array.isArray(verifiedSigners) ||
      !hasValue(verifiedSigners)
    ) {
      return false
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

export const deleteSpasmEventV2FromDbById = async (
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
      DELETE
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

    return res.rowCount > 0
  } catch (err) {
    console.error(err);
    return null
  }
}

export const isEventBanned = async (
  unknownEvent: UnknownEventV2,
  pool = poolDefault,
  dirtyDbTable = "spasm_events"
): Promise<boolean> => {
  try {
    const dbTable = DOMPurify.sanitize(toBeString(dirtyDbTable))
    const spasmEventV2 = spasm.toBeSpasmEventV2(unknownEvent)
    if (!spasmEventV2) return false

    const spasmId = spasm.getIdByFormat(spasmEventV2, {
      name: "spasmid", version: "01"
    })

    if (!spasmId) return false

    if (
      spasmEventV2.ids && Array.isArray(spasmEventV2.ids)
    ) {
      const ids = spasm.getAllIdsFromArrayOfIdObjects(
        spasmEventV2.ids
      )
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
  if (!dirtyIds || !Array.isArray(dirtyIds)) return null

  spasm.sanitizeEvent(dirtyIds)
  const ids = dirtyIds
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
