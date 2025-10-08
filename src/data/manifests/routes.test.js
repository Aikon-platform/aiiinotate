import test from "node:test";

import build from "#src/app.js";
import { getManifestShortId } from "#utils/iiif2Utils.js";
import { testPostRouteCurry, testDeleteRouteCurry, injectPost, injectTestManifest } from "#utils/testUtils.js";

/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */
/** @typedef {import("#types").NodeTestType} NodeTestType */

test("test manifests Routes", async (t) => {
  const
    fastify = await build("test"),
    testPostRoute = testPostRouteCurry(fastify),
    testPostRouteCreate = testPostRoute("insert"),
    testPostRouteCreateSuccess = testPostRouteCreate(true),
    testPostRouteCreateFailure = testPostRouteCreate(false),
    testDeleteRoute = testDeleteRouteCurry(fastify),
    {
      manifest2Valid,
      manifest2Invalid,
      manifest2ValidUri,
      manifest2InvalidUri,
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
  t.afterEach(async() => await fastify.emptyCollections());

  await t.test("test route /manifests/:iiifPresentationVersion/create", async (t) => {
    const data = [
      [ [manifest2Valid, manifest2ValidUri], testPostRouteCreateSuccess ],
      [ [manifest2Invalid, manifest2InvalidUri], testPostRouteCreateFailure ]
    ];
    for ( let i=0; i<data.length; i++ ) {
      const [ testData, func ] = data.at(i);
      for ( let j=0; j<testData.length; j++ ) {
        const payload = testData.at(j);
        await func(t, "/manifests/2/create", payload);
        // for some reason, it is necessary to call `emptyCollections` explicitly here to avoid a JSONSchema validation error.
        await fastify.emptyCollections();
      }
    }
  })

})