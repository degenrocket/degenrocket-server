// import { pool } from "../../../../db";
import { Client } from 'pg';
require('dotenv').config()

const host = process.env.POSTGRES_HOST;
const dbport = process.env.POSTGRES_PORT;
const database = process.env.POSTGRES_DATABASE;
const password = process.env.POSTGRES_PASSWORD;
const user = process.env.POSTGRES_USER;

async function verifyTableStructure(tableName: string, expectedColumns: { [key: string]: string }) {
  const client = new Client({
    user: user,
    host: host,
    database: database,
    password: password,
    port: dbport,
  });

  await client.connect();

  try {
    const query = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = $1
    `;
    const res = await client.query(query, [tableName]);

    if (res.rows.length === 0) {
      console.error(`Table ${tableName} does not exist.`);
      return false;
    }

    for (const column of res.rows) {
      if (!expectedColumns[column.column_name] || expectedColumns[column.column_name] !== column.data_type) {
        console.error(`Column ${column.column_name} in table ${tableName} does not match expected data type.`);
        return false;
      }
    }

    console.log(`Table ${tableName} has the correct structure.`);
    return true;
  } catch (error) {
    console.error(`Error verifying table structure: ${error}`);
    return false;
  } finally {
    client.end();
  }
}

const expectedColumnsPosts = {
  id: 'integer',
  guid: 'text',
  source: 'text',
  category: 'text',
  tickers: 'text',
  tags: 'text',
  title: 'text',
  url: 'text',
  description: 'text',
  pubdate: 'timestamp with time zone',
};

const expectedColumnsSpasmEvents = {
  spasm_event: 'jsonb',
  db_key: 'integer',
  db_added_timestamp: 'bigint',
  db_updated_timestamp: 'bigint'
};

const expectedColumnsSpasmUsers = {
  spasm_user: 'jsonb',
  db_key: 'integer',
  db_added_timestamp: 'bigint',
  db_updated_timestamp: 'bigint'
};

const expectedColumnsSpasmSources = {
  spasm_source: 'jsonb',
  db_key: 'integer',
  db_added_timestamp: 'bigint',
  db_updated_timestamp: 'bigint'
};

const expectedColumnsRssSources = {
  rss_source: 'jsonb',
  db_key: 'integer',
  db_added_timestamp: 'bigint',
  db_updated_timestamp: 'bigint'
};

export const verifyDbTables = async (): Promise<boolean> => {
  const tablePosts = await verifyTableStructure('posts', expectedColumnsPosts);
  if (!tablePosts) { return false }

  const tableSpasmEvents = await verifyTableStructure('spasm_events', expectedColumnsSpasmEvents);
  if (!tableSpasmEvents) { return false }

  const tableSpasmUsers = await verifyTableStructure('spasm_users', expectedColumnsSpasmUsers);
  if (!tableSpasmUsers) { return false }

  const tableSpasmSources = await verifyTableStructure('spasm_sources', expectedColumnsSpasmSources);
  if (!tableSpasmSources) { return false }

  const tableRssSources = await verifyTableStructure('rss_sources', expectedColumnsRssSources);
  if (!tableRssSources) { return false }

  return true
}


