/* The default timeout of rss-parser should be increased
 * when parsing many sources.
 * Open:
 * node_modules/rss-parser/lib/parser.js:15
 * Change 60000 (60 sec) to 120000 (120 sec) 
 * E.g.:
 * const DEFAULT_TIMEOUT = 120000;
 */

// Override console.log for production
if (process.env.NODE_ENV !== "dev") {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

// Medium feed examples:
// https://medium.com/feed/@username
// https://username.medium.com/feed
// https://medium.com/feed/publication-name
// https://customdomain.com/feed

// Reddit feed examples:
// https://www.reddit.com/r/news/.rss
// https://www.reddit.com/user/alienth/.rss
// A multireddit: https://www.reddit.com/r/news+wtf.rss (note that the slash is optional).

// Examples:
// "https://source.com/rss",
// "https://source.com/rss.xml",
// "https://source.com/blog.xml",
// "https://feed.source.com",
// "https://source.com/feed",
// "https://source.com/feed.xml",
// "https://source.com/atom.xml",
// "https://source.com/blog/atom.xml"
// "https://api.source.com/feed"
// "https://source.com/feeds/news.atom.xml"
// "https://source.com/feeds/news.rss.xml"
// "https://github.com/user/project/releases.atom"

const feedSourcesFrequencyHigh =
  [
    // sources are sorted by name
    // {
    //   category: "",
    //   url: "",
    //   name: "",
    //   includeSummary: true,
    //   tickers: ""
    // },
  ];

const feedSourcesFrequencyMedium =
  [
    // ====================================
    // Category: defi
    // sources are sorted by name
    {
      category: "defi",
      url: "https://thedefiant.io/api/feed",
      name: "thedefiant.io",
      includeSummary: true,
      tickers: ""
    },

    // ====================================
    // Category: privacy
    // sources are sorted by name
    {
      category: "privacy",
      url: "https://www.getmonero.org/feed.xml",
      name: "getmonero-blog",
      includeSummary: true,
      tickers: "XMR"
    },
    {
      category: "privacy",
      url: "https://monero.observer/feed-stories-mini.xml",
      name: "moneroobserver-feed",
      includeSummary: true,
      tickers: "XMR"
    },
  ];

const feedSourcesFrequencyLow =
  [
    // sources are sorted by name
    // {
    //   category: "",
    //   url: "",
    //   name: "",
    //   includeSummary: true,
    //   tickers: ""
    // },
  ];

// Test sources are used for testing the RSS module
const feedSourcesFrequencyTest =
  [
    // sources are sorted by name
    // {
    //   category: "",
    //   url: "",
    //   name: "",
    //   includeSummary: true,
    //   tickers: ""
    // },
  ];

// Archived sources are not used for fetching updates
const feedSourcesArchived =
  [
    // sources are sorted by name
    // {
    //   category: "",
    //   url: "",
    //   name: "",
    //   includeSummary: true,
    //   tickers: ""
    // },
  ];

module.exports = { feedSourcesFrequencyHigh, feedSourcesFrequencyMedium, feedSourcesFrequencyLow, feedSourcesFrequencyTest };
