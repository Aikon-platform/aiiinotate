/**
 * create and manage indexes for the collection `annotations2`
 */

import {createIndex, removeIndex} from "../manageIndex.js";


// all filters on arrays are MultiKey index => it NOT a Sort index, but an Equality index (useful for filters)
const indexes = [
  {
    colName: "annotations2",
    indexSpec: { "@id": 1 },
    indexOptions: { name: "annotationIdIndex" }
  },
  {
    colName: "annotations2",
    indexSpec: { "on.full": 1 },
    indexOptions: { name: "canvasIdIndex" }
  },
  {
    colName: "annotations2",
    indexSpec: { "on.manifestUri": 1 },
    indexOptions: { name: "manifestIdIndex" }
  },
  {
    colName: "annotations2",
    indexSpec: { "on.manifestShortId": 1 },
    indexOptions: { name: "manifestShortIdIndex" }
  },
  {
    colName: "annotations2",
    indexSpec: { "on.canvasIdx": 1 },
    indexOptions: { name: "canvasIdxIndex" }
  },
  {
    colName: "annotations2",
    indexSpec: { "on.resource.@id": 1 },
    indexOptions: { name: "resourceIdIndex" }
  },
  {
    colName: "annotations2",
    indexSpec: { "on.resource.chars": 1 },
    indexOptions: { name: "resourceCharsIndex" }
  }
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
