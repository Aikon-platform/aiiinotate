import fastifyPlugin from 'fastify-plugin'

import { annotationSchema } from '#annotation/annotationModel.js'

const collectionName = "annotation";

/**
 * @param {import("mongodb").Db} db
 * @param {object} options
 * @returns {Promise<import("mongodb").Collection>}
 */
function createAnnotationCollection(db) {
  return db.createCollection(collectionName, {
    validator: annotationSchema
  })
}

/**
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} options
 */
async function annotation(fastify, options) {
  const db = fastify.mongo.db;

  // const names = db.listCollections({}, { nameOnly: true })
  // console.log(names)
  // console.log("collList", names);

  const collection = db.collection(collectionName);

  db.runCommand({
    collMod: collectionName,
    validator: annotationSchema
  })
  // console.log("aaa", collection)

  // const collNamesCursor = db.listCollections({}, { nameOnly: true });
  // const collNames = (await collNamesCursor.toArray()).map(x => x.name)
  // console.log("vvv", collNames)
  // console.log("xxx", typeof(collNames), Array.isArray(collNames))
  // console.log("***", collNames.includes(collectionName))


  return
}

export default fastifyPlugin(annotation)
