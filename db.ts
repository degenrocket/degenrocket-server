import { Pool } from 'pg';
import { Client } from 'pg';
require('dotenv').config()
// require('dotenv').config({ path: "../.env" })
const host = process.env.POSTGRES_HOST || "localhost";
const dbport = process.env.POSTGRES_PORT || 5432;
const database = process.env.POSTGRES_DATABASE || "spasm_database";
const password = process.env.POSTGRES_PASSWORD || "dbuser";
const user = process.env.POSTGRES_USER || "dbuser";
const databaseOriginalName = process.env.POSTGRES_ORIGINAL_DATABASE_NAME || "postgres";

export const testDatabase = database
  ? database + "_test"
  : "spasm_database_test"

export const dbHost = host
export const dbPort = dbport
export const dbName = database
export const dbNameTest = testDatabase
export const dbPassword = password
export const dbUser = user

// Override console.log for production
if (process.env.NODE_ENV !== "dev") {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

// Default configuration for client/pool
export const DB_CONFIG_DEFAULT = {
  user: user,
  password: password,
  database: database,
  // for docker-compose use "host: 'db',"
  host: host,
  port: dbport
};

// Client without database is used to create a new database
export const DB_CONFIG_DEFAULT_WITHOUT_DATABASE = {
  user: user,
  password: password,
  database: databaseOriginalName,
  host: host,
  port: dbport
};

// Define default configuration
export const DB_CONFIG_TEST = {
  user: user,
  password: password,
  database: testDatabase,
  host: host,
  port: dbport
};

// Client without database is used to create a new database
export const DB_CONFIG_TEST_WITHOUT_DATABASE = {
  user: user,
  password: password,
  database: databaseOriginalName,
  host: host,
  port: dbport
};

export const poolDefault = new Pool(DB_CONFIG_DEFAULT);
// Alias
export const pool = poolDefault;

export const poolTest = new Pool(DB_CONFIG_TEST);

// Create a new client on-the-fly
export const createDbClientDefault = () => {
  return new Client(DB_CONFIG_DEFAULT);
}
// Alias
export const createDbClient = createDbClientDefault

// Create a new test client on-the-fly
export const createDbClientTest = () => {
  return new Client(DB_CONFIG_TEST);
}

export const createDbClientDefaultWithoutDatabase = () => {
  return new Client(DB_CONFIG_DEFAULT_WITHOUT_DATABASE);
}

export const createDbClientTestWithoutDatabase = () => {
  return new Client(DB_CONFIG_TEST_WITHOUT_DATABASE);
}
