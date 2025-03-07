//require('dotenv').config({ path: "../.env" })
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { fetchAllPosts } from "../helper/sql/fetchAllPosts";
import { fetchPostById } from "../helper/sql/fetchPostById";
// import { fetchPostsByAuthor } from "../helper/sql/fetchPostsByAuthor";
import { fetchTargetComments } from "../helper/sql/fetchTargetComments";
import { fetchLatestComments } from "../helper/sql/fetchLatestComments";
import { fetchFullIdsFromShortId } from "../helper/sql/fetchFullIdsFromShortId";
// import { submitAction } from "../helper/sql/submitAction";
// import { fetchPostsFromRssSources } from "../helper/rss/fetchPostsFromRssSources";
import { QueryFeedFilters, FeedFilters, QueryFeedFiltersV2, FeedFiltersV2, SpasmEventEnvelopeV2, SpasmEventV2, AppConfig } from "../types/interfaces";
import {
  isArrayWithValues, isObjectWithValues,
  isStringOrNumber, isValidUrl
} from "../helper/utils/utils";
import {submitSpasmEvent} from "../helper/sql/submitSpasmEvent";
import {
  buildTreeDown,
  fetchAllSpasmEventsV2ByFilter,
  fetchSpasmEventV2ById,
  fetchSpasmEventV2ByShortId,
  fetchAllSpasmEventsV2BySigner,
  fetchAppConfig,
  fetchAllSpasmEventsV2ByParentIds
} from "../helper/sql/sqlUtils";
import {poolDefault} from "../db";
import { env, loadAppConfig } from "./../appConfig";
import {toBeHex} from "../helper/utils/nostrUtils";

const { spasm } = require('spasm.js');

dotenv.config();

const app: Express = express();
// const app = express();

