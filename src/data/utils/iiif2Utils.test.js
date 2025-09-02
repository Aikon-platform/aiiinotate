import test from "node:test";

import annotationsValid from "#testData/annotations2Valid.js";
import annotationsInvalid from "#testData/annotations2Invalid.js";
import { v4 as uuid4 } from "uuid";
import { getManifestShortId, getCanvasShortId, getAnnotationTarget, makeTarget, makeAnnotationId } from "#data/utils/iiif2Utils.js";


const
  // hash-validating regex
  hashRgx = /^\d+$/;


test("test 'getManifestShortId'", (t) => {
  const
    s1 = `manifest_${uuid4()}`,
    s2 = `extra_${uuid4()}`,
    // urls for which the function will manage to extract `s1`
    urlOk = [
      `http://www.example.com/examplePrefix/${s1}/manifest`,
      `http://www.example.com/examplePrefix/${s1}/manifest.json`,
      `http://www.example.com/examplePrefix/${s1}/sequence/${s2}`,
      `http://www.example.com/examplePrefix/${s1}/canvas/${s2}`,
      `http://www.example.com/examplePrefix/${s1}/annotation/${s2}`,
      `http://www.example.com/examplePrefix/${s1}/list/${s2}`,
      `http://www.example.com/examplePrefix/${s1}/range/${s2}`,
      `http://www.example.com/examplePrefix/${s1}/layer/${s2}`,
      `http://www.example.com/examplePrefix/${s1}/res/${s2}.png`,
    ],
    // urls for which `s1` won't be returned, and instead a hash will be returned
    urlHash = [
      `http://example.com/example/collection/${s2}`,
      `http://example.com/${s1}`
    ];

  urlOk.map((url) =>
    t.assert.strictEqual(getManifestShortId(url), s1)
  );
  urlHash.map((url) =>
    t.assert.strictEqual(hashRgx.test(getManifestShortId(url)), true)
  );
})

test("test 'getCanvasShortId'", (t) => {
  const
    s1 = `manifest_${uuid4()}`,
    s2 = `canvas_${uuid4()}`,
    urlOk = [
      `http://www.example.com/examplePrefix/${s1}/canvas/${s2}`,
      `http://www.example.com/examplePrefix/${s1}/canvas/${s2}.json`,

    ],
    urlHash = [
      `http://example.com/example/${s2}`,
      `http://example.com/${s2}`
    ]
  urlOk.map((url) =>
    t.assert.strictEqual(getCanvasShortId(url), s2)
  );
  urlHash.map((url) =>
    t.assert.strictEqual(hashRgx.test(getCanvasShortId(url)), true)
  );

})

test("test 'getAnnotationTarget' and 'makeTarget'", async (t) => {
  await Promise.all(
    [getAnnotationTarget, makeTarget].map((func) =>

      t.test(`test '${func.name}'`, (t) => {
        annotationsValid.map((annotation) =>
          // to test for an error, it's necessary to create a new function:
          // https://stackoverflow.com/a/6645586
          t.assert.doesNotThrow(() => func(annotation))
        );
        annotationsInvalid.map((annotation) =>
          t.assert.throws(() => func(annotation), Error)
        )
      })

    )
  )
})

test("test 'makeAnnotationId'", (t) => {
  // https://stackoverflow.com/a/6969486
  const escapeRegExp = (string) =>
    string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string

  console.log(">>>", process.env.APP_BASE_URL);
  const rgx = new RegExp(`^${escapeRegExp(process.env.APP_BASE_URL)}/data/2/[^(\\s|/)]+/annotation/[^\\.]+$`);
  annotationsValid.map((annotation) =>
    t.assert.strictEqual(rgx.test(makeAnnotationId(annotation)), true)
  );
})

