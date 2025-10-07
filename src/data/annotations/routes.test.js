import test from "node:test";

import build from "#src/app.js";

import { v4 as uuid4 } from "uuid";

import { inspectObj, isObject, getRandomItem } from "#utils/utils.js"
import { testPostRouteCurry, injectPost, assertDeleteValidResponse } from "#utils/testUtils.js";


/** @typedef {import("#types").NodeTestType} NodeTestType */
/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */
/** @typedef {import("#types").FastifyReplyType} FastifyReplyType */
/** @typedef {import("#types").DataOperationsType} DataOperationsType */

/**
 * inject an annotationList into the database for test purposes
 * @param {FastifyInstanceType} fastify
 * @param {import("node:test")} t
 * @param {object} annotationList
 * @returns {Promise<Array<number, Array<string>>>}
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

  await fastify.ready();

  // NOTE: it is necessary to run the app because internally there are fetches to external data.
  try {
    await fastify.listen({ port: process.env.APP_PORT });
  } catch (err) {
    console.log("FASTIFY ERROR", err);
    throw err;
  }

  // close the app after running the tests
  t.after(async () => await fastify.close());

  // after each subtest has run, delete all database records
  t.afterEach(async() => fastify.emptyCollections());

  await t.test("test route /annotations/:iiifPresentationVersion/createMany", async (t) => {
    // truncate the contents of `annotationListArray` to avoid an `fst_err_ctp_body_too_large` error
    // `https://fastify.dev/docs/latest/Reference/Errors/#fst_err_ctp_body_too_large`
    const annotationListArrayLimit = annotationListArray.map(a => {
      a.resources = a.resources.length > 500 ? a.resources.slice(0,500) : a.resources
      return a;
    });

    //NOTE: we can't do Promise.all because it causes a data race that can cause a failure of unique constraints (i.e., on manifests '@id')
    const data = [
      [[ annotationListUri, annotationListUriArray, annotationList, annotationListArrayLimit ], testPostRouteCreateSuccess],
      [[ annotationListUriInvalid, annotationListUriArrayInvalid ], testPostRouteCreateFailure]
    ];
    for ( let i=0; i<data.length; i++ ) {
      let [ testData, func ] = data.at(i);
      for ( let i=0; i<testData.length; i++ ) {
        await func(t, "/annotations/2/createMany", testData.at(i));
      }
    }
  })

  await t.test("test route /annotations/:iiifPresentationVersion/create", async (t) => {
    //NOTE: we can't do Promise.all because it causes a data race that can cause a failure of unique constraints (i.e., on manifests '@id')
    const data = [
      [fastify.fileServer.annotations2Valid, testPostRouteCreateSuccess],
      [fastify.fileServer.annotations2Invalid, testPostRouteCreateFailure],
    ]
    for ( let i=0; i<data.length; i++ ) {
      let [ testData, func ] = data.at(i);
      for ( let i=0; i<testData.length; i++ ) {
        await func(t, "/annotations/2/create", testData.at(i));
      }
    };
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
        annotation["@type"] = "invalidType";
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
            await t.test(`validFilter: ${validFilter}, deleteBy: ${deleteBy}`, async (t) => {

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