import fastifyPlugin from "fastify-plugin";

import { makeResponsePostSchema, returnError, makeResponseSchema } from "#utils/routeUtils.js";
import { objectHasKey, getFirstNonEmptyPair, visibleLog } from "#utils/utils.js";

/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */
/** @typedef {import("#types").Manifests2InstanceType} Manifests2InstanceType */
/** @typedef {import("#types").Manifests3InstanceType} Manifests3InstanceType */

/**
 * @param {FastifyInstanceType} fastify
 * @param {object} options
 * @param {Function} done
 */
function manifestsRoutes(fastify, options, done) {
  const
    /** @type {Manifests2InstanceType} */
    manifests2 = fastify.manifests2,
    /** @type {Manifests3InstanceType} */
    manifests3 = fastify.manifests3,
    iiifPresentationVersionSchema = fastify.schemasBase.getSchema("presentation"),
    responsePostSchema = makeResponsePostSchema(fastify),
    collectionSchema = makeResponseSchema(fastify, fastify.schemasPresentation2.getSchema("collection"));

  ///////////////////////////////////////////////
  // read routes

  fastify.get(
    "/manifests/:iiifPresentationVersion",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            iiifPresentationVersion: iiifPresentationVersionSchema
          }
        },
        response: collectionSchema,
      }
    },
    async (request, reply) => {
      const { iiifPresentationVersion } = request.params;
      try {
        return iiifPresentationVersion === 2
          ? await manifests2.getManifests()
          : manifests3.notImplementedError();
      } catch (err) {
        returnError(request, reply, err);
      }
    }
  )

  fastify.get(
    "/data/:iiifPresentationVersion/:manifestShortId/index",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            iiifPresentationVersion: iiifPresentationVersionSchema,
            manifestShortId: { type: "string" }
          }
        },
        response: {
          200: { type: "object" }
        }
      }
    },
    async (request, reply) => {
      const { iiifPresentationVersion, manifestShortId } = request.params;
      try {
        return iiifPresentationVersion === 2
          ? await manifests2.findByManifestShortId(manifestShortId)
          : manifests3.notImplementedError();
      } catch (err) {
        returnError(request, reply, err);
      }
    }
  )

  ///////////////////////////////////////////////
  // insert routes

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
          // visibleLog(await manifests2.insertManifest(manifestData));
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

