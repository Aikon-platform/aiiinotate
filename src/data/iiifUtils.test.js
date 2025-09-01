import test from "node:test";

import { v4 as uuid4 } from "uuid";

import { getManifestShortId } from "#data/iiifUtils.js";


test("test 'getManifestShortId'", (t) => {
  const
    s1 = `manifest_${uuid4()}`,
    s2 = `extra_${uuid4()}`,
    // regex matching hash string
    hashRgx = /^\d+$/,
    // urls for which the function will manage to extract `s1`
    urlOkArr = [
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
    urlHashArr = [
      `http://example.com/example/collection/${s2}`,
      `http://example.com/${s1}`
    ]

  urlOkArr.map((url) =>
    t.assert.strictEqual(getManifestShortId(url), s1)
  );
  urlHashArr.map((url) =>
    t.assert.strictEqual(hashRgx.test(getManifestShortId(url)), true)
  );
})