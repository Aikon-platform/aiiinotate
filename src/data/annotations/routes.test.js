import test from "node:test";

import build from "#src/app.js";

import { v4 as uuid4 } from "uuid";

import { inspectObj, isObject, getRandomItem } from "#data/utils/utils.js"


const assertStatusCode = (t, r, expectedStatusCode) =>
  t.assert.deepStrictEqual(r.statusCode, expectedStatusCode);

const assertResponseKeys = (t, r, expectedResponseKeys) =>
  t.assert.deepStrictEqual(
    Object.keys(JSON.parse(r.body)).sort(),
    expectedResponseKeys.sort()
  );

/**
 * @param {import("fastify").FastifyInstance} fastify
 * @param {string} route
 * @param {object} payload
 * @returns {Promise<import("fastify").FastifyReply>}
 */
const injectPost = (fastify, route, payload) =>
  fastify.inject({
    method: "POST",
    url: route,
    payload: payload,
  });

/**
 * @param {import("node:test")} t
 * @param {import("fastify").FastifyReply} r
 * @returns {void}
 */
const assertPostInvalidResponse = (t, r) => {
  assertStatusCode(t, r, 500);
  assertResponseKeys(t, r, ["message", "info", "method", "url", "postBody"].sort());
}

/**
 * @param {import("node:test")} t
 * @param {import("fastify").FastifyReply} r
 * @returns {void}
 */
const assertCreateValidResponse = (t, r) => {
  assertStatusCode(t, r, 200);
  assertResponseKeys(t, r, ["insertedCount", "insertedIds"]);
}

/**
 * @param {import("node:test")} t
 * @param {import("fastify").FastifyReply} r
 * @returns {void}
 */
const assertUpdateValidResponse = (t,r) => {
  assertStatusCode(t, r, 200);
  assertResponseKeys(t, r, ["matchedCount", "modifiedCount", "upsertedCount", "upsertedId"]);
}

const assertDeleteValidResponse = (t,r) => {
  assertStatusCode(t, r, 200);
  assertResponseKeys(t, r, ["deletedCount"]);
}

/** @param {import("fastify").FastifyInstance} fastify */
const testPostRouteCurry = (fastify) =>
  /** @param {import("#data/types.js").DataOperationsType} op */
  (op) =>
    /** @param {boolean} success: if `true` test that the query succeeds. else, test that it fails */
    (success) =>
      /**
       * @param {import("node:test")} t
       * @param {string} route: example: /annotations/2/createMany
       * @param {object} payload
       */
      async (t, route, payload) => {
        const
          r = await injectPost(fastify, route, payload),
          funcInvalid = assertPostInvalidResponse;

        let funcValid;
        if ( op==="insert" ) {
          funcValid = assertCreateValidResponse;
        } else if ( op==="update" ) {
          funcValid = assertUpdateValidResponse;
        } else {
          throw new Error(`routes.test.testPostRouteCurry: unimplemented value of 'op': '${op}'.`)
        }

        success
          ? funcValid(t, r)
          : funcInvalid(t, r);
        return;
      }

/**
 * inject an annotationList into the database for test purposes
 * @param {import("fastify").FastifyInstance} fastify
 * @param {import("node:test")} t
 * @param {object} annotationList
 * @returns {Array<number, Array<string>>}
 */
const injectDummyData = async (fastify, t, annotationList) => {
  const
    r = await injectPost(fastify, "/annotations/2/createMany", annotationList),
    rBody = JSON.parse(r.body),
    expectedInsertedCount = annotationList.resources.length,
    { insertedCount, insertedIds } = rBody;
  t.assert.deepStrictEqual(insertedCount, expectedInsertedCount);
  return [insertedCount, insertedIds]
}


