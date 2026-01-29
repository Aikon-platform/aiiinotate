/** create indexes for manifests2 collection */

import {createIndex, removeIndex} from "../manageIndex.js";

const indexes = [
  {
    colName: "manifests2",
    indexSpec: { "@id": 1 },
    indexOptions: { name: "manifestIdIndex", unique: true }
  },
]

/**
 * @param {import('mongodb').Db} db
 * @param {import('mongodb').MongoClient} client
 * @returns {Promise<void>}
 */
export const up = async (db, client) => {
  for ( const { colName, indexSpec, indexOptions } of indexes ) {
    const result = await createIndex(db, colName, indexSpec, indexOptions);
    console.log("created index:", result);
  }
};

/**
 * @param {import('mongodb').Db} db
 * @param {import('mongodb').MongoClient} client
 * @returns {Promise<void>}
 */
export const down = async (db, client) => {
  for ( const { colName, indexSpec, indexOptions } of indexes ) {
    const result = await removeIndex(db, colName, indexOptions);
    console.log("dropped index:", result);
    }
};
