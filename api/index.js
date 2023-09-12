require('dotenv').config()
//require('dotenv').config({ path: "../.env" })
const express = require("express");
const cors = require("cors");
const fetchAllPosts = require("../helper/sql/fetchAllPosts");
const fetchPostById = require("../helper/sql/fetchPostById");
const fetchPostsByAuthor = require("../helper/sql/fetchPostsByAuthor");
const fetchAllActionsByCounting = require("../helper/sql/fetchAllActionsByCounting");
const fetchTargetActionsByCounting = require("../helper/sql/fetchTargetActionsByCounting");
const fetchTargetComments = require("../helper/sql/fetchTargetComments");
const fetchLatestComments = require("../helper/sql/fetchLatestComments");
const submitAction = require("../helper/sql/submitAction");

const app = express();
const port = process.env.BACKEND_PORT;

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
app.get("/api/posts", async(req, res) => {
  const q = req.query
  const filters = {
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

app.get("/api/posts/:id", async(req, res) => {
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
    if (req.params.id !== 'search') {
      const post = await fetchPostById(req.params.id)
      res.json(post);
      return
    }
    res.json({ error: 'post has not been found' })
  } catch (err) {
    console.error(err);
    res.json(err);
  }
})

// Deprecated.
// Don't delete, because it can be used to re-calculate actions_count table.
// Although, it doesn't work now. Check the query.
// Fetch combined table of different actions (bullish, bearish, important, comments) for all targets
app.get("/api/posts/actions", async(req, res) => {
  console.log("/api/posts/actions called") 
  try {
    const allReactions = await fetchAllActionsByCounting()
    res.json(allReactions);
  } catch (err) {
    console.error(err);
  }
})

// Fetch how many reactions a target has
app.get("/api/posts/actions/:id", async(req, res) => {
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
app.get("/api/comments/", async(req, res) => {
  console.log("/api/comments/ called") 
  try {
    const latestComments = await fetchLatestComments()
    res.json(latestComments);
  } catch (err) {
    console.error(err);
  }
})

// Fetch all comments a target has
app.get("/api/targets/comments/:id", async(req, res) => {
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
app.get("/api/authors/:id", async(req, res) => {
  try {
    const posts = await fetchPostsByAuthor(req.params.id)
    setTimeout(() => { res.json(posts) }, 300)
    // res.json(posts);
  } catch (err) {
    console.error(err);
    res.json(err);
  }
})

app.post("/api/submit/", async (req, res) => {
  // console.log("===========================================")
  // console.log('POST on /api/submit/ was called');

  const submitResult = await submitAction(req.body); 
  // console.log("Sending submitResult to front:", submitResult)

  return res.json(submitResult);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});