/* 
 * IF NOT EXISTS clause is only supported for CREATE DATABASE,
 * CREATE SCHEMA, and CREATE TABLESPACE statements in Postgres,
 * but not for creating tables directly. For tables, we need to
 * use a conditional check.
 */

--  CREATE DATABASE IF NOT EXISTS news_database;
--  CREATE DATABASE news_database;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'spasm_events'
    ) THEN
        -- JSONB stores JSON objects, arrays, nested arrays
        CREATE TABLE spasm_events (
            event JSONB
            --  db_key SERIAL PRIMARY KEY,
            --  version VARCHAR(255),
            --  id TEXT,
            --  timestamp BIGINT,
            --  db_timestamp BIGINT,
            --  links JSONB,
            --  keywords TEXT[],
            --  tags JSONB,
            --  media JSONB,
            --  references JSONB,
            --  original_event_object JSONB,
            --  original_event_string TEXT,
            --  stats JSONB,
            --  signature TEXT
            --  meta JSONB,
        );
    END IF;
END $$;
