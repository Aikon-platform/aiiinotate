import fastifyPlugin from "fastify-plugin";

import { IIIF_PRESENTATION_3, IIIF_PRESENTATION_3_CONTEXT } from "#utils/iiifUtils.js";

/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */

function addSchemas(fastify, makeSchemaUri) {
  // minimal schema for IIIF manifests3, containing just what we need to process a manifest
  fastify.addSchema({
    $id: makeSchemaUri("manifestPublic"),
    type: "object",
    required: [ "@context", "id", "items" ],
    properties: {
      "@context": { type: "string" },
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
  return fastify
}

export default addSchemas;


