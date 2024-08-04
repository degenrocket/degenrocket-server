const DOMPurify = require('isomorphic-dompurify');
const { convert } = require('html-to-text');

// Override console.log for production
if (process.env.NODE_ENV !== "dev") {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

const _ = require("lodash");
export const stripFeedItem = (feedItem) => {

  // atom feed items have 'id' instead of 'guid', 
  // so we can either change db
  // and drop PRIMARY KEY and NOT NULL for the guid column,
  // or we can set guid to be equal to id.
  if (!feedItem.guid && feedItem.id) {
    feedItem.guid = feedItem.id
  }

  // some atom feed items have 'summary' instead of 'contentSnippet'
  if (!feedItem.contentSnippet && feedItem.summary) {
    feedItem.contentSnippet = feedItem.summary
  }

  // some atom feed items have 'summary' instead of 'contentSnippet'
  if (!feedItem.contentSnippet && feedItem['content:encoded']) {
    feedItem.contentSnippet = feedItem['content:encoded']
  }

  feedItem.guid = DOMPurify.sanitize(feedItem.guid)
  feedItem.source = DOMPurify.sanitize(feedItem.source)
  feedItem.tickers = DOMPurify.sanitize(feedItem.tickers)
  feedItem.title = DOMPurify.sanitize(feedItem.title)
  feedItem.link = DOMPurify.sanitize(feedItem.link)
  feedItem.contentSnippet = DOMPurify.sanitize(feedItem.contentSnippet)
  feedItem.pubDate = DOMPurify.sanitize(feedItem.pubDate)

  const options = {
    // wordwrap: 130,
    wordwrap: false,
    // ...
  }

  feedItem.contentSnippet = convert(feedItem.contentSnippet, options);

  // Limit the post description to 1024 chars to reduce
  // the size of a database and a JSON object with feed posts
  // that users fetch via the UI interface.
  if (typeof(feedItem.contentSnippet === 'string')) {
    feedItem.contentSnippet = feedItem.contentSnippet.slice(0,1024) + '...'
  }

  // console.log("feedItem['content:encoded'] before pick:", feedItem['content:encoded'])
  // console.log("feedItem.contentSnippet before pick:", feedItem.contentSnippet)
  // console.log("feedItem.summary before pick:", feedItem.summary)
  // console.log("feedItem.description before pick:", feedItem.description)

  // contentSnippet is description in rss-parser
  // TODO replace lodash _.pick function with native one
  _.pick(feedItem, ["guid", "source", "tickers", "title", "link", "contentSnippet", "pubDate"]);
  
  // strip off '?source=' or '?utm_source=' and everything after that
  feedItem.link = feedItem.link.replace(/(\?source=.*$)|(\?utm_source=.*$)/, "");

  // strip off everything after 'GMT+0000' in pubDate, but keep 'GMT+0000'
  // E.g. some sources add ' (Coordinateed Universal Time)' after 'GMT+0000'
  feedItem.pubDate = feedItem.pubDate.replace(/GMT\+0000.*$/, "GMT+0000");

  return feedItem;
}
