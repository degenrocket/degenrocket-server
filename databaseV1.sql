/*
 * To initialize a database you have two options.
 *
 * Option 1.
 * npm run initialize-db
 * 
 * Option 2.
 * - Create database (recommended name is "spasm_database")
 *   CREATE DATABASE spasm_database;
 * - Create tables by manually executing the SQL code below: 
 */

/* 
 * Note for RSS module only (unrelated to database).
 * The default timeout of rss-parser should be increased
 * when parsing many sources.
 * Open:
 * node_modules/rss-parser/lib/parser.js:15
 * Change 60000 (60 sec) to 120000 (120 sec) 
 * E.g.:
 * const DEFAULT_TIMEOUT = 120000;
 */

CREATE TABLE posts(
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

/* table with proof of all actions */
CREATE TABLE actions(
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

/* table with counted actions for each target */
CREATE TABLE public.actions_count (
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

CREATE TABLE spasm_events (
    spasm_event JSONB,
    stats JSONB,
    shared_by JSONB,
    db_key SERIAL PRIMARY KEY NOT NULL,
    db_added_timestamp BIGINT,
    db_updated_timestamp BIGINT
);

CREATE TABLE spasm_users (
    spasm_user JSONB,
    db_key SERIAL PRIMARY KEY NOT NULL,
    db_added_timestamp BIGINT,
    db_updated_timestamp BIGINT
);

CREATE TABLE spasm_sources (
    spasm_source JSONB,
    db_key SERIAL PRIMARY KEY NOT NULL,
    db_added_timestamp BIGINT,
    db_updated_timestamp BIGINT
);

CREATE TABLE rss_sources (
    rss_source JSONB,
    db_key SERIAL PRIMARY KEY NOT NULL,
    db_added_timestamp BIGINT,
    db_updated_timestamp BIGINT
);

CREATE TABLE extra_items (
    extra_item JSONB,
    db_key SERIAL PRIMARY KEY NOT NULL,
    db_added_timestamp BIGINT,
    db_updated_timestamp BIGINT
);

CREATE TABLE admin_events (
    spasm_event JSONB,
    db_key SERIAL PRIMARY KEY NOT NULL,
    db_added_timestamp BIGINT,
    db_updated_timestamp BIGINT
);

CREATE TABLE app_configs (
    spasm_event JSONB,
    db_key SERIAL PRIMARY KEY NOT NULL,
    db_added_timestamp BIGINT,
    db_updated_timestamp BIGINT
);

/* Basic indexes */
--  CREATE INDEX idx_spasm_events_db_id ON spasm_events USING btree(db_id);
--  CREATE INDEX idx_spasm_events_spasm_id ON spasm_events USING btree(spasm_id);
--  CREATE INDEX idx_spasm_events_event_id ON spasm_events USING btree(event_id);
--  CREATE INDEX idx_spasm_events_root_event ON spasm_events USING btree(root_event);
--  CREATE INDEX idx_spasm_events_parent_event ON spasm_events USING btree(parent_event);
--  CREATE INDEX idx_spasm_events_timestamp ON spasm_events USING btree(timestamp);
--  CREATE INDEX idx_spasm_events_db_timestamp ON spasm_events USING btree(db_timestamp);
--  CREATE INDEX idx_spasm_events_author ON spasm_events USING btree(author);
--  CREATE INDEX idx_spasm_events_signature ON spasm_events USING btree(signature);

/* Advanced indexes */
--  CREATE INDEX idx_spasm_events_category ON spasm_events USING btree(category);
--  CREATE INDEX idx_spasm_events_links ON spasm_events USING gin(links);
--  CREATE INDEX idx_spasm_events_tags ON spasm_events USING gin(tags);
--  CREATE INDEX idx_spasm_events_media ON spasm_events USING gin(media);
--  CREATE INDEX idx_spasm_events_extra ON spasm_events USING gin(extra);
--  CREATE INDEX idx_spasm_events_original_event_object ON spasm_events USING gin(original_event_object);
--  CREATE INDEX idx_spasm_events_reactions ON spasm_events USING gin(reactions);
--  CREATE INDEX idx_spasm_events_comments ON spasm_events USING gin(comments);

/* Indexes inside JSON objects */
--  CREATE INDEX idx_spasm_events_meta_previous_event ON spasm_events ((meta -> 'previousEvent'));

/* table with roles and permissions for users */
--  CREATE TABLE IF NOT EXISTS users(
--  id SERIAL NOT NULL,
--  pubkey TEXT NOT NULL PRIMARY KEY,
--  admin integer,
--  moderator integer,
--  whitelist integer,
--  blacklist integer,
--  trust_level integer,
--  trust_score integer,
--  warning_level integer,
--  warning_score integer,
--  /*
--    Note: managing iframe tags via a database introduces
--    an additional attack vector since an adversary can
--    get an access to the database, give himself a permission
--    to embed iframe tags and then serve the malicious code
--    to users via iframe tags.
--    Thus, it's recommended to manage an allow list for iframe
--    tags via an environment file (.env) instead.
--    Only enable the line below 'allow_iframe integer,'
--    if you know what you're doing:
--  */
--  --  allow_iframe integer,
--  /*
--    Note: markdown should also be managed with caution.
--  */
--  -- allow_markdown integer,
--  allow_post integer,
--  allow_comment integer,
--  allow_react integer,
--  added_by TEXT,
--  added_time TIMESTAMPTZ,
--  last_change_by TEXT,
--  last_change_time TIMESTAMPTZ
--  );

/*
Signed reaction message structure:
{
  "version": "dmp_v0.1.0",
  "time": "",
  "action": "react",
  "target": "",
  "text": "",
  "license": "SPDX-License-Identifier: CC0-1.0"
}
*/

/*
Signed comment message structure:
{
  "version": "dmp_v0.1.0",
  "time": "",
  "action": "reply",
  "target": "",
  "text": "",
  "license": "SPDX-License-Identifier: CC0-1.0"
}
*/

/*
Signed post message structure:
{
  "version": "dmp_v0.1.0",
  "time": "",
  "action": "post",
  "title": "",
  "text": "",
  "tags": "",
  "license": "SPDX-License-Identifier: CC0-1.0"
}
*/

/*
Example of reaction:
{
  "version": "dmp_v0.1.0",
  "time": "Fri, 4 Jun 2021 19:00",
  "action": "react",
  "target": "https://website.com/?p=12345",
  "text": "Important",
  "license": "SPDX-License-Identifier: CC0-1.0"
}
Short:
{"version":"SM21","date":"Fri, 4 Jun 2021 19:00","action":"react","target":"https://website.com/?p=12345","message":"Important","license": "SPDX-License-Identifier: CC0-1.0"}
*/
