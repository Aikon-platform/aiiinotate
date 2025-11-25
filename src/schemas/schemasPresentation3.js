import fastifyPlugin from "fastify-plugin";

import { IIIF_PRESENTATION_3, IIIF_PRESENTATION_3_CONTEXT } from "#utils/iiifUtils.js";

/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */

/** @param {string} slug */
const makeSchemaUri = (slug) =>
  `${process.env.AIIINOTATE_BASE_URL}/schemas/presentation/${IIIF_PRESENTATION_3}/${slug}`

/**
 * @param {FastifyInstanceType} fastify
 * @param {"search"|"presentation"} slug
 */
const getSchema = (fastify, slug) =>
  fastify.getSchema(makeSchemaUri(slug))

function addSchemas(fastify, options, done) {

  fastify.addSchema({
    $id: makeSchemaUri("context"),
    type: "string",
    enum: [ IIIF_PRESENTATION_3_CONTEXT["@context"] ]
  });

  // minimal schema for IIIF manifests3, containing just what we need to process a manifest
  fastify.addSchema({
    $id: makeSchemaUri("manifestPublic"),
    type: "object",
    required: [ "@context", "id", "items" ],
    properties: {
      "@context": { $ref: makeSchemaUri("context") },
      id: { type: "string" },
      items: {
        type: "array",
        items: {
          type: "object",
          required: [ "id" ],
          properties: {
            id: { type: "string" }
          }
        }
      }
    }
  });

  fastify.decorate("schemasPresentation3", {
    makeSchemaUri: makeSchemaUri,
    getSchema: (slug) => getSchema(fastify, slug)
  });

  done()
}

export default fastifyPlugin(addSchemas);


