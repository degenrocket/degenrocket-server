/* The default timeout of rss-parser should be increased
 * when parsing many sources.
 * Open:
 * node_modules/rss-parser/lib/parser.js:15
 * Change 60000 (60 sec) to 120000 (120 sec) 
 * E.g.:
 * const DEFAULT_TIMEOUT = 120000;
 */

CREATE DATABASE news_database;

CREATE TABLE posts(
id SERIAL NOT NULL,
guid TEXT NOT NULL PRIMARY KEY,
source TEXT,
category TEXT,
tickers TEXT,
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
    spasm_event JSONB
);

CREATE TABLE users (
    user JSONB
);

CREATE TABLE rss_sources (
    rss_source JSONB
);

CREATE TABLE spasm_sources (
    spasm_source JSONB
);

CREATE TABLE extra_items (
    extra_item JSONB
);