test("test annotation Routes", async (t) => {

  const
    fastify = await build("test"),
    testPostRoute = testPostRouteCurry(fastify),
    testPostRouteCreate = testPostRoute("insert"),
    testPostRouteUpdate = testPostRoute("update"),
    testPostRouteCreateSuccess = testPostRouteCreate(true),
    testPostRouteCreateFailure = testPostRouteCreate(false),
    testPostRouteUpdateSuccess = testPostRouteUpdate(true),
    testPostRouteUpdateFailure = testPostRouteUpdate(false),
    {
      annotationListUri,
      annotationListUriArray,
      annotationList,
      annotationListArray,
      annotationListUriInvalid,
      annotationListUriArrayInvalid
    } = fastify.fileServer;

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
        await testPostRouteCreateSuccess(t, "/annotations/2/createMany", payload)
      )
    );
    // inserts that should raise
    await Promise.all(
      [ annotationListUriInvalid, annotationListUriArrayInvalid ].map(async (payload) =>
        await testPostRouteCreateFailure(t, "/annotations/2/createMany", payload)
      )
    )
  })

  await t.test("test route /annotations/:iiifPresentationVersion/create", async (t) => {
    // inserts that shouldn't raise
    await Promise.all(
      fastify.fileServer.annotations2Valid.map(async (payload) =>
        await testPostRouteCreateSuccess(t, "/annotations/2/create", payload)
      )
    )
    // inserts that should raise
    await Promise.all(
      fastify.fileServer.annotations2Invalid.map(async (payload) =>
        await testPostRouteCreateFailure(t, "/annotations/2/create", payload)
      )
    )
  })

  await t.test("test route /annotations/:iiifPresentationVersion/update", async (t) => {
    const updatePipeline = async (annotation, success) => {
      // update the annotation
      const
        newLabel = `label-${uuid4()}`,
        newBody = {
          "@type": "cnt:ContentAsText",
          format: "text/html",
          value: "<p>What a grand pleasure it is to have updated this annotation !</p>"
        };
      annotation.label = newLabel;
      annotation.resource = newBody;
      if (!success) {
        annotation.motivation = { "invalidMotivation": "should be an array or a dict." }
      }
      success
        ? await testPostRouteUpdateSuccess(t, "/annotations/2/update", annotation)
        : await testPostRouteUpdateFailure(t, "/annotations/2/update", annotation);
    }

    // insert valid documents and retrieve an annotation to update.
    const
      [ insertedCount, insertedIds ] = await injectDummyData(fastify, t, annotationList),
      idToUpdate = getRandomItem(insertedIds),  // get a random item
      annotation = await fastify.mongo.db.collection("annotations2").findOne(
        { "@id": idToUpdate },
        { projection: { _id: 0 }}
      );

    await updatePipeline(annotation, true);
    await updatePipeline(annotation, false);
  })

  /**
   * for deletions, we can't test for failures, because if nothing is deleted, a valid response is returned: `{ deletedCount: 0 }`
   */
  await t.test("test route /annotations/:iiifPresentationVersion/delete", async (t) => {

    const deletePipeline = async (validFilter) =>
      // validFilter is true => delete data that exists in the db (test that deletions are done correctly),
      // validFilter is false => delete data that doesn't exist (test that nothing is deleted by accident)
      await Promise.all(
        // all 3 possible ways to delete data
        ["manifestShortId", "canvasUri", "uri"].map(
          async (deleteBy) =>
            await t.test(`deleteBy: ${deleteBy}`, async (t) => {

              await injectDummyData(fastify, t, annotationList);
              const
                annotations = await fastify.mongo.db.collection("annotations2").find({}).toArray(),
                deleteKey =
                  validFilter
                    ? deleteBy==="uri"
                      ? getRandomItem(annotations.map((a) => a["@id"]))
                      : deleteBy==="canvasUri"
                        ? getRandomItem(annotations.map((a) => a.on.full))
                        : getRandomItem(annotations.map((a) => a.on.manifestShortId))
                    : `invalid-filter-${uuid4()}`,
                expectedDeletedCount =
                  validFilter
                    ? deleteBy==="uri"
                      ? annotations.filter((a) => a["@id"]===deleteKey).length
                      : deleteBy==="canvasUri"
                        ? annotations.filter((a) => a.on.full===deleteKey).length
                        : annotations.filter((a) => a.on.manifestShortId===deleteKey).length
                    : 0;

              const r = await fastify.inject({
                method: "DELETE",
                url: `/annotations/2/delete?${deleteBy}=${deleteKey}`
              })

              assertDeleteValidResponse(t, r);
              t.assert.deepStrictEqual(JSON.parse(r.body).deletedCount, expectedDeletedCount);
            })
        )
      );

    await deletePipeline(true);
    await deletePipeline(false);
  })

  return
})