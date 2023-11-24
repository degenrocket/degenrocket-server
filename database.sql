/* The default timeout of rss-parser should be increased
 * when parsing many sources.
 * Open:
 * node_modules/rss-parser/lib/parser.js:15
 * Change 60000 (60 sec) to 120000 (120 sec) 
 * E.g.:
 * const DEFAULT_TIMEOUT = 120000;
 */

CREATE DATABASE news_database;

CREATE TABLE IF NOT EXISTS posts(
id SERIAL NOT NULL,
guid TEXT NOT NULL PRIMARY KEY,
source TEXT,
category TEXT,
/* tags TEXT, */
tickers TEXT,
title TEXT,
url TEXT,
description TEXT,
pubdate TIMESTAMPTZ
);

/* table with proof of all actions */
/* TODO: add PRIMARY KEY to signature column for indexing? */
CREATE TABLE IF NOT EXISTS actions(
id SERIAL NOT NULL,
target TEXT NOT NULL,
action TEXT,
category TEXT,
/* tags TEXT, */
/* tickers TEXT, */
title TEXT,
text TEXT,
signer TEXT,
signed_message TEXT,
signature TEXT,
signed_time TIMESTAMPTZ,
added_time TIMESTAMPTZ
);

/* table with counted actions for each target */
CREATE TABLE IF NOT EXISTS public.actions_count
(
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
