/* 
 * IF NOT EXISTS clause is not supported for creating tables
 * directly, so we need to use a conditional check.
 */

-- It's important to create two databases:
-- main database is used to store events and other data,
-- test database is used to run tests (npm run test).
--  CREATE DATABASE spasm_database;
--  CREATE DATABASE spasm_database_test;

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
            -- TODO
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
END $$;
