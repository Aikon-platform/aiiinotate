import test from "node:test";

import build from "#src/app.js";

import { assertObjectKeysInsert } from "#utils/testUtils.js";

/** @typedef {import("#types").NodeTestType} NodeTestType */
/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */
/** @typedef {import("#types").FastifyReplyType} FastifyReplyType */
/** @typedef {import("#types").DataOperationsType} DataOperationsType */

test("test Manifests2 module", async (t) => {
  const
    fastify = await build("test"),
    {
      manifest2Valid,
      manifest2ValidUri,
      manifest2Invalid,
      manifest2InvalidUri
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

  await t.test("test Manifests2.insertManifest", async (t) => {
    const r = await fastify.manifests2.insertManifest(manifest2Valid);
    assertObjectKeysInsert(t, r);

    // insertion should fail. since we are not inserting through HTTPs, we can't test error response keys
    await t.assert.rejects(fastify.manifests2.insertManifest(manifest2Invalid));
  })

  await t.test("test Manifests2.insertManifestFromUri", async (t) => {
    const r = await fastify.manifests2.insertManifestFromUri(manifest2ValidUri.uri);
    assertObjectKeysInsert(t, r);

    // insertion should fail. since we are not inserting through HTTPs, we can't test error response keys
    await t.assert.rejects(fastify.manifests2.insertManifest(manifest2InvalidUri.uri));
  })

  return
})