/** @typedef {import("mongodb").ObjectId} ObjectIdType */

/**
 * @typedef InsertResponseType
 * @type {object}
 * @property {number} insertedCount
 * @property {Array<string|ObjectIdType>} insertedIds
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
 * @typedef {"read"|"insert"|"update"|"delete"} MongoOperationsType
 *   the allowed mongo operations.
 */


export {}