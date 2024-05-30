import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import { verifyDbTables } from "./../migrations/v2/02_verifyDbTables";
require('dotenv').config()

const host = process.env.POSTGRES_HOST || "localhost";
const dbport = process.env.POSTGRES_PORT || "5432";
const database = process.env.POSTGRES_DATABASE || "spasm_database";
const password = process.env.POSTGRES_PASSWORD || "dbuser";
const user = process.env.POSTGRES_USER || "dbuser";

const absolutePath = path.resolve(__dirname, '../../../databaseV2.sql')

async function createDatabase(databaseName: string) {
  const client = new Client({
    user: user,
    host: host,
    password: password,
    port: dbport,
  });

  await client.connect();

  try {
    const sqlIfDatabaseExist = await client.query(
      "SELECT FROM pg_database WHERE datname = $1;",
      [databaseName]
    )
    if (sqlIfDatabaseExist.rows[0]) {
      console.log(`${databaseName} already exist.`)
    } else {
      console.log(`${databaseName} doesn't exist. Creating...`)
      await client.query(`CREATE DATABASE ${databaseName};`);
      // await client.query("CREATE DATABASE $1;", [databaseName]);
      console.log(`${databaseName} has been created.`)
    }
  } catch (error) {
    console.error('Error creating database:', error.stack);
  } finally {
    client.end();
  }
}

export const createDbTables = async (databaseName: string) => {
  const client = new Client({
    user: user,
    host: host,
    database: databaseName,
    password: password,
    port: dbport,
  });
  console.log("createDbTables called")
  await client.connect();
  try {
    // Check if a file with database queries exists
    if (fs.existsSync(absolutePath)) {
      const sql = fs.readFileSync(absolutePath, 'utf8');

      await client.query(sql);
    }
    console.log("All tables are created")
    return true
  } catch (err) {
    console.error('createDbTables failed', err);
    return false
  } finally {
    client.end();
  }
}

const main = async () => {
  const databaseName = database

  await createDatabase(databaseName)

  await createDbTables(databaseName)

  const verificationStep = await verifyDbTables()

  console.log("verificationStep:", verificationStep)

  if (verificationStep) {
    console.log("All tables have correct structures.")
  } else {
    console.log("Some tables have incorrect structure.")
    console.log("Aborting...")
    return
  }
  console.log("Database is initialized.")
}

main().catch(console.error)
