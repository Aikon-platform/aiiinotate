/**
 * create the collections of the database (without schema)
 * - annotations3 : annotations following the w3c Web Annotations standard (used by IIIF 3.0 presentation API)
 * - annotations2 : annotations following the Open Annotations standard (used by IIIF 2.1 presentation API)
 * - manifests3   : IIIF manifests following the IIIF 3.0 presentation API
 * - manifests2   : IIIF manifests following the IIIF 2.1 (and 2.0) presentation API
 */

import { inspectObj } from "#utils/utils.js";

const collectionNames = [
  "annotations3",
  "annotations2",
  "manifests3",
  "manifests2"
];

/**
 * @param {import('mongodb').Db} db
 * @param {import('mongodb').MongoClient} client
 * @returns {Promise<void>}
 */
export const up = async (db, client) => {
  // check if a collection exists before recreating it, otherwise you get NameSpaceExists errors.
  const existingCollectionNames =
    ( await db.listCollections().toArray() ).map(coll => coll.name);

  // create a mongo collection: https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
  for (const colName of collectionNames ) {
    if ( !existingCollectionNames.includes(colName) ) {
      db.createCollection(colName);
    }
  }
};

/**
 * @param {import('mongodb').Db} db
 * @param {import('mongodb').MongoClient} client
 * @returns {Promise<void>}
 */
export const down = async (db, client) => {
  // NOTE : here, `down` does NOT revert the migration: it would delete the collections and their contents, which we don't want. it's ok since this is the first migration.
  // collectionNames.forEach(async (colName) => {
  //   const collection = db.collection(colName);
  //   await collection.drop();
  // })
}

