import fastifyPlugin from "fastify-plugin"

const IIIF_VERSION_SCHEMA = {
  type: "integer",
  enum: [1, 2],
  description: 'IIIF versions'
};


/**
 * Encapsulates the routes
 * @param {import('fastify').FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://fastify.dev/docs/latest/Reference/Plugins/#plugin-options
 */
async function routes (fastify, options) {
  const namespace = options.namespace;
  const annotations2 = options.annotations2;

  fastify.get(
    `/annotations/:iiifVersion/search`,
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            uri: { type: "string" },
          }
        },
        params: {
          type: "object",
          properties: {
            iiifVersion: IIIF_VERSION_SCHEMA
          }
        }
      },
    },
    async (request, reply) => {
      const { iiifVersion } = request.params;
      const { uri } = request.query;

      console.log(">>>>", annotations2.annotationsCollection.collectionName);
      return {"annotations": "iello"};
      // const annotations = fastify.mongo.db.collection(namespace);
      // const resultsCursor = await annotations.find();
      // return resultsCursor.toArray();  // https://www.mongodb.com/docs/drivers/node/current/crud/query/cursor/#std-label-node-access-cursor
  })
}

export default fastifyPlugin(routes);
