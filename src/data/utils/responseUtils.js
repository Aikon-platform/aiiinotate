/**
 * return structures for insert/updates/deletes
 * NOTE: ids should be converted to IIIF ids instead of the mongo idss returned by mongo
 */

/** @typedef {import("mongodb").UpdateResult} MongoUpdateResultType */
/** @typedef {import("#types").InsertResponseType} InsertResponseType */
/** @typedef {import("#types").UpdateResponseType} UpdateResponseType */
/** @typedef {import("#types").DeleteResponseType} DeleteResponseType */

/**
 * @param {string[]} insertedIds
 * @returns {InsertResponseType}
 */
const makeInsertResponse = (insertedIds) => ({
  insertedCount: insertedIds.length,
  insertedIds: insertedIds
});

/**
 * @param {UpdateResponseType} mongoRes
 * @returns {UpdateResponseType}
 */
const makeUpdateResponse = (mongoRes) => ({
  matchedCount: mongoRes.matchedCount,
  modifiedCount: mongoRes.modifiedCount,
  upsertedCount: mongoRes.upsertedCount,
  upsertedId: mongoRes.upsertedId
});

/**
 * @param {DeleteResponseType} mongoRes
 * @returns {DeleteResponseType}
 */
const makeDeleteResponse = (mongoRes) => ({
  deletedCount: mongoRes.deletedCount
});

export {
  makeInsertResponse,
  makeUpdateResponse,
  makeDeleteResponse
}