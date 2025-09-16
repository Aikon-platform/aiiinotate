import fastifyPlugin from "fastify-plugin"

import { pathToUrl } from "#data/utils/utils.js";

async function commonRoutes(fastify, options) {
  const
    { annotations2, annotations3 } = options,
    iiifSearchApiVersion = fastify.schemasBase.getSchema("search"),
    iiifAnnotationList = fastify.schemasPresentation2.getSchema("annotationList");

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
        },
        response: {
          200: iiifAnnotationList
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