import fastifyPlugin from 'fastify-plugin'

import routes from "#annotations/routes.js";

/**
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} options
 */
async function annotations(fastify, options) {
  const db = fastify.mongo.db;
  const namespace = "annotations";

  fastify.register(routes, { namespace });

  // const names = db.listCollections({}, { nameOnly: true })
  // console.log(names)
  // console.log("collList", names);

  // const collNamesCursor = db.listCollections({}, { nameOnly: true });
  // const collNames = (await collNamesCursor.toArray()).map(x => x.name)
  // console.log("vvv", collNames)
  // console.log("xxx", typeof(collNames), Array.isArray(collNames))
  // console.log("***", collNames.includes(collectionName))

  return
}

export default fastifyPlugin(annotations)
