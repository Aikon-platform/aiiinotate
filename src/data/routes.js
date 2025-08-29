import fastifyPlugin from "fastify-plugin"

async function commonRoutes(fastify, options) {
  const { annotations2, annotations3 } = options;

  const { iiifSearchApiVersion } = fastify.getSchemas();

  fastify.get(
    "/search-api/:iiifSearchApiVersion/manifests/:manifestShortId/search",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            iiifSearchApiVersion: iiifSearchApiVersion,
            manifestShortId: { type: "string" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            q: { type: "string" },
            motivation: { type: "string" }
          }
        }
      }
    },
    async (request, reply) => {
      // ...
    }
  )
}

export default fastifyPlugin(commonRoutes);