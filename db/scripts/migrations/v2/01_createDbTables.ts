import fs from 'fs';
import path from 'path';
import { pool } from "../../../../db";

const absolutePath = path.resolve(__dirname, '../../databaseV2.sql')

// Cannot create a database with this function due to an error:
// CREATE DATABASE cannot run inside a transaction block,
// but we can create new database tables.
export const createDbTables = async () => {
  try {
    // Check if a file with database queries exists
    if (fs.existsSync(absolutePath)) {
      const sql = fs.readFileSync(absolutePath, 'utf8');

      await pool.query(sql);
    }
    return true
  } catch (err) {
    console.error('createDbTables failed', err);
    return false
  }
}
