/**
 * schemas for routes. these schemas are more permissive than the database schemas, defined for example in `presentation2`.
 */

import fastifyPlugin from "fastify-plugin";


/** @param {string} slug */
const makeSchemaUri = (slug) =>
  `${process.env.APP_BASE_URL}/schemas/routes/${slug}`;

/**
 * @param {import("fastify").FastifyInstance} fastify
 * @param {"search"|"presentation"} slug
 */
const getSchema = (fastify, slug) =>
  fastify.getSchema(makeSchemaUri(slug));


/**
 *
 * @param {import("fastify").FastifyInstance} fastify
 * @param {object?} options
 * @param {function} done
 */
function addSchemas(fastify, options, done) {

  fastify.addSchema({
    $id: makeSchemaUri("routeAnnotation2"),
    type: "object",
    required: [ "@id", "@type", "motivation", "on" ],
    properties: {
      "@id": { type: "string" },
      "@type": { type: "string" },
      motivation: { anyOf: [
        { type: "string", enum: [ "oa:Annotation" ] },
        { type: "array", items: { type: "string" }}
      ]},
      on: { anyOf: [{ type: "string" }, { type: "object" }]}
    }
  });

  fastify.addSchema({
    $id: makeSchemaUri("routeAnnotation3"),
    type: "object",
    required: [ "id", "type", "motivation", "target" ],
    properties: {
      id: { type: "string" },
      type: { type: "string", enum: ["Annotation"] },
      motivation: { anyOf: [
        { type: "string" },
        { type: "array", items: { type: "string" } },
      ]},
      target: { anyOf: [{ type: "string" }, { type: "object" }]}
    }
  })

  fastify.addSchema({
    $id: makeSchemaUri("routeAnnotation2Or3"),
    anyOf: [
      { $ref: makeSchemaUri("routeAnnotation2") },
      { $ref: makeSchemaUri("routeAnnotation3") }
    ]
  });

  fastify.addSchema({
    $id: makeSchemaUri("routeAnnotationListOrPageUri"),
    type: "object",
    required: ["uri"],
    properties: {
      "uri": { type: "string" },
    }
  });

  fastify.addSchema({
    $id: makeSchemaUri("routeAnnotationListOrPageUriArray"),
    type: "array",
    items: [{ $ref: "routeAnnotationListOrPageUri" }]
  });

  fastify.addSchema({
    $id: makeSchemaUri("routeAnnotationList"),
    type: "object",
    required: ["@id", "@type", "resources"],
    properties: {
      "@context": { type: "string" },  // i don't specify the value because @context may be an URI that points to a JSON that contains several namespaces other than "http://iiif.io/api/presentation/2/context.json"
      "@id": { type: "string" },
      "@type": { type: "string", enum: ["sc:AnnotationList"] },
      "resources": {
        type: "array",
        items: { $ref: makeSchemaUri("routeAnnotation2") }
      }
    }
  })

  fastify.addSchema({
    $id: makeSchemaUri("routeAnnotationPage"),
    type: "object",
    required: ["@id", "@type", "items"],
    properties: {
      "@context": { type: "string" },  // i don't specify the value because @context may be an URI that points to a JSON that contains several namespaces other than "http://iiif.io/api/presentation/2/context.json"
      "id": { type: "string" },
      "type": { type: "string", enum: ["AnnotationPage"] },
      "items": {
        type: "array",
        items: { $ref: makeSchemaUri("routeAnnotation3") }
      }
    }
  });

  fastify.addSchema({
    $id: makeSchemaUri("routeAnnotationListArray"),
    type: "array",
    items: { $ref: makeSchemaUri("routeAnnotationList") }
  });

  fastify.addSchema({
    $id: makeSchemaUri("routeAnnotationPageArray"),
    type: "array",
    items: { $ref: makeSchemaUri("routeAnnotationPage") }
  })

  fastify.addSchema({
    $id: makeSchemaUri("routeAnnotationCreateMany"),
    anyOf: [
      { $ref: makeSchemaUri("routeAnnotationList") },
      { $ref: makeSchemaUri("routeAnnotationPage") },
      { $ref: makeSchemaUri("routeAnnotationListArray") },
      { $ref: makeSchemaUri("routeAnnotationPageArray") },
      { $ref: makeSchemaUri("routeAnnotationListOrPageUri") },
      { $ref: makeSchemaUri("routeAnnotationListOrPageUriArray") },
    ]
  })


  fastify.decorate("schemasRoutes", {
    makeSchemaUri: makeSchemaUri,
    getSchema: (slug) => getSchema(fastify, slug)
  })

  done()
}


export default fastifyPlugin(addSchemas);

