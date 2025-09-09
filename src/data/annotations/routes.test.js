import test from "node:test";

import build from "#src/app.js";

test("test annotation Routes", async (t) => {

  const
    fastify = await build("test"),
    { uriData, uriDataArray, annotationList, annotationListArray, uriDataArrayInvalid } = fastify.fileServer;

  // `uriData` and `uriDataAray` reference data using URLs to the fastify app, so the app needs to be running.
  await fastify.listen({ port: process.env.APP_PORT });

  // close the app after running the tests
  t.after(() => fastify.close());

  await t.test("test route /annotations/:iiifPresentationVersion/createMany", async (t) => {
    // inserts that should work
    await Promise.all(
      [ uriData, uriDataArray, /* annotationList, annotationListArray */ ].map(async (payload) => {
        const r = await fastify.inject({
          method: "POST",
          url: "/annotations/2/createMany",
          payload: payload,
        });
        t.assert.deepEqual(r.statusCode, 200);
      })
    );

    // inserts that should raise
    // await Promise.all(
    //   [ uriDataInvalid ].forEach()
    // )
  })

  t.after(() => fastify.close());
  return
})