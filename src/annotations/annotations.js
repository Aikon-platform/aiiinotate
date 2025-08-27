import fastifyPlugin from "fastify-plugin"

import Annotations2 from "#annotations/annotations2/annotations2.js";
import routes from "#annotations/routes.js";

/**
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} options
 */
async function annotations(fastify, options) {
  const namespace = "annotations";
  const db = fastify.mongo.db;

  const annotations2 = new Annotations2(
    fastify.mongo.client,
    db
  );

  fastify.register(routes, { namespace, annotations2 });

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
