/** create a unique index on `manifests2.@id` */

const
  colName = "manifestss2",
  indexSpec = { "@id": 1 },
  indexOptions = { name: "manifestIdIndex", unique: true };

/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const up = async (db, client) => {
  const collection = db.collection(colName);
  const result = await collection.createIndex(indexSpec, indexOptions);
  console.log("created index:", result);
};

/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const down = async (db, client) => {
  const collection = db.collection(colName);
  const result = await collection.dropIndex(indexOptions.name);
  console.log("dropped index:", result);
};

