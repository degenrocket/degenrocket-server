import {
  initializeDatabaseMain,
  initializeDatabaseTest
} from "../../dbUtils"

const main = async () => {
  await initializeDatabaseMain()
  await initializeDatabaseTest()
}

main().catch(console.error)
