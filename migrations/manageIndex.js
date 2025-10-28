/**
 * utility functions to create/remove an index
 */

/**
 * @typedef IndexSpecType
 * @type {object}
 * @property {string} indexName - the name of the index we're creating
 * @property {any} [prop] - any other key-value pairs are allowed
 */

/** @typedef {import("mongodb").IndexSpecification} IndexSpecificationType */
/** @typedef {import("mongodb").Db} DbType */
/** @typedef {import("mongodb").CreateIndexesOptions} CreateIndexesOptionsType */


/**
 * @param {CreateIndexesOptionsType} indexOptions - indexOptions.name MUST be defined !
 */
const validateIndexOptions = (indexOptions) => {
  if ( indexOptions.name == null ) {
    throw new Error(`indexOptions.name must be defined !`)
  }
}

/**
 *
 * @param {DbType} db
 * @param {string} collectionName
 * @param {IndexSpecificationType} indexSpec
 * @param {CreateIndexesOptionsType} indexOptions - indexOptions.name MUST be defined !
 */
async function createIndex(db, collectionName, indexSpec, indexOptions) {
  validateIndexOptions(indexOptions);
  const collection = db.collection(collectionName);
  const result = await collection.createIndex(indexSpec, indexOptions);
  console.log("created index:", result);
}

/**
 * @param {DbType} db
 * @param {string} collectionName
 * @param {CreateIndexesOptionsType} indexOptions - indexOptions.name MUST be defined !
 */
async function removeIndex(db, collectionName, indexOptions) {
  validateIndexOptions(indexOptions);
  const collection = db.collection(collectionName);
  const result = await collection.dropIndex(indexOptions.name);
  console.log("dropped index:", result);
}

export {
  createIndex,
  removeIndex
}