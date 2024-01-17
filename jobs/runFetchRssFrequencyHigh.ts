// RSS module is disabled by default
const enableRssModule: boolean = process.env.ENABLE_RSS_MODULE === 'true' ? true : false
const enableRssSourcesUpdates: boolean = process.env.ENABLE_RSS_SOURCES_UPDATES === 'true' ? true : false
import { fetchPostsFromRssSources } from "../helper/rss/fetchPostsFromRssSources";

// Override console.log for production
if (process.env.NODE_ENV !== "dev") {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

if (enableRssModule && enableRssSourcesUpdates) {
  fetchPostsFromRssSources("high")
}
