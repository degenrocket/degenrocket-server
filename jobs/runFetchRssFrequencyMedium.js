const fetchPostsFromRssSources = require("../helper/rss/fetchPostsFromRssSources");

// Override console.log for production
if (process.env.NODE_ENV !== "dev") {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

fetchPostsFromRssSources("medium")