// Override console.log for production
console.log(`NODE_ENV=${process.env.NODE_ENV}`)
if (process.env.NODE_ENV !== "dev") {
  // var console =  {}
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

app.use(cors())

app.use(express.json()) // => req.body

//ROUTES//

// get all posts
// Examples:
// "/api/posts?webType=web3&category=any&platform=false&source=false&activity=hot&keyword=false&ticker=false&limitWeb2=0&limitWeb3=10",
app.get("/api/posts", async(req: Request, res: Response) => {
  // res.json([{id: 1, title: "Great"}])
  const q: QueryFeedFilters = req.query
  const filters: FeedFilters = {
    webType: q.webType && q.webType !== 'false' ? q.webType : null,
    category: q.category && q.category !== 'false' ? q.category : null,
    platform: q.platform && q.platform !== 'false' ? q.platform : null,
    source: q.source && q.source !== 'false' ? q.source : null,
    activity: q.activity && q.activity !== 'false' ? q.activity : null,
    keyword: q.keyword && q.keyword !== 'false' ? q.keyword : null,
    ticker: q.ticker && q.ticker !== 'false' ? q.ticker : null,
    limitWeb2: q.limitWeb2 && q.limitWeb2 !== 'false' ? q.limitWeb2 : null,
    limitWeb3: q.limitWeb3 && q.limitWeb3 !== 'false' ? q.limitWeb3 : null
  }

  // Show a few web3 posts if no query is passed
  if (!isObjectWithValues(q)) { filters.limitWeb3 = 25 }

  try {
      const posts = await fetchAllPosts(filters)
      setTimeout(() => { res.json(posts) }, 200)
      // res.json(posts);
  } catch (err) {
    console.error(err);
    res.json(err);
  }
})

// Examples:
// /api/posts/search?p=abc123
app.get("/api/posts/:id", async(req: Request, res: Response) => {
  // console.log('req.params.id in /api/posts/:id is:', req.params.id)
  // console.log('req.params in /api/posts/:id is:', req.params)
  // console.log('req.query in /api/posts/:id is:', req.query)
  // console.log('req in /api/posts/:id is:', req)
  // console.log('req.query.target in /api/posts/:id is:', req.query.target)
  try {
    console.log('req.query.p in /api/posts/:id in api/index.js is:', req.query.p)
    if (req.query.p) {
      const post = await fetchPostById(req.query.p)
      if (post) {
        console.log('index.js - post has been found for req.query.p:', req.query.p)
        const setRes = () => res.json(post)
        setTimeout(setRes, 300)
        // res.json(post)
        return;
      }
    }

    console.log('index.js - post has not been found for req.query.p:', req.query.p)

    if (req.params.id && req.params.id !== 'search') {
      const post = await fetchPostById(req.params.id)
      if (post) {
        const setRes = () => res.json(post)
        setTimeout(setRes, 300)
        // res.json(post);
        return
      }

    }

    const setRes = () => res.json({ error: 'post has not been found' })
    setTimeout(setRes, 300)
    // res.json({ error: 'post has not been found' })
    return
  } catch (err) {
    console.error(err);
    res.json(err);
  }
})

// Fetch latest comments
app.get("/api/comments/", async(req: Request, res: Response) => {
  console.log("/api/comments/ called") 
  const q: QueryFeedFilters = req.query
  const filters: FeedFilters = {
    webType: q.webType && q.webType !== 'false' ? q.webType : null,
    category: q.category && q.category !== 'false' ? q.category : null,
    platform: q.platform && q.platform !== 'false' ? q.platform : null,
    source: q.source && q.source !== 'false' ? q.source : null,
    activity: q.activity && q.activity !== 'false' ? q.activity : null,
    keyword: q.keyword && q.keyword !== 'false' ? q.keyword : null,
    ticker: q.ticker && q.ticker !== 'false' ? q.ticker : null,
    limitWeb2: q.limitWeb2 && q.limitWeb2 !== 'false' ? q.limitWeb2 : null,
    limitWeb3: q.limitWeb3 && q.limitWeb3 !== 'false' ? q.limitWeb3 : null
  }
  try {
    const latestComments = await fetchLatestComments(filters)
    res.json(latestComments);
  } catch (err) {
    console.error(err);
  }
})

// Fetch all comments a target has
app.get("/api/targets/comments/:id", async(req: Request, res: Response) => {
  const target = req.query.target;
  console.log(`/api/targets/comments/:id called with target: ${target}`) 
  console.log("query:", req.query);

  try {
    const allCommentsForOneTarget = await fetchTargetComments(target)
    res.json(allCommentsForOneTarget);
  } catch (err) {
    console.error(err);
  }
})

// Fetch all actions an author submitted
app.get("/api/authors/:id", async(req: Request, res: Response) => {
  try {
    if (
      req?.params?.id && typeof (req?.params?.id) === "string"
    ) {
      const spasmEvents = await fetchAllSpasmEventsV2BySigner(
        req.params.id, poolDefault, "spasm_events"
      )
      if (isArrayWithValues(spasmEvents)) {
        const spasmEventEnvelopes: SpasmEventEnvelopeV2[] =
          spasm.convertManyToSpasmEventEnvelope(spasmEvents)

        // Convert all SpasmEvent to SpasmEventEnvelope
        if (isArrayWithValues(spasmEventEnvelopes)) {
          setTimeout(() => {res.json(spasmEventEnvelopes)}, 200)
        } else {
          setTimeout(() => {res.json(null)}, 200)
        }
      } else {
        setTimeout(() => {res.json(null)}, 200)
      }
    }
  } catch (err) {
    console.error(err);
    res.json(err);
  }
})

// Fetch all children of parent events
// Examples:
// /api/events/children/search?id=abc123
// /api/events/children/search?id=abc123&id=xyz
// /api/events/children/search?id=abc123&id=xyz&action=any
// /api/events/children/search?id=abc123&id=xyz&action=reply
// /api/events/children/search?id=abc123&action=reply&action=react
app.get("/api/events/children/:id", async(
  req: Request, res: Response
) => {
  try {
    if (req?.query?.id) {
      const action = req?.query?.action
      const actions = Array.isArray(action) ? action : [action]
      const actionsStrings: string[] = []
      actions.forEach(action => {
        if (String(action)) {actionsStrings.push(String(action))}
      })

      const id = req?.query?.id
      const ids = Array.isArray(id) ? id : [id]
      const idsStrings: string[] = []
      ids.forEach(id => {
        if (String(id)) { idsStrings.push(String(id)) }
      })
      const spasmEventsFinal: SpasmEventV2[] = []

      for (const actionStr of actionsStrings) {
        const spasmEvents =
          await fetchAllSpasmEventsV2ByParentIds(
            idsStrings, poolDefault, actionStr, "spasm_events"
          )
        if (isArrayWithValues(spasmEvents)) {
          spasmEvents.forEach(spasmEvent => {
            spasm.appendToArrayIfEventIsUnique(
              spasmEventsFinal, spasmEvent
            )
          })
        }
      }

      if (isArrayWithValues(spasmEventsFinal)) {
        // Convert all SpasmEvent to SpasmEventEnvelope
        const spasmEventEnvelopes: SpasmEventEnvelopeV2[] =
          spasm.convertManyToSpasmEventEnvelope(spasmEventsFinal)

        if (isArrayWithValues(spasmEventEnvelopes)) {
          setTimeout(() => {res.json(spasmEventEnvelopes)}, 200)
        } else {
          setTimeout(() => {res.json(null)}, 200)
        }
      } else {
        setTimeout(() => {res.json(null)}, 200)
      }
    }
  } catch (err) {
    console.error(err);
    res.json(err);
  }
})

// Fetch full ID from a short ID
// Used to shorten IDs/signatures in long URLs
// to e.g. 20 symbols instead of 132/128
app.get("/api/short-id/:id", async(req: Request, res: Response) => {
  const shortId = req.query.id;
  console.log(`/api/short-id/:id called with shortId: ${shortId}`) 
  console.log("query:", req.query);

  try {
    const allFullIdsThatMatchShortId = await fetchFullIdsFromShortId(shortId)
    res.json(allFullIdsThatMatchShortId);
  } catch (err) {
    console.error(err);
  }
})

app.post("/api/submit/", async (req: Request, res: Response) => {
  const event = req.body.unknownEvent
    ? req.body.unknownEvent
    : req.body

  console.log("event:", event)
  // Submit V2
  const submitResult = await submitSpasmEvent(event);

  // TODO delete after full transition to V2
  // Submit V0/V1
  // if (!("type" in event)) { await submitAction(req.body) }

  return res.json(submitResult);
});

// For RSS tests:
// app.get("/api/rss-fetch-testrun", async (req, res) => {
//   console.log('/api/rss-fetch-testrun is called')
//   if (enableRssModule && enableRssSourcesUpdates) {
//     try {
//       const result = await fetchPostsFromRssSources("test")
//       return res.json(result);
//     } catch (err) {
//       console.error(err);
//     }
//   }
// });

// V2
// Examples:
// "/api/events?webType=web3&category=any&source=false&activity=hot&keyword=false&limit=30",
app.get("/api/events", async(req: Request, res: Response) => {
  const q: QueryFeedFiltersV2 = req.query
  const filters: FeedFiltersV2 = {
    webType: q.webType && q.webType !== 'false' ? q.webType : null,
    action: q.action && q.action !== 'false' ? q.action : null,
    category: q.category && q.category !== 'false' ? q.category : null,
    source: q.source && q.source !== 'false' ? q.source : null,
    activity: q.activity && q.activity !== 'false' ? q.activity : null,
    keyword: q.keyword && q.keyword !== 'false' ? q.keyword : null,
    limit: q.limit && q.limit !== 'false' ? q.limit : null,
  }

  // Show a few events if no query is passed
  if (!isObjectWithValues(q)) { filters.limit = 25 }

  try {
      const spasmEvents = await fetchAllSpasmEventsV2ByFilter(
        filters, poolDefault, "spasm_events"
      )

      // Convert all SpasmEvent to SpasmEventEnvelope
      if (isArrayWithValues(spasmEvents)) {
        const spasmEventEnvelopes: SpasmEventEnvelopeV2[] =
          spasm.convertManyToSpasmEventEnvelope(spasmEvents)

        if (isArrayWithValues(spasmEventEnvelopes)) {
          setTimeout(() => {res.json(spasmEventEnvelopes)}, 200)
        } else {
          setTimeout(() => {res.json(null)}, 200)
        }
      } else {
        setTimeout(() => {res.json(null)}, 200)
      }
  } catch (err) {
    console.error(err);
    res.json(err);
  }
})

// Examples:
// /api/events/search?e=abc123
app.get("/api/events/:id", async(req: Request, res: Response) => {
  // console.log('req.params.id in /api/events/:id is:', req.params.id)
  // console.log('req.params in /api/events/:id is:', req.params)
  // console.log('req.query in /api/events/:id is:', req.query)
  // console.log('req in /api/events/:id is:', req)
  // console.log('req.query.target in /api/events/:id is:', req.query.target)
  try {
    let id: (string | number) | null = null
    if (req.query.e && (
        typeof(req.query.e) === "string" ||
        typeof(req.query.e) === "number"
      )
    ) {
      id = String(req.query.e)
    } else if (
      req.params.id && req.params.id !== 'search'
    ) {
      id = String(req.params.id)
    }

    // Convert Nostr's note ID to hex ID
    if (
      String(id).length === 63 &&
      String(id).startsWith('note')
    ) { id = toBeHex(String(id)) }

    if (id && isStringOrNumber(id)) {
      let event: SpasmEventV2 | null = null
      if (
        env?.enableShortUrlsForWeb3Actions &&
        String(id).length === env?.shortUrlsLengthOfWeb3Ids &&
        !isValidUrl(id)
      ) {
        event = await fetchSpasmEventV2ByShortId(id)
      } else {
        event = await fetchSpasmEventV2ById(id)
      }

      if (
        typeof(Number(req.query.commentsDepth)) === "number" &&
        Number(req.query.commentsDepth) > 0
      ) {
        const maxDepth: number = Number(req.query.commentsDepth)
        const eventWithTree =
          await buildTreeDown(event, poolDefault, maxDepth)
        if (eventWithTree && isObjectWithValues(eventWithTree)) {
          const spasmEventEnvelopeWithTree: SpasmEventEnvelopeV2 =
            spasm.convertToSpasmEventEnvelopeWithTree(eventWithTree)
          if (
            spasmEventEnvelopeWithTree &&
            isObjectWithValues(spasmEventEnvelopeWithTree)
          ) {
            const setRes = () => res.json(spasmEventEnvelopeWithTree)
            setTimeout(setRes, 300)
          } else {
            const setRes = () => res.json(null)
            setTimeout(setRes, 300)
          }
          return;
        }
      } else {
        if (event && isObjectWithValues(event)) {
          const spasmEventEnvelope: SpasmEventEnvelopeV2 =
            spasm.convertToSpasmEventEnvelope(event)
          if (
            spasmEventEnvelope &&
            isObjectWithValues(spasmEventEnvelope)
          ) {
            const setRes = () => res.json(spasmEventEnvelope)
            setTimeout(setRes, 300)
          } else {
            const setRes = () => res.json(null)
            setTimeout(setRes, 300)
          }
          return;
        }
      }
    }

    const setRes = () => res.json({ error: 'ERROR: event has not been found' })
    setTimeout(setRes, 300)
    // res.json({ error: 'post has not been found' })
    return
  } catch (err) {
    console.error(err);
    res.json(err);
  }
})

app.get("/api/app-config", async(_: Request, res: Response) => {
  const appConfig: AppConfig = await fetchAppConfig()
  if (
    !appConfig || typeof(appConfig) !== "object" ||
    Array.isArray(appConfig)
  ) {
    res.json({})
  } else {
    res.json(appConfig)
  }
})

let server;

export const startServer = (port: string | number) => {
  server = app.listen(port, async () => {
    // Load the latest app config from database upon launch
    await loadAppConfig()
    console.log(`The app is listening at http://localhost:${port}`);
  });
};

export const closeServer = async () => {
  if (server) {
    await server.close();
  }
};

export default app;
