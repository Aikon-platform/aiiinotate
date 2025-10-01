/** @typedef {import("node:test")} NodeTestType */

/** @typedef {import("fastify").FastifyInstance} FastifyInstanceType */
/** @typedef {import("fastify").FastifyReply} FastifyReplyType */

/** @typedef {import("mongodb").ObjectId } MongoObjectId */
/** @typedef {import("mongodb").Collection} MongoCollectionType */
/** @typedef {import("mongodb").InsertManyResult} MongoInsertManyResultType */
/** @typedef {import("mongodb").InsertOneResult} MongoInsertOneResultType */
/** @typedef {MongoInsertManyResultType | MongoInsertOneResultType} MongoInsertResultType */
/** @typedef {import("mongodb").UpdateResult} MongoUpdateResultType */
/** @typedef {import("mongodb").DeleteResult} MongoDeleteResultType */

/** @typedef {"uri"|"manifestShortId"|"canvasUri"} DeleteByType */

/** @typedef {2|3} IiifPresentationVersionType */

/**
 * @typedef InsertResponseType
 * @type {object}
 * @property {number} insertedCount
 * @property {Array<string|MongoObjectId>} insertedIds
 */

/**
 * @typedef {Array<InsertResponseType>} InsertResponseArrayType
 */

/**
 * @typedef UpdateResponseType
 * @type {object}
 * @property {number} matchedCount
 * @property {number} modifiedCount
 * @property {number} upsertedCount
 * @property {string?} [upsertedId]
 */

/**
 * @typedef DeleteResponseType
 * @type {object}
 * @property {number} deletedCount
 */

/**
 * @typedef {"read"|"insert"|"update"|"delete"} DataOperationsType
 *   the allowed mongo operations.
 */

/**
 * @typedef ManifestType
 *   app and database-side structure of IIIF manifests
 * @type {object}
 * @property {string} ["@id"] - the manifest's '@id'
 * @property {string} manifestShortId
 * @property {string[]} canvasIds
 */

export {}