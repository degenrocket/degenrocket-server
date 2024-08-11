import { fetchPostsFromRssSources } from "../helper/rss/fetchPostsFromRssSources";
import { env } from "./../appConfig"
const { enableRssModule, enableRssSourcesUpdates } = env

// Override console.log for production
if (process.env.NODE_ENV !== "dev") {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

if (enableRssModule && enableRssSourcesUpdates) {
  fetchPostsFromRssSources("low")
}
