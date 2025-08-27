/**
 * create a text index in collection `annotations2` on annotation targets;
 * indexes key is `on.full` that describes the target canvases for each annotation.
 */

const
  colName = "annotations2",
  indexSpec = { "on.full": 1 };

/**
 * @param {import('mongodb').Db} db
 * @param {import('mongodb').MongoClient} client
 * @returns {Promise<void>}
 */
export const up = async (db, client) => {
  const collection = db.collection(colName);
  const result = await collection.createIndex(indexSpec);
  console.log("created index:", result);
};

/**
 * @param {import('mongodb').Db} db
 * @param {import('mongodb').MongoClient} client
 * @returns {Promise<void>}
 */
export const down = async (db, client) => {
  const collection = db.collection(colName);
  const result = await collection.dropIndex(indexSpec);
  console.log("dropped index:", result);
};
