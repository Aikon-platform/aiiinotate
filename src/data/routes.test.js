import test from "node:test";

import { v4 as uuid4 } from "uuid";

import build from "#src/app.js";
import { getRandomItem } from "#utils/utils.js";
import { getManifestShortId } from "#utils/iiif2Utils.js";
import { testPostRouteCurry, testDeleteRouteCurry, injectPost, injectTestManifest, injectTestAnnotations, assertErrorValidResponse, assertDeleteValidResponse } from "#utils/testUtils.js";

/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */
/** @typedef {import("#types").NodeTestType} NodeTestType */

test("test common routes", async (t) => {
  const
    /** @type {FastifyInstanceType} */
    fastify = await build("test"),
    testPostRoute = testPostRouteCurry(fastify),
    testDeleteRoute = testDeleteRouteCurry(fastify),
    { manifest2Valid, annotationList } = fastify.fixtures;

  await fastify.ready();
  // close the app after running the tests
  t.after(async () => await fastify.close());
  // after each subtest has run, delete all database records
  t.afterEach(async () => fastify.emptyCollections());

  // NOTE: it is necessary to run the app because internally there are fetches to external data.
  try {
    await fastify.listen({ port: process.env.AIIINOTATE_PORT, host: process.env.AIIINOTATE_HOST });
  } catch (err) {
    console.log("FASTIFY ERROR", err);
    throw err;
  }

  ////////////////////////////////////////////////
  // GET routes

  await t.test("test route /search-api/:iiifSearchVersion/manifests/:manifestShortId/search", async (t) => {

    // TODO tests.
    // q
    // motivation
    // canvasMin
    // canvasMax

  })

  ////////////////////////////////////////////////
  // DELETE routes

  await t.test("test route /:collectionName/:iiifPresentationVersion/delete", async (t) => {

    await t.test("test preValidation hook for queryString validation", async (t) => {
      const data = [
        ["/manifests/2/delete?canvasUri=xxx", false],    // canvasUri is only allowed if `collectionName==="annotations"` => will fail.
        ["/manifests/2/delete?manifestShortId=xxx", true]
      ];
      for ( let i=0; i<data.length; i++ ) {
        const [url, expectSuccess] = data.at(i);
        const r = await fastify.inject({
          method: "DELETE",
          url: url
        })
        expectSuccess
          ? assertDeleteValidResponse(t, r)
          : assertErrorValidResponse(t, r, 400);
      }
    });

    await t.test("test route /manifests/:iiifPresentationVersion/delete", async (t) => {
      const
        manifest = manifest2Valid,
        deleteQuery = [
          [ "uri", manifest["@id"] ],
          [ "manifestShortId", getManifestShortId(manifest["@id"]) ]
        ];

      for ( let i=0; i<deleteQuery.length; i++ ) {
        const [deleteBy, deleteKey] = deleteQuery.at(i);
        await injectTestManifest(fastify, t, manifest);
        await testDeleteRoute(t, `/manifests/2/delete?${deleteBy}=${deleteKey}`, 1);
        await fastify.emptyCollections();
      }
    });

    await t.test("test route /annotations/:iiifPresentationVersion/delete", async (t) => {
      const deletePipeline = async (validFilter) =>
        // validFilter is true => delete data that exists in the db (test that deletions are done correctly),
        // validFilter is false => delete data that doesn't exist (test that nothing is deleted by accident)
        await Promise.all(
          // all 3 possible ways to delete data
          ["manifestShortId", "canvasUri", "uri"].map(
            async (deleteBy) =>
              await t.test(`validFilter: ${validFilter}, deleteBy: ${deleteBy}`, async (t) => {

                await injectTestAnnotations(fastify, t, annotationList);
                const
                  annotations = await fastify.mongo.db.collection("annotations2").find({}).toArray(),
                  deleteKey =
                    validFilter
                      ? deleteBy==="uri"
                        ? getRandomItem(annotations.map((a) => a["@id"]))
                        : deleteBy==="canvasUri"
                          ? getRandomItem(annotations.map((a) => getRandomItem(a.on).full))
                          : getRandomItem(annotations.map((a) => getRandomItem(a.on).manifestShortId))
                      : `invalid-filter-${uuid4()}`,
                  expectedDeletedCount =
                    validFilter
                      ? deleteBy==="uri"
                        ? annotations.filter((a) => a["@id"]===deleteKey).length
                        : deleteBy==="canvasUri"
                          ? annotations.filter((a) => a.on.some((x) => x.full===deleteKey)).length
                          : annotations.filter((a) => a.on.some((x) => x.manifestShortId===deleteKey)).length
                      : 0;

                await testDeleteRoute(t, `/annotations/2/delete?${deleteBy}=${deleteKey}`, expectedDeletedCount);
              })
          )
        );

      await deletePipeline(true);
      await deletePipeline(false);
    });

  })


  return;
})

