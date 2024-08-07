import {
  dbName,
  dbNameTest,
  DB_CONFIG_DEFAULT,
  DB_CONFIG_DEFAULT_WITHOUT_DATABASE,
  DB_CONFIG_TEST,
  DB_CONFIG_TEST_WITHOUT_DATABASE,
  pool as defaultPool
} from "../db";
import { Pool } from 'pg';
import { Client } from 'pg';
import { escapeIdentifier } from 'pg'
import fs from 'fs';
import path from 'path';
require('dotenv').config()

const absolutePath = path.resolve(__dirname, '../databaseV2.sql')

export async function createDatabase(
  databaseName: string,
  dbConfig = DB_CONFIG_DEFAULT_WITHOUT_DATABASE
) {
  // Not using DB_CONFIG_DEFAULT because for this
  // client config we haven't yet created a new database.
  // Thus, we will attempt to connect to an original database,
  // which is usually called "postgres", but it can be changed
  // in the env file.
  const { user } = dbConfig
  const client = new Client(dbConfig)
  await client.connect();

  try {
    // Select EXISTS doesn't work with tests, so disabling.
    // const sqlIfDatabaseExist = await client.query(
    //   "SELECT EXISTS(SELECT FROM pg_database WHERE datname = $1);",
    //   [databaseName]
    // );
    // if (sqlIfDatabaseExist) {

    const sqlIfDatabaseExist = await client.query(
      "SELECT FROM pg_database WHERE datname = $1;",
      [databaseName]
    )

    if (sqlIfDatabaseExist.rows[0]) {
      console.log(`${databaseName} already exist.`)
    } else {
      console.log(`${databaseName} doesn't exist. Creating...`)
      await client.query(`CREATE DATABASE ${databaseName};`);
      console.log(`${databaseName} has been created.`)
    }
  } catch (error) {
    console.error('Error creating database:', error.stack);
    console.log("================================")
    console.error(`Note: this step can fail if your db user '${user}' doesn't have a permission to create a new database. In that case you can either manually create new main and test databases by executing an SQL command from 'database.sql' file, which should be located in the root folder, or you can grant your user a privilege to create new databases by connecting to your default database and running the following SQL command as a superuser:`);
    console.log(`ALTER USER ${user} CREATEDB;`)
    console.log("After your user is granted a privilege to create new databases, you can execute this script again.")
    console.log("================================")
  } finally {
    client.end();
  }
}

export const createDbTables = async (
  dbConfig = DB_CONFIG_DEFAULT
) => {
  console.log("createDbTables called")
  const client = new Client(dbConfig)
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
    console.log("createDbTables finished")
    client.end();
  }
}

export const howManyEntriesInTable = async (
  tableName: string,
  pool: Pool = defaultPool
): Promise<number> => {
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

    if (typeof(numberOfEntries === "number")) {
      return Number(numberOfEntries)
    } else if (typeof(numberOfEntries === "string")) {
      return Number(numberOfEntries)
    }

    return 0
  } catch (error) {
    console.error('howManyEntriesInTable failed', error)
    return 0;
  }
}

export const databaseSize = async (
  pool: Pool = defaultPool
) => {
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

export const getTableNames = async (
  pool: Pool = defaultPool
) => {
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

export const logNumberOfEntriesForEachTable = async (
  pool: Pool = defaultPool
) => {
  await getTableNames(pool).then(async (tableNames) => {
    for (const tableName of tableNames) {
      try {
        const numberOfEntries =
          await howManyEntriesInTable(tableName, pool);
        console.log(
          `Table ${tableName} has ${numberOfEntries} entries.`
        );
      } catch (error) {
        console.error(
          `Error fetching entries for table ${tableName}`, error
        );
      }
    }
  });
}

export const getTotalEntriesInDb = async (
  pool: Pool = defaultPool
) => {
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
}

export const verifyTableStructure = async (
  tableName: string,
  expectedColumns: { [key: string]: string },
  dbConfig = DB_CONFIG_DEFAULT,
  ifTryToAutoFixProblems = false
) => {
  const client = new Client(dbConfig);
  const { database } = dbConfig;

  await client.connect();

  try {
    const query = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = $1
    `;
    const res = await client.query(query, [tableName]);

    if (res.rows.length === 0) {
      console.error(`Table '${tableName}' does not exist in database '${database}'.`);
      return false;
    }

    // Check if all expected columns are present
    for (const key in expectedColumns) {
      let found = false;
      for (const column of res.rows) {
        if (key === column.column_name) {
          found = true;
          break; // Found the expected column, no need to continue checking
        }
      }
      if (!found) {
        if (ifTryToAutoFixProblems) {
          console.log(`Expected column '${key}' of type '${expectedColumns[key]}' is missing in table '${tableName}' in database '${database}'.`);
          console.log(`Auto-fix is enabled so let's try to fix the problem by creating a column.`)
          const addedSuccess = await addColumnOfTypeToDbTable(
            key, expectedColumns[key], tableName, dbConfig
          )
          if (addedSuccess) {
            console.log(`Successfully added column '${key}'.`)
            return true
          } else {
            console.error(`Failed to add column '${key}'.`)
            return false
          }
        } else {
          console.error(`ERROR: Expected column '${key}' of type '${expectedColumns[key]}' is missing in table '${tableName}' in database '${database}'. You'll have to manually delete the table with "DROP TABLE ${tableName};" query in database '${database}' and then recreate the table again, e.g., by running database migration or initialization scripts.`);
          return false;
        }
      }
    }

    // Check if all columns have the correct data type
    for (const column of res.rows) {
      if (!expectedColumns[column.column_name] || expectedColumns[column.column_name] !== column.data_type) {
        console.error(`ERROR: Column '${column.column_name}' in table '${tableName}' does not match expected data type in database '${database}'.`);
        return false;
      }
    }

    console.log(`Table '${tableName}' in database '${database}' has the correct structure.`);
    return true;
  } catch (error) {
    console.error(`ERROR: received an error while verifying table structure in database '${database}': ${error}`);
    return false;
  } finally {
    client.end();
  }
}

