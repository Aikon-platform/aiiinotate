import test from "node:test";

import { v4 as uuid4 } from "uuid";

import build from "#src/app.js";
import { getRandomItem } from "#utils/utils.js";
import { getManifestShortId } from "#utils/iiif2Utils.js";
import { testPostRouteCurry, testDeleteRouteCurry, injectPost, injectTestManifest, injectTestAnnotations } from "#utils/testUtils.js";

/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */
/** @typedef {import("#types").NodeTestType} NodeTestType */

test("test common routes", async (t) => {
  const
    fastify = await build("test"),
    testPostRoute = testPostRouteCurry(fastify),
    testPostRouteCreate = testPostRoute("insert"),
    testDeleteRoute = testDeleteRouteCurry(fastify),
    { manifest2Valid, annotationList } = fastify.fileServer;

  await fastify.ready();

  // close the app after running the tests
  t.after(async () => await fastify.close());

  // after each subtest has run, delete all database records
  t.afterEach(async() => await fastify.emptyCollections());

  ////////////////////////////////////////////////
  // DELETE routes

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

              await injectTestAnnotations(fastify, t, annotationList);
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

              await testDeleteRoute(t, `/annotations/2/delete?${deleteBy}=${deleteKey}`, expectedDeletedCount);
            })
        )
      );

    await deletePipeline(true);
    await deletePipeline(false);
  });

  return;
})

