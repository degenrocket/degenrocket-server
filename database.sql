/*
 * To initialize a database you have two options.
 *
 * Option 1.
 * npm run initialize-db
 * 
 * Option 2.
 * - Create two databases (recommended name is "spasm_database")
 *   CREATE DATABASE spasm_database;
 *   CREATE DATABASE spasm_database_test;
 * - Create tables by manually executing the SQL code below: 
 */

/* 
 * IF NOT EXISTS clause is not supported for creating tables
 * directly, so we need to use a conditional check.
 */

DO $$
BEGIN
    -- V1
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'posts'
    ) THEN
        CREATE TABLE posts (
            id SERIAL NOT NULL,
            guid TEXT NOT NULL PRIMARY KEY,
            source TEXT,
            category TEXT,
            tickers TEXT,
            tags TEXT,
            title TEXT,
            url TEXT,
            description TEXT,
            pubdate TIMESTAMPTZ
        );
    END IF;
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'actions'
    ) THEN
        CREATE TABLE actions (
            id SERIAL NOT NULL,
            target TEXT NOT NULL,
            action TEXT,
            category TEXT,
            tags TEXT,
            tickers TEXT,
            title TEXT,
            text TEXT,
            signer TEXT,
            signed_message TEXT,
            signature TEXT,
            signed_time TIMESTAMPTZ,
            added_time TIMESTAMPTZ
        );
    END IF;
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'actions_count'
    ) THEN
        CREATE TABLE actions_count (
            target text NOT NULL,
            upvote integer,
            downvote integer,
            bullish integer,
            bearish integer,
            important integer,
            scam integer,
            comments_count integer,
            latest_action_added_time TIMESTAMPTZ,
            PRIMARY KEY (target)
        );
    END IF;

    -- -- -- --
    -- V2
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'spasm_events'
    ) THEN
        -- JSONB stores JSON objects, arrays, nested arrays
        CREATE TABLE spasm_events (
            spasm_event JSONB,
            stats JSONB,
            shared_by JSONB,
            db_key SERIAL PRIMARY KEY NOT NULL,
            db_added_timestamp BIGINT,
            db_updated_timestamp BIGINT
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
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'spasm_users'
    ) THEN
        CREATE TABLE spasm_users (
            spasm_user JSONB,
            db_key SERIAL PRIMARY KEY NOT NULL,
            db_added_timestamp BIGINT,
            db_updated_timestamp BIGINT
        );
    END IF;
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'spasm_sources'
    ) THEN
        CREATE TABLE spasm_sources (
            spasm_source JSONB,
            db_key SERIAL PRIMARY KEY NOT NULL,
            db_added_timestamp BIGINT,
            db_updated_timestamp BIGINT
        );
    END IF;
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'rss_sources'
    ) THEN
        CREATE TABLE rss_sources (
            rss_source JSONB,
            db_key SERIAL PRIMARY KEY NOT NULL,
            db_added_timestamp BIGINT,
            db_updated_timestamp BIGINT
        );
    END IF;
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'extra_items'
    ) THEN
        CREATE TABLE extra_items (
            extra_item JSONB,
            db_key SERIAL PRIMARY KEY NOT NULL,
            db_added_timestamp BIGINT,
            db_updated_timestamp BIGINT
        );
    END IF;
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'admin_events'
    ) THEN
        CREATE TABLE admin_events (
            spasm_event JSONB,
            db_key SERIAL PRIMARY KEY NOT NULL,
            db_added_timestamp BIGINT,
            db_updated_timestamp BIGINT
        );
    END IF;
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'app_configs'
    ) THEN
        CREATE TABLE app_configs (
            spasm_event JSONB,
            db_key SERIAL PRIMARY KEY NOT NULL,
            db_added_timestamp BIGINT,
            db_updated_timestamp BIGINT
        );
    END IF;

-- -- -- --
--  Indices

--  Create indices
--  Index the whole 'spasm_event' column:
    --  CREATE INDEX spasm_events_event_idx ON spasm_events USING GIN (spasm_event);
    --  Table: spasm_events
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'spasm_events_event_idx'
    ) THEN
        EXECUTE 'CREATE INDEX spasm_events_event_idx ON spasm_events USING GIN (spasm_event)';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'spasm_events_stats_idx'
    ) THEN
        EXECUTE 'CREATE INDEX spasm_events_stats_idx ON spasm_events USING GIN (stats)';
    END IF;

    --  Table: spasm_users
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'spasm_users_user_idx'
    ) THEN
        EXECUTE 'CREATE INDEX spasm_users_user_idx ON spasm_users USING GIN (spasm_user)';
    END IF;

    --  Table: spasm_sources
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'spasm_sources_source_idx'
    ) THEN
        EXECUTE 'CREATE INDEX spasm_sources_source_idx ON spasm_sources USING GIN (spasm_source)';
    END IF;

    --  Table: rss_sources
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'rss_sources_source_idx'
    ) THEN
        EXECUTE 'CREATE INDEX rss_sources_source_idx ON rss_sources USING GIN (rss_source)';
    END IF;

    --  Table: extra_items
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'extra_items_item_idx'
    ) THEN
        EXECUTE 'CREATE INDEX extra_items_item_idx ON extra_items USING GIN (extra_item)';
    END IF;

    --  Table: admin_events
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'admin_events_event_idx'
    ) THEN
        EXECUTE 'CREATE INDEX admin_events_event_idx ON admin_events USING GIN (spasm_event)';
    END IF;

    --  Table: app_configs
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'app_configs_event_idx'
    ) THEN
        EXECUTE 'CREATE INDEX app_configs_event_idx ON app_configs USING GIN (spasm_event)';
    END IF;

--  Check indices
    --  SELECT indexname FROM pg_indexes WHERE tablename = 'spasm_events';
    --  SELECT pg_size_pretty(pg_indexes_size('spasm_events'));

END $$;
