/**
 * test a fastify app
 */

import test from "node:test";

import build from "#src/app.js";


test("test the fastify app", async (t) => {
  const fastify = await build({});

  t.test("first test", async (t) => {
    console.log(await fastify.mongo.db.collection("annotations2").toArray());
    // console.log(await fastify.mongo.db.collection("annotations2").find().toArray());
  })

  t.test("second test", (t) => {
    t.todo("this is where i can put the first test.")
  })

  // t.after(() => fastify.close())
})

test();