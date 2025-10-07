import test from "node:test";

import build from "#src/app.js";
import { testPostRouteCurry, injectPost } from "#utils/testUtils.js";

test("test manifests Routes", async (t) => {
  const
    fastify = await build("test"),
    testPostRoute = testPostRouteCurry(fastify),
    testPostRouteCreate = testPostRoute("insert"),
    testPostRouteCreateSuccess = testPostRouteCreate(true),
    testPostRouteCreateFailure = testPostRouteCreate(false),
    {
      manifest2Valid,
      manifest2Invalid,
      manifest2ValidUri,
      manifest2InvalidUri,
    } = fastify.fileServer;

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
    ]
    for ( let i=0; i<data.length; i++ ) {
      const [ testData, func ] = data.at(i);
      for ( let j=0; j<testData.length; j++ ) {
        const payload = testData.at(j);
        await func(t, "/manifests/2/create", payload);
        // for some reason, it is necessary to call `emptyCollections` explicitly here to avoid a validation error.
        await fastify.emptyCollections();
      }
    }
  })

})