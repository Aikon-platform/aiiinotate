import test from "node:test";

import { v4 as uuid4 } from "uuid";

import { getManifestShortId } from "#data/iiifUtils.js";


test("test 'getManifestShortId'", (t) => {
  const
    testManifestName = `manifest_${uuid4()}`,
    s = `extra_${uuid4()}`,
    // regex matching hash string
    hashRgx = /^\d+$/,
    // urls for which the function will manage to extract `testManifestName`
    urlOkArr = [
      `http://www.example.com/examplePrefix/${testManifestName}/manifest`,
      `http://www.example.com/examplePrefix/${testManifestName}/manifest.json`,
      `http://www.example.com/examplePrefix/${testManifestName}/sequence/${s}`,
      `http://www.example.com/examplePrefix/${testManifestName}/canvas/${s}`,
      `http://www.example.com/examplePrefix/${testManifestName}/annotation/${s}`,
      `http://www.example.com/examplePrefix/${testManifestName}/list/${s}`,
      `http://www.example.com/examplePrefix/${testManifestName}/range/${s}`,
      `http://www.example.com/examplePrefix/${testManifestName}/layer/${s}`,
      `http://www.example.com/examplePrefix/${testManifestName}/res/${s}.png`,
    ],
    // urls for which `testManifestName` won't be returned, and instead a hash will be returned
    urlHashArr = [
      `http://example.com/example/collection/${s}`,
      `http://example.com/${testManifestName}`
    ]

  urlOkArr.map((url) =>
    t.assert.strictEqual(getManifestShortId(url), testManifestName)
  );
  urlHashArr.map((url) =>
    t.assert.strictEqual(hashRgx.test(getManifestShortId(url)), true)
  )

})