import test from "node:test";

import build from "#src/app.js";

import { inspectObj, isObject } from "#data/utils/utils.js"

/**
 * @param {import("node:test")} t
 * @param {import("fastify").FastifyReply} r
 * @returns {void}
 */
const assertCreateValidResponse = (t, r) => {
  t.assert.deepStrictEqual(r.statusCode, 200);
  t.assert.deepStrictEqual(
    Object.keys(JSON.parse(r.body)).sort(),
    ["insertedCount", "insertedIds"].sort()
  );
}

/**
 * @param {import("node:test")} t
 * @param {import("fastify").FastifyReply} r
 * @returns {void}
 */
const assertCreateInvalidResponse = (t, r) => {
  t.assert.deepStrictEqual(r.statusCode, 500);
  t.assert.deepStrictEqual(
    Object.keys(JSON.parse(r.body)).sort(),
    ["message", "info", "method", "url", "inputData"].sort(),
  );
}

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

    // truncate the contents of `annotationListArray` to avoid an `fst_err_ctp_body_too_large` error
    // `https://fastify.dev/docs/latest/Reference/Errors/#fst_err_ctp_body_too_large`
    const annotationListArrayLimit = annotationListArray.map(a => {
      a.resources = a.resources.length > 500 ? a.resources.slice(0,500) : a.resources
      return a;
    });
    await Promise.all(
      [ uriData, uriDataArray, annotationList, annotationListArrayLimit ].map(async (payload) => {
        const r = await fastify.inject({
          method: "POST",
          url: "/annotations/2/createMany",
          payload: payload,
        });
        if ( r.statusCode !== 200 ) {
          console.log(JSON.parse(r.body));
          console.log("ON::::::::::::::::::::::", payload)
        }
        assertCreateValidResponse(t, r);
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
        assertCreateValidResponse(t, r);
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
        assertCreateInvalidResponse(t, r);
      })
    )
  })

  return
})