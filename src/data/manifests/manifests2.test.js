import test from "node:test";

import build from "#src/app.js";

import { assertObjectKeys, testPostRouteCurry, injectPost } from "#data/utils/testUtils.js";

/** @typedef {import("#types").NodeTestType} NodeTestType */
/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */
/** @typedef {import("#types").FastifyReplyType} FastifyReplyType */
/** @typedef {import("#types").DataOperationsType} DataOperationsType */

test("test Manifests2 module", async (t) => {
  const
    fastify = await build("test"),
    {
      manifest2Valid,
      manifest2ValidUri
    } = fastify.fileServer;

  await fastify.ready();

  try {
    await fastify.listen({ port: process.env.APP_PORT });
  } catch (err) {
    console.log("FASTIFY ERROR", err);
    throw err;
  }

  // close the app after running the tests
  t.after(async () => await fastify.close());

  // after each subtest has run, delete all database records
  t.afterEach(async () => await fastify.emptyCollections());


  await t.test("test Manifests2.insertManifest", async (t) => {
    const r = await fastify.manifests2.insertManifest(manifest2Valid);
    console.log(r);
    assertObjectKeys(t, r, ["insertedCount", "insertedIds"]);
    return;
  })

  await t.test("test Manifests2.insertManifestFromUri", async (t) => {
    const r = await fastify.manifests2.insertManifest(manifest2ValidUri.uri);
    console.log(r);
    assertObjectKeys(t, r, ["insertedCount", "insertedIds"]);
    return;
  })

  return
})