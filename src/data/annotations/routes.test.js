import test from "node:test";

import build from "#src/app.js";

import { v4 as uuid4 } from "uuid";

import { inspectObj, isObject, getRandomItem, visibleLog } from "#utils/utils.js"
import { testPostRouteCurry, testDeleteRouteCurry, injectTestAnnotations, injectPost, injectGet } from "#utils/testUtils.js";

/** @typedef {import("#types").NodeTestType} NodeTestType */
/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */
/** @typedef {import("#types").FastifyReplyType} FastifyReplyType */
/** @typedef {import("#types").DataOperationsType} DataOperationsType */

test("test annotation Routes", async (t) => {

  const
    fastify = await build("test"),
    testPostRoute = testPostRouteCurry(fastify),
    testPostRouteCreate = testPostRoute("insert"),
    testPostRouteUpdate = testPostRoute("update"),
    testDeleteRoute = testDeleteRouteCurry(fastify),
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
    } = fastify.fixtures;

  await fastify.ready();
  // close the app after running the tests
  t.after(async () => await fastify.close());
  // after each subtest has run, delete all database records
  t.afterEach(async() => fastify.emptyCollections());

  // NOTE: it is necessary to run the app because internally there are fetches to external data.
  try {
    await fastify.listen({ port: process.env.AIIINOTATE_PORT, host: process.env.AIIINOTATE_HOST });
  } catch (err) {
    console.log("FASTIFY ERROR", err);
    throw err;
  }

  await t.test("test route /annotations/:iiifPresentationVersion/createMany", async (t) => {
    // truncate the contents of `annotationListArray` to avoid an `fst_err_ctp_body_too_large` error
    // `https://fastify.dev/docs/latest/Reference/Errors/#fst_err_ctp_body_too_large`
    const annotationListArrayLimit = annotationListArray.map(a => {
      a.resources = a.resources.length > 500 ? a.resources.slice(0,500) : a.resources
      return a;
    });

    // test basic inserts
    //NOTE: we can't do Promise.all because it causes a data race that can cause a failure of unique constraints (i.e., on manifests '@id')
    let data = [
      [[ annotationListUri, annotationListUriArray, annotationList, annotationListArrayLimit ], testPostRouteCreateSuccess],
      [[ annotationListUriInvalid, annotationListUriArrayInvalid ], testPostRouteCreateFailure]
    ];
    for ( let i=0; i<data.length; i++ ) {
      let [ testData, func ] = data.at(i);
      for ( let i=0; i<testData.length; i++ ) {
        await func(t, "/annotations/2/createMany", testData.at(i));
      }
    }

    // test that `throwOnCanvasIndexError` throws errors when it's supposed to
    const annotationListWithTargetErrors = structuredClone(annotationList);
    // replace the annotation.on with an uuid => should trigger an error.https://www.cinefil.com/film/mulholland-drive
    annotationListWithTargetErrors.resources =
      annotationListWithTargetErrors
        .resources
        .map((annotation) => {
          // if annotation.on is a string, the annotation should have a fragment
          annotation.on = `https://test/${uuid4()}#xywh=100,100,300,300`;
          return annotation
        });

    data = [[testPostRouteCreateFailure, true], [testPostRouteCreateSuccess, false]];
    for (let i=0; i<data.length; i++) {
      const [func, v] = data.at(i);
      func(t, `/annotations/2/createMany?throwOnCanvasIndexError=${v}`, annotationListWithTargetErrors)
    }
  })

  await t.test("test route /annotations/:iiifPresentationVersion/create", async (t) => {
    //NOTE: we can't do Promise.all because it causes a data race that can cause a failure of unique constraints (i.e., on manifests '@id')
    let data = [
      [fastify.fixtures.annotations2Valid, testPostRouteCreateSuccess],
      [fastify.fixtures.annotations2Invalid, testPostRouteCreateFailure],
    ]
    for ( const [ testData, func ] of data ) {
      for ( let i=0; i<testData.length; i++ ) {
        await func(t, "/annotations/2/create", testData.at(i));
      }
    };

    // test throwOnCanvasIndexError
    const annotationWithTargetError = structuredClone(fastify.fixtures.annotations2Valid.at(0));
    annotationWithTargetError.on = `https://test/${uuid4()}#xywh=100,100,300,300`;
    data = [[testPostRouteCreateFailure, true], [testPostRouteCreateSuccess, false]];
    for (let i=0; i<data.length; i++) {
      const [func, v] = data.at(i);
      await func(t, `/annotations/2/create?throwOnCanvasIndexError=${v}`, annotationWithTargetError)
    }

    // test SVG to XYWH conversion
    // 1. insert and assert there was no mistake
    // 2. retrieve the inserted annotation and check its xywh coordinates.
    for ( const ann of  fastify.fixtures.annotations2SvgValid ) {
      let r, rBody;
      r = await injectPost(fastify, "/annotations/2/create", ann);
      rBody = await JSON.parse(r.body);
      t.assert.deepStrictEqual(r.statusCode, 200);
      t.assert.deepStrictEqual(rBody.insertedIds.length, 1);
      const annId = JSON.parse(r.body).insertedIds[0];
      r = await injectGet(fastify, annId);
      rBody = await JSON.parse(r.body);  // the annotation we just inserted
      rBody.on.map(target => {
        t.assert.deepStrictEqual(Array.isArray(target.xywh), true);
        t.assert.deepStrictEqual(target.xywh.every((i) => !isNaN(i)), true);
      })
    }
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
      [ insertedCount, insertedIds ] = await injectTestAnnotations(fastify, t, annotationList),
      idToUpdate = getRandomItem(insertedIds),  // get a random item
      annotation = await fastify.mongo.db.collection("annotations2").findOne(
        { "@id": idToUpdate },
        { projection: { _id: 0 }}
      );

    await updatePipeline(annotation, true);
    await updatePipeline(annotation, false);
    return;
  });

  await t.test("test route /annotations/:iiifPresentationVersion/search", async (t) => {
    await injectTestAnnotations(fastify, t, annotationList);
    await Promise.all(
      // `asAnnotationList` is a boolean defining if we should return an array or an annotationList.
      [false, true].map(async (asAnnotationList) => {

        const
          annotation = await getRandomItem(
            await fastify.mongo.db.collection("annotations2").find().toArray()
          ),
          canvasId = getRandomItem(annotation.on).full,
          r = await fastify.inject({
            method: "GET",
            url: `/annotations/2/search?canvasUri=${canvasId}&asAnnotationList=${asAnnotationList}`
          }),
          body = await r.json();

        t.assert.deepStrictEqual(r.statusCode, 200);
        if ( asAnnotationList ) {
          // we have aldready defined responses for both cases of `asAnnotationList`, so we just need to check that the response is of a proper type
          t.assert.deepStrictEqual(Array.isArray(body), false);
        } else {
          t.assert.deepStrictEqual(Array.isArray(body), true)
          t.assert.deepStrictEqual(body.length > 0, true);
        }

      })
    )

  })

  await t.test("test route /data/:iiifPresentationVersion/:manifestShortId/annotation/:annotationShortId", async (t) => {
    await injectTestAnnotations(fastify, t, annotationList);
    const annotationId = await getRandomItem(
      await fastify.mongo.db.collection("annotations2").find().toArray()
    )["@id"];
    await Promise.all(
      // if shouldExist, search an annotation that exists, otherwise, search an annotation that does not exist. test accordingly.
      [true, false].map(async (shouldExist) => {
        const
          annotationIdQuery =
            shouldExist
              ? annotationId.replace(process.env.AIIINOTATE_BASE_URL, "")
              : annotationId.replace(process.env.AIIINOTATE_BASE_URL, "") + "string_that_does_not_exist_in_the_db",
          r = await fastify.inject({
            method: "GET",
            url: annotationIdQuery
          }),
          body = await r.json();

        t.assert.deepStrictEqual(r.statusCode, 200);
        if ( shouldExist ) {
          t.assert.deepStrictEqual(body["@id"]===annotationId, true);
        } else {
          t.assert.deepStrictEqual(Object.keys(body).length === 0, true);
        }
      })
    )
  })

  await t.test("test route /annotations/:iiifPresentationVersion/count", async (t) => {
    const expectedOnCount = (annotationArray, onKey, expectedOnVal) =>
      annotationArray.filter((anno) => anno.on.some(x => x[onKey] === expectedOnVal)).length

    await injectTestAnnotations(fastify, t, annotationList);
    const
      annotationArray = await fastify.mongo.db.collection("annotations2").find().toArray(),
      annotationId = getRandomItem(annotationArray)["@id"],
      canvasUri = getRandomItem(annotationArray).on[0].full,
      manifestShortId = getRandomItem(annotationArray).on[0].manifestShortId,
      expectedAnnotationIdCount = 1,
      expectedCanvasUriCount = expectedOnCount(annotationArray, "full", canvasUri),
      expectedManifestShortIdCount = expectedOnCount(annotationArray, "manifestShortId", manifestShortId),
      mapper = [
        ["uri", annotationId, expectedAnnotationIdCount],
        ["canvasUri", canvasUri, expectedCanvasUriCount],
        ["manifestShortId", manifestShortId, expectedManifestShortIdCount]
      ];

    await Promise.all(
      mapper.map(async ([filterKey, filterVal, expectedCount]) => {
        const
          r = await fastify.inject({
            method: "GET",
            url: `/annotations/2/count?${filterKey}=${filterVal}`
          }),
          body = await r.json();
        t.assert.deepStrictEqual(r.statusCode, 200);
        t.assert.deepStrictEqual(body.count, expectedCount);
      })
    )

  })

  return
})