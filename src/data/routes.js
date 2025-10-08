import fastifyPlugin from "fastify-plugin"

import { pathToUrl, ajvCompile, inspectObj, getFirstNonEmptyPair } from "#utils/utils.js";
import { returnError, makeResponsePostSchena } from "#utils/routeUtils.js";

/** @typedef {import("#types").Manifests2InstanceType} Manifests2InstanceType */
/** @typedef {import("#types").Manifests3InstanceType} Manifests3InstanceType */
/** @typedef {import("#types").Annotations2InstanceType} Annotations2InstanceType */
/** @typedef {import("#types").Annotations3InstanceType} Annotations3InstanceType */

/**
 * @param {FastifyInstanceType} fastify
 * @param {object} options
 * @param {Function} done
 */
function commonRoutes(fastify, options, done) {
  const
    /** @type {Annotations2InstanceType} */
    annotations2 = fastify.annotations2,
    /** @type {Annotations3InstanceType} */
    annotations3 = fastify.annotations3,
    /** @type {Manifests2InstanceType} */
    manifests2 = fastify.manifests2,
    /** @type {Manifests3InstanceType} */
    manifests3 = fastify.manifests3,
    iiifPresentationVersionSchema = fastify.schemasBase.getSchema("presentation"),
    iiifSearchApiVersionSchema = fastify.schemasBase.getSchema("search"),
    iiifAnnotationListSchema = fastify.schemasPresentation2.getSchema("annotationList"),
    routeDeleteSchema = fastify.schemasRoutes.getSchema("routeDelete"),
    responsePostSchema = makeResponsePostSchena(fastify),
    validatorRouteAnnotationDeleteSchema = ajvCompile(fastify.schemasToMongo(
      fastify.schemasRoutes.getSchema("routeAnnotationDelete")
    )),
    validatorRouteManifestDeleteSchema = ajvCompile(fastify.schemasToMongo(
      fastify.schemasRoutes.getSchema("routeManifestDelete")
    ));

  fastify.get(
    "/search-api/:iiifSearchVersion/manifests/:manifestShortId/search",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            iiifSearchVersion: iiifSearchApiVersionSchema,
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
          200: iiifAnnotationListSchema
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
  );

  /////////////////////////////////////////////
  // DELETE routes

  /**
   * manifest and annotations work in the same manner, so we group them here.
   * we add a custom `preHandler` to ensure that `queryString` follows the proper schema.
   */
  fastify.delete(
    "/:collectionName/:iiifPresentationVersion/delete",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            collectionName: { type: "string", enum: [ "annotations", "manifests" ] },
            iiifPresentationVersion: iiifPresentationVersionSchema
          }
        },
        queryString: routeDeleteSchema,
        response: responsePostSchema,
      },
      preValidation: async (request, reply) => {
        // implement a custom validation hook: depending on the value of `collectionName`, run different schema validations.
        const
          { collectionName } = request.params,
          query = request.query,
          validator =
            collectionName==="annotations"
              ? validatorRouteAnnotationDeleteSchema
              : validatorRouteManifestDeleteSchema,
          error = new Error(`Error validating DELETE route on collection '${collectionName}' with queryString '${inspectObj(query)}'`);

        if ( !validator(query) ) {
          returnError(request, reply, error, {}, 400);
        }
        return;
      }
    },
    async (request, reply) => {
      const
        { collectionName, iiifPresentationVersion } = request.params,
        [ deleteKey, deleteVal ] = getFirstNonEmptyPair(request.query);

      try {
        if ( collectionName==="annotations" ) {
          return iiifPresentationVersion === 2
            ? await annotations2.deleteAnnotations(deleteKey, deleteVal)
            : annotations3.notImplementedError();
        } else {
          return iiifPresentationVersion === 2
            ? await manifests2.deleteManifest(deleteKey, deleteVal)
            : manifests3.notImplementedError();
        }
      } catch (err) {
        returnError(request, reply, err, request.body);
      }

    }
  )

  done();
}

export default fastifyPlugin(commonRoutes);