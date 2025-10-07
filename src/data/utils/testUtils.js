/**
 * utilities and generally useful functions for tests.
 */

/** @typedef {import("#types").NodeTestType} NodeTestType */
/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */
/** @typedef {import("#types").FastifyReplyType} FastifyReplyType */

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
 * @param {object} obj
 * @returns {void}
 */
const assertObjectKeysInsert = (t, obj) =>
  assertObjectKeys(t, obj, ["insertedCount", "insertedIds"]);

/**
 * @param {NodeTestType} t
 * @param {object} obj
 * @returns {void}
 */
const assertObjectKeysUpdate = (t, obj) =>
  assertObjectKeys(t, obj, ["matchedCount", "modifiedCount", "upsertedCount", "upsertedId"]);

/**
 * @param {NodeTestType} t
 * @param {object} obj
 * @returns {void}
 */
const assertObjectKeysDelete = (t, obj) =>
  assertObjectKeys(t, obj, ["deletedCount"]);

/**
 * @param {NodeTestType} t
 * @param {object} obj
 * @returns {void}
 */
const assertObjectKeysError = (t, obj) =>
  assertObjectKeys(t, obj, ["message", "info", "method", "url", "postBody"]);

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
 * @param {"insert"|"update"|"delete"|"error"} expectedResponse: keyword to define the response schema to test against.
 * @returns {void}
 */
const assertResponseKeys = (t, r, expectedResponse) =>
  expectedResponse === "insert"
    ? assertObjectKeysInsert(t, JSON.parse(r.body))
    : expectedResponse === "update"
      ? assertObjectKeysUpdate(t, JSON.parse(r.body))
      : expectedResponse === "delete"
        ? assertObjectKeysDelete(t, JSON.parse(r.body))
        : assertObjectKeysError(t, JSON.parse(r.body));

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
  assertResponseKeys(t, r, "error");
}

/**
 * @param {NodeTestType} t
 * @param {FastifyReplyType} r
 * @returns {void}
 */
const assertCreateValidResponse = (t, r) => {
  assertStatusCode(t, r, 200);
  assertResponseKeys(t, r, "insert");
}

/**
 * @param {NodeTestType} t
 * @param {FastifyReplyType} r
 * @returns {void}
 */
const assertUpdateValidResponse = (t,r) => {
  assertStatusCode(t, r, 200);
  assertResponseKeys(t, r, "update");
}

/**
 * @param {NodeTestType} t
 * @param {FastifyReplyType} r
 * @returns {void}
 */
const assertDeleteValidResponse = (t,r) => {
  assertStatusCode(t, r, 200);
  assertResponseKeys(t, r, "delete");
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

const testDeleteRouteCurry =
  /** @param {FastifyInstanceType} */
  (fastify) =>
      /**
       * @param {NodeTestType} t
       * @param {string} deleteRoute - route to delete data, with delete parameters embedded
       * @param {number} expectedDeletedCount - number of documents that should be deleted
       */
      async (t, deleteRoute, expectedDeletedCount) => {
        const r = await fastify.inject({
          method: "DELETE",
          url: deleteRoute
        })
        assertDeleteValidResponse(t, r);
        t.assert.deepStrictEqual(JSON.parse(r.body).deletedCount, expectedDeletedCount);
      }


export {
  assertObjectKeys,
  assertObjectKeysError,
  assertObjectKeysInsert,
  assertObjectKeysUpdate,
  assertObjectKeysDelete,
  assertStatusCode,
  assertResponseKeys,
  injectPost,
  assertPostInvalidResponse,
  assertCreateValidResponse,
  assertUpdateValidResponse,
  assertDeleteValidResponse,
  testPostRouteCurry,
  testDeleteRouteCurry
}

