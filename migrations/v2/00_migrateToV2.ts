import { createDbTables } from "./01_createDbTables";
import { verifyDbTables } from "./02_verifyDbTables";
import {
  databaseSize,
  logNumberOfEntriesForEachTable,
  getTotalEntriesInDb
} from "../../helper/sql/dbUtils";
import { pool } from "../../db";

const migrateToV2 = async () => {
  try {
    console.log("Database before migration:")
    await logNumberOfEntriesForEachTable()
    console.log("Total entries:", await getTotalEntriesInDb())
    console.log("Total size:", await databaseSize())

    console.log("starting migration")

    const step01 = await createDbTables()

    console.log("step01:", step01)

    const step02 = await verifyDbTables()

    console.log("step02:", step02)

  } catch (err) {
    console.error('migrateToV2 failed', err);

  } finally {
    await pool.end();

    console.log("migration finished")
  }
}

migrateToV2()
