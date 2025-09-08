/**
 * test a fastify app
 */

import test from "node:test";

import build from "#src/app.js";

//NOTE : mock database creation should be done through db/index.js/dbConnector function.

test("test the fastify app", async (t) => {
  const fastify = await build("test");

  t.test("first test", async (t) => {
    // console.log(await fastify.mongo.db.collection("annotations2"));
    t.todo("this is a test");
  })

  t.after(() => fastify.close());
})

test();