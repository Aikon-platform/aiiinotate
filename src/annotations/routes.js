import fastifyPlugin from "fastify-plugin"

/**
 * Encapsulates the routes
 * @param {import('fastify').FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://fastify.dev/docs/latest/Reference/Plugins/#plugin-options
 */
async function routes (fastify, options) {
  const namespace = options.namespace;
  const annotations2 = options.annotations2;

  fastify.get(`/${namespace}/:iiifVersion`, async (request, reply) => {
    console.log(">>>>", annotations2.annotationsCollection.collectionName);
    return {"annotations": "iello"};
    // const annotations = fastify.mongo.db.collection(namespace);
    // const resultsCursor = await annotations.find();
    // return resultsCursor.toArray();  // https://www.mongodb.com/docs/drivers/node/current/crud/query/cursor/#std-label-node-access-cursor
  })
}

export default fastifyPlugin(routes);
