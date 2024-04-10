import fs from 'fs';
import path from 'path';
import { fetchPostById } from "../../helper/sql/fetchPostById";
import { pool } from "../../db";

console.log("starting migration to v2")
console.log("starting creating new database tables")

const absolutePath = path.resolve(__dirname, '../../database.sql')

// Check if a file with database queries exists
if (fs.existsSync(absolutePath)) {
  const sql = fs.readFileSync(absolutePath, 'utf8');
  // console.log("sql:", sql)
}

const getItem = async () => {
  try {
    const result = await pool.query(
      `SELECT id, title FROM posts WHERE id=$1`
      // `SELECT id, title FROM posts WHERE id=10;`
      , [10]
    );
    const item = result.rows[0]
    console.log("item:", item)
    return item
  } catch (err) {
    console.error('getItem failed', err);
  } finally {
    await pool.end();
  }
}

// getItem()
const id = 123;

const startMigration = async () => {
  const itemById = await fetchPostById(id);

  console.log("------------------")

  console.log("itemById:", itemById)
}

startMigration()
