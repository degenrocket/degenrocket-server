import { pool } from "../../db";
import { escapeIdentifier } from 'pg'

export const howManyEntriesInTable = async (tableName: string) => {
 try {
    // Escape the table name to prevent SQL injection
    // escapeIdentifier is used to escape identifiers
    // (like table names, column names) in SQL queries
    // to prevent SQL injection attacks.
    const escapedTableName = escapeIdentifier(tableName);

    // Construct the query string with the escaped table name
    const query = `SELECT COUNT(*) FROM ${escapedTableName}`;

    const res = await pool.query(query);

    const numberOfEntries = res.rows[0].count;

    return numberOfEntries;
  } catch (error) {
    console.error('howManyEntriesInTable failed', error);
    return 0;
  }
}

export const databaseSize = async () => {
 try {
    const query = 'SELECT pg_size_pretty(pg_database_size(current_database())) AS size';

    const res = await pool.query(query);

    const size = res.rows[0].size

    return size;
  } catch (error) {
    console.error('databaseSize failed', error);
    return 0;
  }
}

export const getTableNames = async () => {
 try {
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public' AND table_type='BASE TABLE'
    `;

    const res = await pool.query(query);
    const tableNames = res.rows.map(row => row.table_name);
    return tableNames;
 } catch (error) {
    console.error('Error fetching table names', error);
    return [];
 }
};

export const logNumberOfEntriesForEachTable = async () => {
  await getTableNames().then(async (tableNames) => {
    for (const tableName of tableNames) {
      try {
        const numberOfEntries = await howManyEntriesInTable(tableName);
        console.log(`Table ${tableName} has ${numberOfEntries} entries.`);
      } catch (error) {
        console.error(`Error fetching entries for table ${tableName}`, error);
      }
    }
  });
}

export const getTotalEntriesInDb = async () => {
 try {
    const query = `
      WITH tbl AS
       (SELECT table_schema,
                TABLE_NAME
         FROM information_schema.tables
         WHERE TABLE_NAME NOT LIKE 'pg_%'
           AND table_schema IN ('public'))
      SELECT SUM((xpath('/row/c/text()', query_to_xml(format('SELECT COUNT(*) AS c FROM %I.%I', table_schema, TABLE_NAME), FALSE, TRUE, '')))[1]::text::bigint) AS total_entries
      FROM tbl;
    `;

    const res = await pool.query(query);

    const totalEntries = res.rows[0].total_entries

    return totalEntries;
 } catch (error) {
    console.error('Error fetching table names', error);
    return [];
 }
};
