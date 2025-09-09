import test from "node:test";

import build from "#src/app.js";
import { uriData, uriDataArray, annotationList, annotationListArray, uriDataArrayInvalid } from "#fileServer/annotationsCreate.js";



test("test annotation Routes", async (t) => {
  const fastify = await build("test");

  // TODO empty the db after each test
  // afterEach(() => console.log("finished running a test"));

  await t.test("test route /annotations/:iiifPresentationVersion/createMany", async (t) => {
    const r = await fastify.inject({
      method: "POST",
      url: "/annotations/2/createMany",
      payload: uriData,
    })
    t.assert.deepEqual(r.statusCode, 200)
  })

  t.after(() => fastify.close());
  return
})