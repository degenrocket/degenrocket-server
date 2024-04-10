import { pool } from "../../db";

async function verifyTableStructure(tableName: string, expectedColumns: { [key: string]: string }) {
 try {
    const query = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = $1
    `;
    const res = await pool.query(query, [tableName]);

    if (res.rows.length === 0) {
      console.error(`Table ${tableName} does not exist.`);
      return false;
    }

    for (const column of res.rows) {
      if (!expectedColumns[column.column_name] || expectedColumns[column.column_name] !== column.data_type) {
        console.error(`Column ${column.column_name} does not match expected data type.`);
        return false;
      }
    }

    console.log(`Table ${tableName} has the correct structure.`);
    return true;
  } catch (error) {
    console.error(`Error verifying table structure: ${error}`);
    return false;
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
  db_key: 'integer',
  version: 'character varying',
  id: 'text',
  timestamp: 'bigint',
  db_timestamp: 'bigint',
  links: 'jsonb',
  keywords: 'ARRAY',
  tags: 'jsonb',
  media: 'jsonb',
  references: 'jsonb',
  original_event_object: 'jsonb',
  original_event_string: 'text',
  stats: 'jsonb',
  signature: 'text',
  meta: 'jsonb'
};


export const verifyDbTables = async () => {
  const tablePosts = await verifyTableStructure('posts', expectedColumnsPosts);
  if (!tablePosts) { return false }

  const tableSpasmEvent = await verifyTableStructure('spasm_events', expectedColumnsSpasmEvents);
  if (!tableSpasmEvent) { return false }

  return true
}


