import {DB_CONFIG_DEFAULT, DB_CONFIG_TEST} from "../../../db"
import {verifyDbTables} from "../../dbUtils"

const main = async () => {
  console.log("----------------")
  const dbConfig = DB_CONFIG_DEFAULT
  console.log("Main database:", DB_CONFIG_DEFAULT.database)
  await verifyDbTables(dbConfig)

  console.log("----------------")
  console.log("Test database:", DB_CONFIG_TEST.database)
  const dbConfigTest = DB_CONFIG_TEST
  await verifyDbTables(dbConfigTest)

  console.log("----------------")
}

main().catch(console.error)
