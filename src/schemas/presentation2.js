import fastifyPlugin from "fastify-plugin";

import { IIIF_PRESENTATION_2, IIIF_PRESENTATION_2_CONTEXT } from "#data/utils/iiifUtils.js";

// TODO: annotations
// specificResource2Schema
//
// annotationTarget2Schema
//
// annotationBody2Schema
//
// annotation2Schema
//
// const annotationList2Schema = {
//   type: "object",
//   title: 'AnnotationList schema',
//   required: ['@id', '@type', '@context', 'resources'],
//   properties: {
//     "@id": { type: "string" },
//   }
// }

/** @param {string} slug */
const makeSchemaUri = (slug) =>
  `${process.env.APP_BASE_URL}/schemas/presentation/${IIIF_PRESENTATION_2}/${slug}`

/**
 * @param {import("fastify").FastifyInstance} fastify
 * @param {"search"|"presentation"} slug
 */
const getSchemaByUri = (fastify, slug) =>
  fastify.getSchema(makeSchemaUri(slug))


function addSchemas(fastify, options, done) {

  fastify.addSchema({
    $id: makeSchemaUri("context"),
    type: "string",
    enum: [ IIIF_PRESENTATION_2_CONTEXT["@context"] ]
  });

  fastify.addSchema({
    $id: makeSchemaUri("annotation"),
    type: "object",
    // required: [ /** TODO */ ],
    properties: {
      "@id": { type: "string" },
      "@context": { $ref: makeSchemaUri("context") },
      // TODO
    }
  });

  fastify.addSchema({
    $id: makeSchemaUri("annotationList"),
    type: "object",
    title: 'AnnotationList schema',
    required: ['@id', '@type', '@context', 'resources'],
    properties: {
      "@id": { type: "string" },
      "@context": { $ref: makeSchemaUri("context") },
      "@type": {
        type: "string",
        enum: [ "oa:Annotation" ]
      },
      "resources": {
        type: "array",
        items: {
          type: { $ref: makeSchemaUri("annotation") }
        }
      }
      // TODO
    }
  });

  fastify.decorate("schemasPresentation2", {
    makeSchemaUri: makeSchemaUri,
    getSchemaByUri: (slug) => getSchemaByUri(fastify, slug)
  }) ;

  done();
}




export default fastifyPlugin(addSchemas)