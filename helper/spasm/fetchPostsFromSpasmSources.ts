import fs from 'fs';
import path from 'path';
import axios, { AxiosResponse } from 'axios';
import { SpasmSource, Post, IgnoreWhitelistFor } from "../../types/interfaces";
import { submitAction } from "../sql/submitAction";
// SPASM module is disabled by default
const enableSpasmModule: boolean = process.env.ENABLE_SPASM_MODULE === 'true' ? true : false
const enableSpasmSourcesUpdates: boolean = process.env.ENABLE_SPASM_SOURCES_UPDATES === 'true' ? true : false
const env = process?.env
const ignoreWhitelistForActionPostInSpasmModule: boolean = env?.IGNORE_WHITELIST_FOR_ACTION_POST_IN_SPASM_MODULE === 'false' ? false : true

// Override console.log for production
if (process.env.NODE_ENV !== "dev") {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

/**
 * There are different SPASM sources depending on
 * the update frequency: high, medium, low.
 * The exact time intervals of update frequencies
 * can be changed with .env variables.
 */
export const fetchPostsFromSpasmSources = async (frequency?: string) => {
  if (!frequency) return
  if (!enableSpasmModule) return
  if (!enableSpasmSourcesUpdates) return

  // console.log('process.env.NODE_ENV =', process.env.NODE_ENV)
  const time = new Date(Date.now()).toISOString();
  console.log('fetchPostsFromSpasmSources is called at:', time)

  let sources = []

  /**
    * https://github.com/breejs/bree/tree/master/examples/typescript
    * Bree works weird with TypeScript, so getting sources from .ts file
    * in dev mode (with TS_NODE) and from .js file in production.
    */
  let absolutePath: string
  if (process.env.TS_NODE) {
    absolutePath = path.resolve(__dirname, 'custom/customSpasmSources.ts')
  } else {
    absolutePath = path.resolve(__dirname, 'custom/customSpasmSources.js')
  }

  // Check if a file with custom feed sources exists
  if (fs.existsSync(absolutePath)) {
    const {
      spasmSourcesFrequencyHigh,
      spasmSourcesFrequencyMedium,
      spasmSourcesFrequencyLow,
      spasmSourcesFrequencyTest
    } = require(absolutePath);

    switch (frequency) {
      case 'high':
        sources = spasmSourcesFrequencyHigh
        break
      case 'medium':
        sources = spasmSourcesFrequencyMedium
        break
      case 'low':
        sources = spasmSourcesFrequencyLow
        break
      case 'test':
        sources = spasmSourcesFrequencyTest
        break
    }
  } else {
    console.error(absolutePath, "file doesn't exist. If you want to use SPASM module, make sure to create this file and specify SPASM sources as shown in the example file in the same folder.")
  }

  const getData = async (source: SpasmSource) => {
    try {
      if (!source.apiUrl) return

      let fetchUrl = source.apiUrl

      if (source.query) {
        fetchUrl += source.query
      }

      console.log("fetchUrl:", fetchUrl)

      // Admins can choose to insert actions received from
      // other instances of the network even if they were signed
      // by non-whitelisted addresses.
      // In other words, admins can choose to trust other
      // instances to properly protect their instances,
      // e.g., from spam and low-quality content.
      const ignoreWhitelistFor = new IgnoreWhitelistFor()
      if (ignoreWhitelistForActionPostInSpasmModule) {
        ignoreWhitelistFor.action.post = true
      }

      type ApiResponse = Post[]

      const response: AxiosResponse<ApiResponse> = await axios.get<ApiResponse>(fetchUrl);

      if (response.data) {
        await Promise.all(response.data.map((post) =>
          submitAction(
            { unknownEvent: post },
            ignoreWhitelistFor
          )
        ))
      } else {
        console.log("data for submitAction is null")
      }
    } catch (err) {
      // console.error('getData failed for source:', source, 'with error message:', err);
      console.error('getData failed for source.apiUrl:', source.apiUrl, 'at time:', time, ', an error message is hidden to easier analyze error logs');
    }
  };

  try {
    // Promise.all and map are used because
    // await doesn't work with array.forEach
    let fetchResult = []
    if (sources && sources[0]) {
      fetchResult = await Promise.all(sources.map(getData))
      return fetchResult[0] ? 'SPASM successfully fetched' : 'Something went wrong. SPASM not fetched'
    }
    return 'There are no SPASM sources'

  } catch (err) {
    console.error(err);
  }
}
