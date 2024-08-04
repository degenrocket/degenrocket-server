import {DB_CONFIG_DEFAULT, DB_CONFIG_TEST, poolDefault, poolTest} from "../../../db"
import {
  databaseSize,
  getTotalEntriesInDb,
  logNumberOfEntriesForEachTable
} from "../../dbUtils"

const main = async () => {
  console.log("----------------")
  console.log("Main database:", DB_CONFIG_DEFAULT.database)
  await logNumberOfEntriesForEachTable(poolDefault)
  console.log("Total entries:", await getTotalEntriesInDb(poolDefault))
  console.log("Total size:", await databaseSize(poolDefault))


  console.log("----------------")
  console.log("Test database:", DB_CONFIG_TEST.database)
  await logNumberOfEntriesForEachTable(poolTest)
  console.log("Total entries:", await getTotalEntriesInDb(poolTest))
  console.log("Total size:", await databaseSize(poolTest))

  console.log("----------------")
}

main().catch(console.error)
