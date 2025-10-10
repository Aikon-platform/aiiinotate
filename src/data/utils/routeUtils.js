import { inspectObj } from "#utils/utils.js";

/** @typedef {import("mongodb").UpdateResult} MongoUpdateResultType */
/** @typedef {import("#types").InsertResponseType} InsertResponseType */
/** @typedef {import("#types").UpdateResponseType} UpdateResponseType */
/** @typedef {import("#types").DeleteResponseType} DeleteResponseType */
/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */

/**
 * TODO: update to handle nvx cas de figure (preExistingIds, rejectedIds)
 * @param {string[]} insertedIds
 * @returns {InsertResponseType}
 */
const formatInsertResponse = (insertedIds) => {
  if ( !Array.isArray(insertedIds) ) {
    throw new Error(`formatInsertResponse: Type error: expected array of IDs, got '${typeof insertedIds}' on ${insertedIds}`)
  }
  return {
    insertedCount: insertedIds.length,
    insertedIds: insertedIds
  }
}

/**
 * @param {UpdateResponseType} mongoRes
 * @returns {UpdateResponseType}
 */
const formatUpdateResponse = (mongoRes) => ({
  matchedCount: mongoRes.matchedCount,
  modifiedCount: mongoRes.modifiedCount,
  upsertedCount: mongoRes.upsertedCount,
  upsertedId: mongoRes.upsertedId
});

/**
 * @param {DeleteResponseType} mongoRes
 * @returns {DeleteResponseType}
 */
const formatDeleteResponse = (mongoRes) => ({
  deletedCount: mongoRes.deletedCount
});

/**
 * functionnal alternative to `formatInsertResponse`, that aldready expects a formatted object
 * @param {string[]?} insertedIds
 * @param {string[]?} preExistingIds
 * @param {string[]?} fetchErrorIds
 * @param {string[]?} rejectedIds
 * @returns {InsertResponseType}
 */
const toInsertResponse = (insertedIds, preExistingIds, fetchErrorIds, rejectedIds) => {
  const out = {
    insertedCount: insertedIds?.length || 0,
    insertedIds: insertedIds || [],
  };
  if ( fetchErrorIds?.length ) {
    out.fetchErrorIds = fetchErrorIds;
  }
  if ( rejectedIds?.length ) {
    out.rejectedIds = rejectedIds;
  }
  if ( preExistingIds?.length ) {
    out.preExistingIds = preExistingIds;
  };
  return out;
}

/**
 * NOTE: fastify only implements top-level `$ref` in responses, so doing `anyOf: [ { $ref: ... } ]` is not allowed.
 * in turn, we can't use `{ $ref: makeSchemaUri }` and must resolve schemas instead.
 * @param {FastifyInstanceType} fastify
 * @param {object} okResponseSchema - expected response schema
 */
const makeResponseSchema = (fastify, okResponseSchema) => ({
  200: okResponseSchema,
  500: fastify.schemasRoutes.getSchema("routeResponseError")
})

const makeResponsePostSchena = (fastify) => makeResponseSchema(
  fastify,
  {
    anyOf: [
      fastify.schemasRoutes.getSchema("routeResponseInsert"),
      fastify.schemasRoutes.getSchema("routeResponseUpdate"),
      fastify.schemasRoutes.getSchema("routeResponseDelete"),
    ]
  }
);

/**
 *
 * @param {import("fastify").FastifyRequest} request
 * @param {import("fastify").FastifyReply} reply
 * @param {Error} err: the error we're returning
 * @param {number} statusCode - the status code (defaults to 500)
 * @param {any?} requestBody: the data on which the error occurred, for POST requests
 */
const returnError = (request, reply, err, requestBody={}, statusCode=500) => {
  // otherwise, the error is not logged, bad for debugging.
  console.error(inspectObj(err));

  const error = {
    message: `failed ${request.method.toLocaleUpperCase()} request because of error: ${err.message}`,
    info: err.info || {},
    method: request.method,
    url: request.url
  };
  if ( requestBody !== undefined ) {
    error.requestBody = requestBody
  }
  reply
    .status(statusCode)
    .header("Content-Type", "application/json; charset=utf-8")
    .send(error);
}

export {
  formatInsertResponse,
  formatUpdateResponse,
  formatDeleteResponse,
  toInsertResponse,
  makeResponsePostSchena,
  makeResponseSchema,
  returnError
}