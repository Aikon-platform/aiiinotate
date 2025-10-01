/**
 * utilities and generally useful functions for tests.
 */

/** @typedef {import("#data/types.js").NodeTestType} NodeTestType */
/** @typedef {import("#data/types.js").FastifyInstanceType} FastifyInstanceType */
/** @typedef {import("#data/types.js").FastifyReplyType} FastifyReplyType */

/**
 * @param {NodeTestType} t
 * @param {object} obj
 * @param {Array} expectedKeys
 * @returns {void}
 */
const assertObjectKeys = (t, obj, expectedKeys) =>
  t.assert.deepStrictEqual(
    Object.keys(obj).sort(),
    expectedKeys.sort()
  );

/**
 * @param {NodeTestType} t
 * @param {FastifyReplyType} r
 * @param {number} expectedStatusCode
 * @returns {void}
 */
const assertStatusCode = (t, r, expectedStatusCode) =>
  t.assert.deepStrictEqual(r.statusCode, expectedStatusCode);

/**
 * @param {NodeTestType} t
 * @param {FastifyReplyType} r
 * @param {Array} expectedResponseKeys
 * @returns {void}
 */
const assertResponseKeys = (t, r, expectedResponseKeys) =>
  assertObjectKeys(t, JSON.parse(r.body), expectedResponseKeys);

/**
 * @param {FastifyInstanceType} fastify
 * @param {string} route
 * @param {object} payload
 * @returns {Promise<FastifyReplyType>}
 */
const injectPost = (fastify, route, payload) =>
  fastify.inject({
    method: "POST",
    url: route,
    payload: payload,
  });

/**
 * @param {NodeTestType} t
 * @param {FastifyReplyType} r
 * @returns {void}
 */
const assertPostInvalidResponse = (t, r) => {
  assertStatusCode(t, r, 500);
  assertResponseKeys(t, r, ["message", "info", "method", "url", "postBody"].sort());
}

/**
 * @param {NodeTestType} t
 * @param {FastifyReplyType} r
 * @returns {void}
 */
const assertCreateValidResponse = (t, r) => {
  assertStatusCode(t, r, 200);
  assertResponseKeys(t, r, ["insertedCount", "insertedIds"]);
}

/**
 * @param {NodeTestType} t
 * @param {FastifyReplyType} r
 * @returns {void}
 */
const assertUpdateValidResponse = (t,r) => {
  assertStatusCode(t, r, 200);
  assertResponseKeys(t, r, ["matchedCount", "modifiedCount", "upsertedCount", "upsertedId"]);
}

/**
 * @param {NodeTestType} t
 * @param {FastifyReplyType} r
 * @returns {void}
 */
const assertDeleteValidResponse = (t,r) => {
  assertStatusCode(t, r, 200);
  assertResponseKeys(t, r, ["deletedCount"]);
}

/**
 * curried function to test  different operations with a post route.
 * @param {FastifyInstanceType} fastify
 */
const testPostRouteCurry = (fastify) =>
  /** @param {DataOperationsType} op */
  (op) =>
    /** @param {boolean} success: if `true` test that the query succeeds. else, test that it fails */
    (success) =>
      /**
       * @param {NodeTestType} t
       * @param {string} route: example: /annotations/2/createMany
       * @param {object} payload
       */
      async (t, route, payload) => {
        const
          r = await injectPost(fastify, route, payload),
          funcInvalid = assertPostInvalidResponse;

        let funcValid;
        if ( op==="insert" ) {
          funcValid = assertCreateValidResponse;
        } else if ( op==="update" ) {
          funcValid = assertUpdateValidResponse;
        } else {
          throw new Error(`testPostRouteCurry: unimplemented value of 'op': '${op}'.`)
        }

        success
          ? funcValid(t, r)
          : funcInvalid(t, r);
        return;
      }


export {
  assertObjectKeys,
  assertStatusCode,
  assertResponseKeys,
  injectPost,
  assertPostInvalidResponse,
  assertCreateValidResponse,
  assertUpdateValidResponse,
  assertDeleteValidResponse,
  testPostRouteCurry
}

