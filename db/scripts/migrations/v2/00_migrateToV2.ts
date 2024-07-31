import { migrateData } from "./03_migrateData";
import {
  databaseSize,
  logNumberOfEntriesForEachTable,
  getTotalEntriesInDb,
  initializeDatabaseMain,
  initializeDatabaseTest
} from "../../../dbUtils";
import { pool } from "../../../../db";

const migrateToV2 = async () => {
  try {
    console.log("Database before migration:")
    await logNumberOfEntriesForEachTable(pool)
    console.log("Total entries:", await getTotalEntriesInDb(pool))
    console.log("Total size:", await databaseSize(pool))

    console.log("starting migration")

    const successDatabaseMain = await initializeDatabaseMain()
    if (!successDatabaseMain) {
      console.log("ERROR: main database initialization failed")
      return
    }

    const successDatabaseTest = await initializeDatabaseTest()
    if (!successDatabaseTest) {
      console.log("ERROR: test database initialization failed")
      return
    }

    // const step01 = await createDbTables()
    // console.log("step01:", step01)
    // if (!step01) {
    //   console.error("ERROR: Creation of db tables failed")
    //   return
    // }
    //
    // const step02 = await verifyDbTables()
    // console.log("step02:", step02)
    // if (!step02) {
    //   console.error("ERROR: Verification of db tables failed")
    //   return
    // }
    //
    const step03 = await migrateData()

    console.log("step03:", step03)

    await logNumberOfEntriesForEachTable(pool)

    // if (step02) {
    //   console.log("All tables have correct structures.")
    // } else {
    //   console.log("Some tables have incorrect structure.")
    //   console.log("Aborting...")
    //   return
    // }

  } catch (err) {
    console.error('migrateToV2 failed', err);

  } finally {
    await pool.end();

    console.log("================")
  }
}

migrateToV2()
