import test from "node:test";

import build from "#src/app.js";

import { inspectObj, arrayEqualsShallow } from "#data/utils/utils.js"

test("test annotation Routes", async (t) => {

  const
    fastify = await build("test"),
    { uriData, uriDataArray, annotationList, annotationListArray, uriDataArrayInvalid } = fastify.fileServer;

  // `uriData` and `uriDataArray` reference data using URLs to the fastify app, so the app needs to be running.
  try {
    await fastify.listen({ port: process.env.APP_PORT });
  } catch (err) {
    console.log("FASTIFY ERROR");
    throw err;
  }

  // close the app after running the tests
  t.after(() => fastify.close());

  // after each subtest has run, delete all database records
  t.afterEach(fastify.emptyCollections);

  await t.test("test route /annotations/:iiifPresentationVersion/createMany", async (t) => {
    // inserts that should work
    await Promise.all(
      [ uriData, uriDataArray /*, annotationList, annotationListArray */ ].map(async (payload) => {
        const r = await fastify.inject({
          method: "POST",
          url: "/annotations/2/createMany",
          payload: payload,
        });
        t.assert.deepEqual(r.statusCode, 200);
      })
    );
    return

    // inserts that should raise
    // await Promise.all(
    //   [ uriDataInvalid ].forEach()
    // )
  })

  await t.test("test route /annotations/:iiifPresentationVersion/create", async (t) => {
    // inserts that shouldn't raise
    await Promise.all(
      fastify.fileServer.annotations2Valid.map(async (annotation) => {
        const r = await fastify.inject({
          method: "POST",
          url: "annotations/2/create",
          payload: annotation
        });
        console.log("TEST RESPONSE BODY:", inspectObj(JSON.parse(r.body)));
        t.assert.deepEqual(r.statusCode, 200);
      })
    )

    // inserts that should raise
    await Promise.all(
      fastify.fileServer.annotations2Invalid.map(async (annotation) => {
        const r = await fastify.inject({
          method: "POST",
          url: "annotations/2/create",
          payload: annotation
        });
        t.assert.deepEqual(r.statusCode, 500);
        t.assert.deepEqual(
          arrayEqualsShallow(
            Object.keys(JSON.parse(r.body)),
            ["errorMessage", "errorInfo", "query", "method", "inputData"],
            true
          ),
          true
        )
      })
    )
  })

  return
})