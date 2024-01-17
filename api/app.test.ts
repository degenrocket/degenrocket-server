import dotenv from "dotenv";
import request from 'supertest';
import app, { startServer, closeServer } from './app';

const { Client } = require('pg');
const port = process.env.BACKEND_TEST_PORT || 5005

dotenv.config();

let client;

beforeEach(async () => {
  startServer(port)
  client = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
  });
  await client.connect();
});

afterEach(async () => {
  await client.end();
  // await server.close();
  await closeServer()
});

describe("GET /api/posts", () => {

  beforeAll(() => {
    // startServer(port)
  });

  afterAll(async () => {
    // await closeServer()
  });

 it("should return all posts", async () => {
   const res = await request(app).get("/api/posts");
   // const res = await request(app).get("/api/posts?limitWeb2=1&limitWeb3=0");
   expect(res.statusCode).toBe(200);
   expect(res.body.length).toBeGreaterThan(0);
 });
});

afterAll(async () => {
  await client.end();
  await closeServer();
});
