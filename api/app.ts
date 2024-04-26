//require('dotenv').config({ path: "../.env" })
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { fetchAllPosts } from "../helper/sql/fetchAllPosts";
import { fetchPostById } from "../helper/sql/fetchPostById";
import { fetchPostsByAuthor } from "../helper/sql/fetchPostsByAuthor";
import { fetchAllActionsByCounting } from "../helper/sql/fetchAllActionsByCounting";
import { fetchTargetActionsByCounting } from "../helper/sql/fetchTargetActionsByCounting";
import { fetchTargetComments } from "../helper/sql/fetchTargetComments";
import { fetchLatestComments } from "../helper/sql/fetchLatestComments";
import { fetchFullIdsFromShortId } from "../helper/sql/fetchFullIdsFromShortId";
import { submitAction } from "../helper/sql/submitAction";
// import { fetchPostsFromRssSources } from "../helper/rss/fetchPostsFromRssSources";
import { QueryFeedFilters, FeedFilters } from "../types/interfaces";

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

// Deprecated.
// Don't delete, because it can be used to re-calculate actions_count table.
// Although, it doesn't work now. Check the query.
// Fetch combined table of different actions (bullish, bearish, important, comments) for all targets
app.get("/api/posts/actions", async(_: Request, res: Response) => {
  console.log("/api/posts/actions called") 
  try {
    const allReactions = await fetchAllActionsByCounting()
    res.json(allReactions);
  } catch (err) {
    console.error(err);
  }
})

// Fetch how many reactions a target has
app.get("/api/posts/actions/:id", async(req: Request, res: Response) => {
  const target = req.query.target;
  console.log(`/api/posts/reactions/:id called with target: ${target}`) 
  console.log("query:", req.query);

  try {
    const allActionsForOnePost = await fetchTargetActionsByCounting(target)
    res.json(allActionsForOnePost);
  } catch (err) {
    console.error(err);
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
    const posts = await fetchPostsByAuthor(req.params.id)
    setTimeout(() => { res.json(posts) }, 300)
    // res.json(posts);
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
  // console.log("===========================================")
  // console.log('POST on /api/submit/ was called');

  const submitResult = await submitAction(req.body); 
  // console.log("Sending submitResult to front:", submitResult)

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

let server;

export const startServer = (port: string | number) => {
  server = app.listen(port, () => {
    console.log(`The app is listening at http://localhost:${port}`);
  });
};

export const closeServer = async () => {
  if (server) {
    await server.close();
  }
};

export default app;
