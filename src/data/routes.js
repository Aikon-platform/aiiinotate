import fastifyPlugin from "fastify-plugin"

import { pathToUrl } from "#data/utils.js";

async function commonRoutes(fastify, options) {
  const { annotations2, annotations3 } = options;

  const { iiifSearchApiVersion } = fastify.getSchemas();

  fastify.get(
    "/search-api/:iiifSearchVersion/manifests/:manifestShortId/search",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            iiifSearchVersion: iiifSearchApiVersion,
            manifestShortId: { type: "string" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            q: { type: "string" },
            motivation: {
              type: "string",
              enum: ["painting", "non-painting", "commenting", "describing", "tagging", "linking"]
            }
          }
        }
      }
    },
    async (request, reply) => {
      const
        queryUrl = pathToUrl(request.url),
        { iiifSearchVersion, manifestShortId } = request.params,
        { q, motivation } = request.query;

      if ( iiifSearchVersion===1 ) {
        return await annotations2.search(queryUrl, manifestShortId, q, motivation);
      } else {
        annotations3.notImplementedError();
      }
    }
  )
}

export default fastifyPlugin(commonRoutes);