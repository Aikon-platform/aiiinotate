/** @typedef {import("node:test")} NodeTestType */

/** @typedef {import("fastify").FastifyInstance} FastifyInstanceType */
/** @typedef {import("fastify").FastifyReply} FastifyReplyType */

/** @typedef {import("mongodb").Db} MongoDbType */
/** @typedef {import("mongodb").ObjectId } MongoObjectId */
/** @typedef {import("mongodb").Collection} MongoCollectionType */
/** @typedef {import("mongodb").InsertManyResult} MongoInsertManyResultType */
/** @typedef {import("mongodb").InsertOneResult} MongoInsertOneResultType */
/** @typedef {MongoInsertManyResultType | MongoInsertOneResultType} MongoInsertResultType */
/** @typedef {import("mongodb").UpdateResult} MongoUpdateResultType */
/** @typedef {import("mongodb").DeleteResult} MongoDeleteResultType */
/** @typedef {import("mongodb").MongoClient} MongoClientType */

/** @typedef {"uri"|"manifestShortId"|"canvasUri"} DeleteByType */

/** @typedef {2|3} IiifPresentationVersionType */
/** @typedef {"manifests2"|"manifests3"|"annotations2"|"annotations3"} CollectionNamesType */
/**
 * @typedef InsertResponseType
 * @type {object}
 * @property {number} insertedCount - the number of documents that were properly inserted
 * @property {Array<string|MongoObjectId>} insertedIds - the ids of the documents that were properly inserted
 * @property {Array<string>} [fetchErrorIds] - the ids of referenced documents that could not be fetched. USED ONLY BY `manifests2` and `manifests3`
 * @property {{ [x: string]: string }} [rejectedIds] - the ids of the documents that did not pass validation, mapped to validation errors. USED ONLY BY `manifests2` and `manifests3`
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

/**
 * @typedef {import("#manifests/manifests2.js").Manifests2InstanceType} Manifests2InstanceType
 * type of an instance of the Manifests2 class.
 */
/**
 * @typedef {import("#manifests/annotations2.js").Annotations2InstanceType} Annotations2InstanceType
 * type of an instance of the Annotations2 class.
 */
/**
 * @typedef {import("#manifests/manifests3.js").Manifests3InstanceType} Manifests3InstanceType
 * type of an instance of the Manifests3 class.
 */
/**
 * @typedef {import("#manifests/annotations3.js").Annotations3InstanceType} Annotations3InstanceType
 * type of an instance of the Annotations3 class.
 */

export {}