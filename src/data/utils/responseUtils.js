/**
 * return structures for insert/updates/deletes
 * NOTE: ids should be converted to IIIF ids instead of the mongo idss returned by mongo
 */

/** @typedef {import("mongodb").UpdateResult} MongoUpdateResultType */
/** @typedef {import("#types").InsertResponseType} InsertResponseType */
/** @typedef {import("#types").UpdateResponseType} UpdateResponseType */
/** @typedef {import("#types").DeleteResponseType} DeleteResponseType */

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

export {
  formatInsertResponse,
  formatUpdateResponse,
  formatDeleteResponse,
  toInsertResponse
}