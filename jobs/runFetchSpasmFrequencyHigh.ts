// SPASM module is disabled by default
const enableSpasmModule: boolean = process.env.ENABLE_SPASM_MODULE === 'true' ? true : false
const enableSpasmSourcesUpdates: boolean = process.env.ENABLE_SPASM_SOURCES_UPDATES === 'true' ? true : false
import { fetchPostsFromSpasmSources } from "../helper/spasm/fetchPostsFromSpasmSources";

// Override console.log for production
if (process.env.NODE_ENV !== "dev") {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

if (enableSpasmModule && enableSpasmSourcesUpdates) {
  fetchPostsFromSpasmSources("high")
}
