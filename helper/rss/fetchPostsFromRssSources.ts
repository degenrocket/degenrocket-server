import { getFeed } from "./getFeed";
import { stripFeedItem } from "./stripFeedItem";
import { pool } from "../../db";
import fs from 'fs';
import path from 'path';
// RSS module is disabled by default
const enableRssModule = process.env.ENABLE_RSS_MODULE === 'true' ? true : false
const enableRssSourcesUpdates = process.env.ENABLE_RSS_SOURCES_UPDATES === 'true' ? true : false

// Override console.log for production
if (process.env.NODE_ENV !== "dev") {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

/**
 * There are different RSS sources depending on
 * the update frequency: high, medium, low.
 * The exact time intervals of update frequencies
 * can be changed with .env variables.
 */
export const fetchPostsFromRssSources = async (frequency) => {
  // console.log('process.env.NODE_ENV =', process.env.NODE_ENV)
  const time = new Date(Date.now()).toISOString();
  // console.error('fetchPostsFromRssSources is called at:', time)

  let sources = []

  if (enableRssModule && enableRssSourcesUpdates) {
    const absolutePath = path.resolve("./helper/rss/custom/customFeedSources.js");

    // Check if a file with custom feed sources exists
    if (fs.existsSync(absolutePath)) {
      const { feedSourcesFrequencyHigh, feedSourcesFrequencyMedium, feedSourcesFrequencyLow, feedSourcesFrequencyTest } = require(absolutePath);

      switch (frequency) {
        case 'high':
          sources = feedSourcesFrequencyHigh
          break
        case 'medium':
          sources = feedSourcesFrequencyMedium
          break
        case 'low':
          sources = feedSourcesFrequencyLow
          break
        case 'test':
          sources = feedSourcesFrequencyTest
          break
      }
    } else {
      console.error(absolutePath, "file doesn't exist. If you want to use RSS module, make sure to create this file and specify RSS sources as shown in the example file in the same folder.")
    }
  }

  const getData = async (source) => {
    try {
      const data = await getFeed(source);
      // TODO: refactor. Check if items exist
      data ? data.items.forEach(strip) : console.log("data is null");
      // data ? data.items.forEach(filterData) : console.log("data is null");
      data
        ? await Promise.all(data.items.map(filterData))
        : console.log("data for filterData is null")
      return data
        ? true
        : false
    } catch (err) {
      // console.error('getData failed for source:', source, 'with error message:', err);
      console.error('getData failed for source.url:', source.url, 'at time:', time, ', an error message is hidden to easier analyze error logs');
    }
  };

  // delete unnecessary fields from feed item
  const strip = (item, index, arr) => {
    const strippedFeedItem = stripFeedItem(item);
    arr[index] = strippedFeedItem;
  }

  // check for duplicates
  const filterData = async (item) => {
    try {
      const post = await pool.query(`
        SELECT * FROM posts WHERE url = $1`
        , [item.link])
      
      console.log('logging item from filterData in ferchAllPostsFromRSS.js is temporary disabled')
      // console.log('logging item from filterData in ferchAllPostsFromRSS.js:' item)

      post.rowCount > 0
        ? console.log(item.link + " already in db")
        : insertData(item)
      console.log("================================")
    } catch (err) {
      console.error('filterData failed', err);
    }
  };

  // insert item into database
  const insertData = async (item) => {
    console.log("inserting data")
    try {
      const newPost = await pool.query(`
        INSERT INTO posts (guid, source, category, tickers, title, url, description, pubdate)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (guid) DO NOTHING`,
        [item.guid, item.source, item.category, item.tickers, item.title, item.link, item.contentSnippet, item.pubDate]
      );
      // the solution below resets serial sequence after failed insertion
      // const resetSequenceToMax = await pool.query(
      //   "SELECT setval(pg_get_serial_sequence('posts', 'id'), MAX(id), true) FROM posts"
      // );
    } catch (err) {
      // console.error('insertData failed', err);
      console.error('insertData failed for the item.link:', item.link, 'with error message:', err);
    }
  };

  try {
    // Promise.all and map are used because
    // await doesn't work with array.forEach
    let fetchResult = []
    if (sources && sources[0]) {
      fetchResult = await Promise.all(sources.map(getData))
      return fetchResult[0] ? 'RSS successfully fetched' : 'Something went wrong. RSS not fetched'
    }
    return 'There are no RSS sources'

  } catch (err) {
    console.error(err);
  }
}
