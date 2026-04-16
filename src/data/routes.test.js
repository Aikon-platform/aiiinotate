import test from "node:test";

import { v4 as uuid4 } from "uuid";

import build from "#src/app.js";
import { getRandomItem, visibleLog } from "#utils/utils.js";
import { getManifestShortId } from "#utils/iiif2Utils.js";
import { testPostRouteCurry, testDeleteRouteCurry, injectTestManifest, injectTestAnnotations, assertErrorValidResponse, assertDeleteValidResponse, testGetPaginated } from "#utils/testUtils.js";
import { PORT, HOST } from "#constants";

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
    await fastify.listen({ port: PORT, host: HOST });
  } catch (err) {
    console.log("FASTIFY ERROR", err);
    throw err;
  }

  ////////////////////////////////////////////////
  // GET routes

  await t.test("test route /search-api/:iiifPresentationVersion/manifests/:manifestShortId/search", async (t) => {
    await injectTestAnnotations(fastify, t, annotationList);

    const manifestShortIdArray = [ ...new Set(
      annotationList.resources.map(annotation => getManifestShortId(annotation.on))
    )];
    let route, expectedCount, pageSize;
    for ( const manifestShortId of manifestShortIdArray ) {
      expectedCount = annotationList.resources.filter(annotation => annotation.on.includes(manifestShortId)).length;
      pageSize = Math.max(Math.floor(expectedCount / 10), 1);
      route = `/search-api/1/manifests/${manifestShortId}/search?pageSize=${pageSize}`;
      await testGetPaginated(fastify, t, 2, route, expectedCount);
    }
  })

  ////////////////////////////////////////////////
  // DELETE routes

  await t.test("test route /:collectionName/:iiifPresentationVersion/delete", async (t) => {

    await t.test("test preValidation hook for queryString validation", async (t) => {
      const data = [
        ["/manifests/2/delete?canvasUri=xxx", false],    // canvasUri is only allowed if `collectionName==="annotations"` => will fail.
        ["/annotations/2/delete?tag=xxx", false],  // if using tag, manifestShortId must also be defined
        ["/manifests/2/delete?tag=xxx&manifestShortId=xxx", false],  // tag is not allowed with `manifests`
        ["/annotations/2/delete?tag=xxx&manifestShortId=xxx", true],
        ["/manifests/2/delete?manifestShortId=xxx", true],
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
      await fastify.emptyCollections();

      await t.test("test route /annotations/:iiifPresentationVersion/delete with param 'tag'", async (t) => {
        const
          tags = ["tag1", "tag2", "tag3"],
          // outputs one of the tags at random
          selectTag = () => tags[Math.floor(Math.random() * 3)],
          testTag = selectTag(),
          // avoid changes to the global annotationList by cloning it.
          annotationListCopy = structuredClone(annotationList),
          // all annotations in the anno list are on the same manifest
          manifestShortId = getManifestShortId(annotationList.resources[0].on);

        annotationListCopy.resources = annotationList.resources.map((anno) => {
          anno.resource = {
            "@type": "oa:Tag",
            "chars": selectTag()
          }
          return anno;
        })
        const expectedDeletedCount = annotationListCopy.resources.filter((anno) =>
          anno.resource["@type"]==="oa:Tag"
          && anno.resource["chars"]===testTag
        ).length;
        await injectTestAnnotations(fastify, t, annotationList);
        await testDeleteRoute(t, `/annotations/2/delete?manifestShortId=${manifestShortId}&tag=${testTag}`, expectedDeletedCount);
      })
    });

  })


  return;
})

