import test from "node:test";

import { v4 as uuid4 } from "uuid";

import build from "#src/app.js";
import { getManifestShortId, getCanvasShortId, getAnnotationTarget, makeTarget, makeAnnotationId, toAnnotationList } from "#utils/iiif2Utils.js";
import { objectHasKey, visibleLog } from "#utils/utils.js";
import { PUBLIC_URL } from "#constants";

// hash-validating regex
const hashRgx = /^\d+$/;

test("test 'iiif2Utils' functions", async (t) => {
  const
    fastify = await build("test"),
    { annotations2Valid, annotations2Invalid } = fastify.fixtures;

  await fastify.ready();

  t.after(() => fastify.close());

  t.test("test 'getManifestShortId'", (t) => {
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
      t.assert.strictEqual(getManifestShortId(url), s1));
    urlHash.map((url) =>
      t.assert.strictEqual(hashRgx.test(getManifestShortId(url)), true));
  })

  t.test("test 'getCanvasShortId'", (t) => {
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
      t.assert.strictEqual(getCanvasShortId(url), s2));
    urlHash.map((url) =>
      t.assert.strictEqual(hashRgx.test(getCanvasShortId(url)), true));

  })

  await t.test("test 'makeTarget'", async (t) => {
    await Promise.all(
      annotations2Valid.map(async (annotation) =>
        // `rejects` / `doesNotReject` works for aync functions,
        // contrary to `throws` / `doesNotThrow`
        // https://stackoverflow.com/a/35782749
        t.assert.doesNotReject(async () => await makeTarget(annotation))
      )
    );
    await Promise.all(
      annotations2Invalid.map(async (annotation) =>
        t.assert.rejects(async () => await makeTarget(annotation))
      )
    );
  })

  await t.test("test 'getAnnotationTarget'", (t) => {
    annotations2Valid.map((annotation) =>
      t.assert.doesNotThrow(() => getAnnotationTarget(annotation))
    );
    annotations2Invalid.map((annotation) =>
      t.assert.throws(() => getAnnotationTarget(annotation), Error)
    )
  })

  await t.test("test 'makeAnnotationId'", (t) => {
    // https://stackoverflow.com/a/6969486
    const escapeRegExp = (string) =>
      string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string

    const rgx = new RegExp(`^${escapeRegExp(PUBLIC_URL)}/data/2/[^(\\s|/)]+/annotation/[^\\.]+$`);
    annotations2Valid.map((annotation) =>
      t.assert.strictEqual(rgx.test(makeAnnotationId(annotation)), true));
    annotations2Invalid.map((annotation) =>
      t.assert.throws(() => makeAnnotationId(annotation)));
  })

  await t.test("test 'toAnnotationList'", (t) => {
    /**
     * @param {"prev"|"next"} val
     * @returns {(_annotationList: object) => string?} */
    const getPage = (val) => {
      if ( !["prev", "next"].includes(val) ) {
        throw new Error(`'getPage': invalid value for 'val': '${val}'`);
      }
      return (_annotationList) => {
        if ( objectHasKey(annotationList, val) ) {
          return new URL(annotationList[val]).searchParams.get("page")
        }
        return undefined;
      }
    }
    const getPagePrev = getPage("prev");
    const getPageNext = getPage("next");

    const testUrl = new URL(`http://www.example.com/prefix/manifest-${uuid4()}/list/anno-list-${uuid4()}`);
    const data = [
      { page: 3, hasNext: true, prevNum: "2", nextNum: "4" },
      { page: 1, hasNext: true, prevNum: undefined, nextNum: "2" },
      { page: 1, hasNext: false, prevNum: undefined, nextNum: undefined },
    ];
    let annotationList;

    for ( const { page, hasNext, prevNum, nextNum } of data ) {
      annotationList = toAnnotationList({
        resources: [],
        annotationListId: testUrl.href,
        page: page,
        hasNext: hasNext,
      });
      t.assert.deepStrictEqual(getPagePrev(annotationList)==prevNum, true);
      t.assert.deepStrictEqual(getPageNext(annotationList)==nextNum, true);
    }

  })

})