export const addColumnOfTypeToDbTable = async (
  columnName: string,
  columnDataType: string,
  tableName: string,
  dbConfig = DB_CONFIG_DEFAULT
): Promise<boolean> => {
  const client = new Client(dbConfig);
  const { database } = dbConfig;

  await client.connect();

  try {
    const query = `
      ALTER TABLE ${tableName}
      ADD COLUMN ${columnName} ${columnDataType}
    `;
    const res = await client.query(
      // query, [columnName, columnDataType]
      query
    );
    return true
  } catch (error) {
    console.error(`ERROR: received an error while adding a column '${columnName}' of data type '${columnDataType}' in table '${tableName}' in database '${database}'. The error is: ${error}`);
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
  stats: 'jsonb',
  shared_by: 'jsonb',
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

const expectedColumnsAdminEvents = {
  spasm_event: 'jsonb',
  db_key: 'integer',
  db_added_timestamp: 'bigint',
  db_updated_timestamp: 'bigint'
};

const expectedColumnsAppConfigs = {
  spasm_event: 'jsonb',
  db_key: 'integer',
  db_added_timestamp: 'bigint',
  db_updated_timestamp: 'bigint'
};

export const verifyDbTables = async (
  dbConfig = DB_CONFIG_DEFAULT,
  ifTryToAutoFixProblems = false
): Promise<boolean> => {
  console.log("verifyDbTables called")
  const tablePosts = await verifyTableStructure(
    'posts', expectedColumnsPosts,
    dbConfig, ifTryToAutoFixProblems
  );
  if (!tablePosts) { return false }

  const tableSpasmEvents = await verifyTableStructure(
    'spasm_events', expectedColumnsSpasmEvents,
    dbConfig, ifTryToAutoFixProblems
  );
  if (!tableSpasmEvents) { return false }

  const tableSpasmUsers = await verifyTableStructure(
    'spasm_users', expectedColumnsSpasmUsers,
    dbConfig, ifTryToAutoFixProblems
  );
  if (!tableSpasmUsers) { return false }

  const tableSpasmSources = await verifyTableStructure(
    'spasm_sources', expectedColumnsSpasmSources,
    dbConfig, ifTryToAutoFixProblems
  );
  if (!tableSpasmSources) { return false }

  const tableRssSources = await verifyTableStructure(
    'rss_sources', expectedColumnsRssSources,
    dbConfig, ifTryToAutoFixProblems
  );
  if (!tableRssSources) { return false }

  const tableAdminEvents = await verifyTableStructure(
    'admin_events', expectedColumnsAdminEvents,
    dbConfig, ifTryToAutoFixProblems
  );
  if (!tableAdminEvents) { return false }

  const tableAppConfigs = await verifyTableStructure(
    'app_configs', expectedColumnsAppConfigs,
    dbConfig, ifTryToAutoFixProblems
  );
  if (!tableAppConfigs) { return false }

  console.log("verifyDbTables finished")
  return true
}

const initializeDatabase = async (
  databaseName = dbName,
  dbConfigWithoutDatabase = DB_CONFIG_DEFAULT_WITHOUT_DATABASE,
  dbConfig = DB_CONFIG_DEFAULT,
  ifTryToAutoFixProblems = false
): Promise<boolean> => {
  await createDatabase(databaseName, dbConfigWithoutDatabase)

  await createDbTables(dbConfig)

  const verificationStep = await verifyDbTables(
    dbConfig, ifTryToAutoFixProblems
  )

  console.log("verificationStep:", verificationStep)

  if (verificationStep) {
    console.log("All tables have correct structures.")
  } else {
    console.log("Some tables have incorrect structure.")
    console.log("Aborting...")
    return false
  }
  console.log("Database is initialized.")
  console.log("========================")
  return true
}

export const initializeDatabaseMain = async (
): Promise<boolean> => {
  console.log("Initialize a main database.")
  return await initializeDatabase(
    dbName,
    DB_CONFIG_DEFAULT_WITHOUT_DATABASE,
    DB_CONFIG_DEFAULT,
    // Try to auto-fix issues (might mess up db)
    true
  )
}

export const initializeDatabaseTest = async (
): Promise<boolean> => {
  console.log("Initialize a test database.")
  return await initializeDatabase(
    dbNameTest,
    DB_CONFIG_TEST_WITHOUT_DATABASE,
    DB_CONFIG_TEST,
    // Try to auto-fix issues (might mess up db)
    true
  )
}

