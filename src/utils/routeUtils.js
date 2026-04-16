import { inspectObj, isNonEmptyArray, mergeObjects } from "#utils/utils.js";
import logger from "#utils/logger.js";

import { PAGE_SIZE } from "#constants";

/** @typedef {import("mongodb").UpdateResult} MongoUpdateResultType */
/** @typedef {import("#types").InsertResponseType} InsertResponseType */
/** @typedef {import("#types").UpdateResponseType} UpdateResponseType */
/** @typedef {import("#types").DeleteResponseType} DeleteResponseType */
/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */

/**
 * @param {{ insertedIds: string[]?, preExistingIds: string[]?, fetchErrorIds: string[]?, rejectedIds: string[]? }} insertResponseData
 * @returns {InsertResponseType}
 */
const formatInsertResponse = ({
  insertedIds = [],
  preExistingIds = [],
  fetchErrorIds = [],
  rejectedIds = []
}) => {
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
 * NOTE: fastify only implements top-level `$ref` in responses, using $ref in response schemas is not allowed.
 * in turn, we can't use `{ $ref: makeSchemaUri }` and must resolve schemas instead.
 * @param {FastifyInstanceType} fastify
 * @param {object} okResponseSchema - expected response schema
 */
const makeResponseSchema = (fastify, okResponseSchema) => ({
  200: okResponseSchema,
  500: fastify.schemasRoutes.getSchema("routeResponseError")
})

const makeResponsePostSchema = (fastify) => makeResponseSchema(
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
  logger.error(inspectObj(err));

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

const paginationSchema = {
  page: {
    type: "integer",
    default: 1,
    minimum: 1,
  },
  pageSize: {
    type: "integer",
    default: PAGE_SIZE || 5000,
    minimum: 1,
  }
}
/**
 * add pagination to a route's query parameters in the route's schema definition.
 *
 * @param {Object} queryObj - a JSONSchema defined in a route's `schema.query` field
 * @returns
 */
const addPagination = (queryObj) => {
  queryObj.properties = mergeObjects(queryObj.properties, paginationSchema, true);
  return queryObj;
}

export {
  formatInsertResponse,
  formatUpdateResponse,
  formatDeleteResponse,
  makeResponsePostSchema,
  makeResponseSchema,
  returnError,
  addPagination
}