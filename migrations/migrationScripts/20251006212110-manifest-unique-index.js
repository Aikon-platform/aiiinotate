/** create a unique index on `manifests2.@id` */

const
  colName = "manifests2",
  indexSpec = { "@id": 1 },
  indexOptions = { name: "manifestIdIndex", unique: true };

/**
 * @param {import('mongodb').Db} db
 * @param {import('mongodb').MongoClient} client
 * @returns {Promise<void>}
 */
export const up = async (db, client) => {
  const collection = db.collection(colName);
  const result = await collection.createIndex(indexSpec, indexOptions);
  console.log("created index:", result);
};

/**
 * @param {import('mongodb').Db} db
 * @param {import('mongodb').MongoClient} client
 * @returns {Promise<void>}
 */
export const down = async (db, client) => {
  const collection = db.collection(colName);
  const result = await collection.dropIndex(indexOptions.name);
  console.log("dropped index:", result);
};

