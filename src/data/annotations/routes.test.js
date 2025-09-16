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

/** @param {import("fastify").FastifyInstance} fastify */
const testPostRouteCurry = (fastify) =>
  /** @param {boolean} success: if `true` test that the query succeeds. else, test that it fails */
  (success) =>
    /**
     * @param {import("node:test")} t
     * @param {string} route: example: /annotations/2/createMany
     * @param {object} payload
     */
    async (t, route, payload) => {
      const r = await fastify.inject({
        method: "POST",
        url: route,
        payload: payload,
      });
      success
        ? assertCreateValidResponse(t, r)
        : assertCreateInvalidResponse(t, r);
      return;
    }

test("test annotation Routes", async (t) => {

  const
    fastify = await build("test"),
    { annotationListUri, annotationListUriArray, annotationList, annotationListArray, annotationListUriInvalid, annotationListUriArrayInvalid } = fastify.fileServer,
    testPostRoute = testPostRouteCurry(fastify),
    testPostRouteSuccess = testPostRoute(true),
    testPostRouteFailure = testPostRoute(false);

  // `annotationListUri` and `annotationListUriArray` reference data using URLs to the fastify app, so the app needs to be running.
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
    // truncate the contents of `annotationListArray` to avoid an `fst_err_ctp_body_too_large` error
    // `https://fastify.dev/docs/latest/Reference/Errors/#fst_err_ctp_body_too_large`
    const annotationListArrayLimit = annotationListArray.map(a => {
      a.resources = a.resources.length > 500 ? a.resources.slice(0,500) : a.resources
      return a;
    });

    // inserts that should work
    await Promise.all(
      [ annotationListUri, annotationListUriArray, annotationList, annotationListArrayLimit ].map(async (payload) =>
        await testPostRouteSuccess(t, "/annotations/2/createMany", payload)
      )
    );

    // inserts that should raise
    await Promise.all(
      [ annotationListUriInvalid, annotationListUriArrayInvalid ].map(async (payload) =>
        await testPostRouteFailure(t, "annotations/2/createMany", payload)
      )
    )
  })

  await t.test("test route /annotations/:iiifPresentationVersion/create", async (t) => {
    // inserts that shouldn't raise
    await Promise.all(
      fastify.fileServer.annotations2Valid.map(async (payload) =>
        await testPostRouteSuccess(t, "annotations/2/create", payload)
      )
    )

    // inserts that should raise
    await Promise.all(
      fastify.fileServer.annotations2Invalid.map(async (payload) =>
        await testPostRouteFailure(t, "annotations/2/create", payload)
      )
    )
  })

  return
})