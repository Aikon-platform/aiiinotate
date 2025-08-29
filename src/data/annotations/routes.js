import fastifyPlugin from "fastify-plugin"

import { pathToUrl } from "#data/utils.js";

/**
 * Encapsulates the routes
 * @param {import('fastify').FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://fastify.dev/docs/latest/Reference/Plugins/#plugin-options
 */
async function annotationsRoutes (fastify, options) {
  const namespace = options.namespace;
  const annotations2 = options.annotations2;
  const annotations3 = options.annotations3;

  const { iiifPresentationApiVersion } = fastify.getSchemas();

  fastify.get(
    "/annotations/:iiifPresentationVersion/search",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            iiifPresentationVersion: iiifPresentationApiVersion
          }
        },
        querystring: {
          type: "object",
          properties: {
            uri: { type: "string" },
            asAnnotationList: { type: "boolean" },
          }
        },
      },
    },
    async (request, reply) => {
      const
        queryUrl = pathToUrl(request.url),
        { iiifPresentationVersion } = request.params,
        { uri, asAnnotationList } = request.query;

      if ( iiifPresentationVersion === 2 ) {
        const res = annotations2.findFromCanvasUri(queryUrl, uri, asAnnotationList);
        return res;
      } else {
        annotations3.notImplementedError();
      }
    })
}

export default fastifyPlugin(annotationsRoutes);
