/**
 * create the collections of the database (without schema)
 * - annotations3 : annotations following the w3c Web Annotations standard (used by IIIF 3.0 presentation API)
 * - annotations2 : annotations following the Open Annotations standard (used by IIIF 2.1 presentation API)
 * - manifests3   : IIIF manifests following the IIIF 3.0 presentation API
 * - manifests2   : IIIF manifests following the IIIF 2.1 (and 2.0) presentation API
 */

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
  // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
  collectionNames.forEach((colName) => {
    db.createCollection(colName);
  })
};

/**
 * @param {import('mongodb').Db} db
 * @param {import('mongodb').MongoClient} client
 * @returns {Promise<void>}
 */
export const down = async (db, client) => {
  // Example:
  // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  collectionNames.forEach(async (colName) => {
    const collection = db.collection(colName);
    await collection.drop();
  })
}

