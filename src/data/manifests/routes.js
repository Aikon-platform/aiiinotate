import fastifyPlugin from "fastify-plugin";

import { makeResponsePostSchena, returnError } from "#utils/routeUtils.js";
import { objectHasKey } from "#utils/utils.js";

/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */

function manifestsRoutes(fastify, options, done) {
  const
    manifests2 = fastify.manifests2,
    manifests3 = fastify.manifests3,
    iiifPresentationVersionSchema = fastify.schemasBase.getSchema("presentation"),
    responsePostSchema = makeResponsePostSchena(fastify);

  fastify.post(
    "/manifests/:iiifPresentationVersion/create",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            iiifPresentationVersion: iiifPresentationVersionSchema
          }
        },
        body: { $ref: fastify.schemasRoutes.getSchema("manifest2Or3") },
        response: responsePostSchema
      }
    },
    async (request, reply) => {
      const
        { iiifPresentationVersion } = request.params,
        manifestData = request.body;
      try {
        if ( objectHasKey(manifestData, "uri") ) {
          return iiifPresentationVersion === 2
            ? await manifests2.insertManifestFromUri(manifestData.uri)
            : manifests3.notImplementedError();
        } else {
          return iiifPresentationVersion === 2
            ? await manifests2.insertManifest(manifestData)
            : manifests3.notImplementedError();
        }
      } catch (err) {
        returnError(request, reply, err, request.body);
      }
    }
  );

  done();
}

export default fastifyPlugin(manifestsRoutes);

