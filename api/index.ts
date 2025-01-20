import Bree from "bree";
import path from 'path';
import dotenv from "dotenv";
import { startServer } from './app';
dotenv.config();

const port: string = process.env.BACKEND_PORT;
// RSS module is disabled by default
const enableRssModule: boolean = process.env.ENABLE_RSS_MODULE === 'true' ? true : false
const enableRssSourcesUpdates: boolean = process.env.ENABLE_RSS_SOURCES_UPDATES === 'true' ? true : false
// Default update frequencies are set to weird numbers to minimize overlapping
const rssFrequencyLowTimeInterval: string = process.env.RSS_FREQUENCY_LOW_TIME_INTERVAL || '50s'
const rssFrequencyMediumTimeInterval: string = process.env.RSS_FREQUENCY_MEDIUM_TIME_INTERVAL || '15m'
const rssFrequencyHighTimeInterval: string = process.env.RSS_FREQUENCY_HIGH_TIME_INTERVAL || '58m'
// SPASM module is disabled by default
const enableSpasmModule: boolean = process.env.ENABLE_SPASM_MODULE === 'true' ? true : false
const enableSpasmSourcesUpdates: boolean = process.env.ENABLE_SPASM_SOURCES_UPDATES === 'true' ? true : false
// Default update frequencies are set to weird numbers to minimize overlapping
const spasmFrequencyLowTimeInterval: string = process.env.SPASM_FREQUENCY_LOW_TIME_INTERVAL || '45s'
const spasmFrequencyMediumTimeInterval: string = process.env.SPASM_FREQUENCY_MEDIUM_TIME_INTERVAL || '12m'
const spasmFrequencyHighTimeInterval: string = process.env.SPASM_FREQUENCY_HIGH_TIME_INTERVAL || '52m'

// Override console.log for production
console.log(`NODE_ENV=${process.env.NODE_ENV}`)
if (process.env.NODE_ENV !== "dev") {
  // var console =  {}
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

startServer(port)

// TODO may be move bree into startServer because the function
// is async due to loading app config from database, but it
// doesn't have 'await'.
let breeJobs = []

if (enableRssModule && enableRssSourcesUpdates) {
  breeJobs.push(
    {
      name : 'runFetchRssFrequencyHigh',
      interval : rssFrequencyHighTimeInterval
    },
    {
      name : 'runFetchRssFrequencyMedium',
      interval : rssFrequencyMediumTimeInterval
    },
    {
      name : 'runFetchRssFrequencyLow',
      interval : rssFrequencyLowTimeInterval
    }
  )
}

if (enableSpasmModule && enableSpasmSourcesUpdates) {
  breeJobs.push(
    {
      name : 'runFetchSpasmFrequencyHigh',
      interval : spasmFrequencyHighTimeInterval
    },
    {
      name : 'runFetchSpasmFrequencyMedium',
      interval : spasmFrequencyMediumTimeInterval
    },
    {
      name : 'runFetchSpasmFrequencyLow',
      interval : spasmFrequencyLowTimeInterval
    }
  )
}

// Bree is used instead of node-cron for scheduled jobs
const bree = new Bree({
  /**
    * https://github.com/breejs/bree/tree/master/examples/typescript
    * Bree works weird with TypeScript, so added npm script to package.json
    * in order to run Bree in dev mode:
    * "dev": "NODE_ENV=dev TS_NODE=true NODE_OPTIONS=\"-r ts-node/register\" node api/index.ts",
    * Always set the root option when doing any type of
    * compiling with bree. This just makes it clearer where
    * bree should resolve the jobs folder from. By default it
    * resolves to the jobs folder relative to where the program
    * is executed.
    */
  root: path.join(__dirname, '../jobs'),
  /**
    * We only need the default extension to be "ts"
    * when we are running the app with ts-node - otherwise
    * the compiled-to-js code still needs to use JS
    */
  defaultExtension: process.env.TS_NODE ? 'ts' : 'js',
  jobs: breeJobs,
  errorHandler: (error, workerMetadata) => {
    console.error(`There was an error while running a worker ${workerMetadata.name}`, error);
  }
})

console.log("bree.config.jobs:", bree.config.jobs)

if ((enableRssModule && enableRssSourcesUpdates) || (enableSpasmModule && enableSpasmSourcesUpdates)) {
  console.log("starting bree")
  bree.start()
}
