require('dotenv').config()
// require('dotenv').config({ path: "../.env" })
const host = process.env.POSTGRES_HOST;
const port = process.env.POSTGRES_PORT;
const database = process.env.POSTGRES_DATABASE;
const password = process.env.POSTGRES_PASSWORD;
const user = process.env.POSTGRES_USER;
// const Pool = require("pg").Pool;
import { Pool } from 'pg';

// Override console.log for production
if (process.env.NODE_ENV !== "dev") {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

export const pool = new Pool({
  user: user,
  password: password,
  database: database,
  // for docker-compose use "host: 'db',"
  host: host,
  port: port
});

// pool.end()

// module.exports = pool;
